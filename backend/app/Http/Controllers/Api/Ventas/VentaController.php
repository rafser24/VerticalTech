<?php

namespace App\Http\Controllers\Api\Ventas;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ventas\VentaRequest;
use App\Http\Resources\Ventas\VentaResource;
use App\Models\Catalogos\Producto;
use App\Models\Ventas\Venta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Venta::with(['cliente', 'metodoPago', 'usuario'])
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('numero_venta', 'ilike', "%{$s}%")
                      ->orWhereHas('cliente', fn($c) =>
                          $c->where('nombre', 'ilike', "%{$s}%")
                            ->orWhere('apellido', 'ilike', "%{$s}%")
                      )
                )
            )
            ->when($request->filled('estado'), fn($q) =>
                $q->where('estado', $request->estado)
            )
            ->when($request->filled('cliente_id'), fn($q) =>
                $q->where('cliente_id', $request->cliente_id)
            )
            ->when($request->filled('desde') && $request->filled('hasta'), fn($q) =>
                $q->whereBetween('fecha_venta', [
                    $request->desde . ' 00:00:00',
                    $request->hasta . ' 23:59:59',
                ])
            )
            ->orderBy($request->get('sort', 'fecha_venta'), $request->get('dir', 'desc'));

        $resultado = $request->filled('per_page')
            ? $query->paginate((int) $request->per_page)
            : $query->get();

        return $this->success(
            VentaResource::collection($resultado),
            'OK', 200,
            $this->paginationMeta($resultado)
        );
    }

    public function store(VentaRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Verificar stock antes de iniciar la transacción
        $erroresStock = [];
        foreach ($data['items'] as $item) {
            $producto = Producto::find($item['producto_id']);
            if (! $producto) {
                $erroresStock[] = "Producto ID {$item['producto_id']} no encontrado.";
                continue;
            }
            if (! $producto->activo) {
                $erroresStock[] = "El producto '{$producto->nombre}' está inactivo.";
            } elseif (! $producto->tieneStock($item['cantidad'])) {
                $erroresStock[] = "Stock insuficiente para '{$producto->nombre}'. "
                    . "Disponible: {$producto->stock}, Solicitado: {$item['cantidad']}.";
            }
        }

        if (! empty($erroresStock)) {
            return $this->error('Error de stock.', 422, $erroresStock);
        }

        $venta = DB::transaction(function () use ($data) {
            $subtotal  = 0;
            $descuento = (float) ($data['descuento'] ?? 0);
            $impuesto  = (float) ($data['impuesto'] ?? 0);

            foreach ($data['items'] as &$item) {
                $item['descuento'] = (float) ($item['descuento'] ?? 0);
                $lineSubtotal      = ($item['cantidad'] * $item['precio_unitario']) - $item['descuento'];
                $subtotal         += $lineSubtotal;
            }
            unset($item);

            $montoDescuento = $descuento > 0
                ? round($subtotal * ($descuento / 100), 2)
                : 0;
            $base          = $subtotal - $montoDescuento;
            $montoImpuesto = $impuesto > 0
                ? round($base * ($impuesto / 100), 2)
                : 0;
            $total = $base + $montoImpuesto;

            $venta = Venta::create([
                'numero_venta'   => $this->generarNumeroVenta(),
                'cliente_id'     => $data['cliente_id'] ?? null,
                'metodo_pago_id' => $data['metodo_pago_id'],
                'usuario_id'     => auth('api')->id(),
                'subtotal'       => $subtotal,
                'descuento'      => round($montoDescuento, 2),
                'impuesto'       => $montoImpuesto,
                'total'          => round($total, 2),
                'estado'         => 'completada',
                'notas'          => $data['notas'] ?? null,
                'fecha_venta'    => $data['fecha_venta'] ?? now(),
            ]);

            foreach ($data['items'] as $item) {
                $venta->detalles()->create([
                    'producto_id'     => $item['producto_id'],
                    'cantidad'        => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'descuento'       => $item['descuento'],
                ]);

                Producto::find($item['producto_id'])
                    ->decrementarStock($item['cantidad']);
            }

            return $venta;
        });

        $venta->load(['cliente', 'metodoPago', 'usuario', 'detalles.producto']);

        return $this->success(new VentaResource($venta), 'Venta registrada exitosamente.', 201);
    }

    public function show(int $i): JsonResponse
    {
        $venta = Venta::with(['cliente', 'metodoPago', 'usuario', 'detalles.producto'])
            ->findOrFail($i);

        return $this->success(new VentaResource($venta));
    }

    // ── Ventas pendientes de transferencia ────────────────────────────────

    /**
     * Lista todas las ventas con estado=pendiente (transferencias sin confirmar).
     * Usado por el Drawer del POS.
     */
    public function pendientes(): JsonResponse
    {
        $ventas = Venta::with(['cliente', 'metodoPago', 'usuario', 'detalles.producto'])
            ->pendiente()
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->success(VentaResource::collection($ventas));
    }

    /**
     * Crea una venta con estado=pendiente (transferencia bancaria aún no confirmada).
     * Descuenta el stock inmediatamente para reservarlo.
     */
    public function storePendiente(VentaRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Verificar stock
        $erroresStock = [];
        foreach ($data['items'] as $item) {
            $producto = Producto::find($item['producto_id']);
            if (! $producto) { $erroresStock[] = "Producto ID {$item['producto_id']} no encontrado."; continue; }
            if (! $producto->activo) { $erroresStock[] = "El producto '{$producto->nombre}' está inactivo."; }
            elseif (! $producto->tieneStock($item['cantidad'])) {
                $erroresStock[] = "Stock insuficiente para '{$producto->nombre}'. Disponible: {$producto->stock}.";
            }
        }
        if (! empty($erroresStock)) {
            return $this->error('Error de stock.', 422, $erroresStock);
        }

        $venta = DB::transaction(function () use ($data) {
            $subtotal  = 0;
            $descuento = (float) ($data['descuento'] ?? 0);

            foreach ($data['items'] as &$item) {
                $item['descuento'] = (float) ($item['descuento'] ?? 0);
                $subtotal += ($item['cantidad'] * $item['precio_unitario']) - $item['descuento'];
            }
            unset($item);

            $montoDescuento = $descuento > 0 ? round($subtotal * ($descuento / 100), 2) : 0;
            $total          = round($subtotal - $montoDescuento, 2);

            $venta = Venta::create([
                'numero_venta'             => $this->generarNumeroVenta(),
                'cliente_id'               => $data['cliente_id'] ?? null,
                'cliente_nombre_manual'    => $data['cliente_nombre_manual'] ?? null,
                'metodo_pago_id'           => $data['metodo_pago_id'],
                'usuario_id'               => auth('api')->id(),
                'subtotal'                 => $subtotal,
                'descuento'                => $montoDescuento,
                'impuesto'                 => 0,
                'total'                    => $total,
                'estado'                   => 'pendiente',
                'notas'                    => $data['notas'] ?? null,
                'referencia_transferencia' => $data['referencia_transferencia'] ?? null,
                'fecha_venta'              => now(),
            ]);

            foreach ($data['items'] as $item) {
                $venta->detalles()->create([
                    'producto_id'     => $item['producto_id'],
                    'cantidad'        => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'descuento'       => $item['descuento'],
                ]);
                // Descontar stock para reservar las unidades
                Producto::find($item['producto_id'])->decrementarStock($item['cantidad']);
            }

            return $venta;
        });

        $venta->load(['cliente', 'metodoPago', 'usuario', 'detalles.producto']);

        return $this->success(new VentaResource($venta), 'Venta registrada — pendiente de confirmación de transferencia.', 201);
    }

    /**
     * Confirma que la transferencia bancaria fue recibida.
     * Cambia estado: pendiente → completada (el stock ya está descontado).
     */
    public function confirmarTransferencia(Venta $venta): JsonResponse
    {
        if ($venta->estado !== 'pendiente') {
            return $this->error('Solo se pueden confirmar ventas en estado pendiente.', 422);
        }

        $venta->update(['estado' => 'completada']);

        return $this->success(new VentaResource($venta->fresh(['cliente', 'metodoPago', 'detalles.producto'])), 'Transferencia confirmada. Venta completada.');
    }

    public function anular(Venta $venta): JsonResponse
    {
        if (in_array($venta->estado, ['anulada', 'cancelada'])) {
            return $this->error('La venta ya está anulada.', 422);
        }

        DB::transaction(function () use ($venta) {
            $venta->load('detalles');
            foreach ($venta->detalles as $detalle) {
                Producto::find($detalle->producto_id)
                    ?->incrementarStock($detalle->cantidad);
            }
            $venta->update(['estado' => 'anulada']);
        });

        return $this->success(null, 'Venta anulada y stock restaurado.');
    }

    // ──────────────────────────────────────────────────────────────────────
    private function generarNumeroVenta(): string
    {
        $anio = now()->format('Y');

        /*
         * CORRECCIÓN: PostgreSQL no permite FOR UPDATE con COUNT (funciones
         * de agregación). Se eliminó ->lockForUpdate() que causaba:
         * "SQLSTATE[0A000]: FOR UPDATE no está permitido con funciones de agregación"
         *
         * El count() sin lock es suficiente para generar el correlativo.
         * Si se requiere concurrencia estricta, usar una secuencia de BD.
         */
        $ultimo = Venta::whereYear('created_at', $anio)->count();

        return 'VTA-' . $anio . '-' . str_pad($ultimo + 1, 6, '0', STR_PAD_LEFT);
    }
}
