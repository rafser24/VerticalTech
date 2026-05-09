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
            // Calcular totales
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
            $base       = $subtotal - $montoDescuento;
            $montoImpuesto = $impuesto > 0
                ? round($base * ($impuesto / 100), 2)
                : 0;
            $total = $base + $montoImpuesto;

            // Crear cabecera
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

            // Crear detalles y decrementar stock
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

    public function show(Venta $venta): JsonResponse
    {
        $venta->load(['cliente', 'metodoPago', 'usuario', 'detalles.producto']);

        return $this->success(new VentaResource($venta));
    }

    /**
     * PATCH /api/ventas/{venta}/cancelar
     * Solo se puede cancelar si está en estado "completada" y devuelve stock.
     */
    public function cancelar(Venta $venta): JsonResponse
    {
        if ($venta->estado === 'cancelada') {
            return $this->error('La venta ya está cancelada.', 422);
        }

        DB::transaction(function () use ($venta) {
            // Devolver stock
            foreach ($venta->detalles as $detalle) {
                Producto::find($detalle->producto_id)
                    ?->incrementarStock($detalle->cantidad);
            }

            $venta->update(['estado' => 'cancelada']);
        });

        return $this->success(message: 'Venta cancelada y stock restaurado.');
    }

    // ──────────────────────────────────────────────────────────
    private function generarNumeroVenta(): string
    {
        $anio = now()->format('Y');
        $ultimo = Venta::whereYear('created_at', $anio)
            ->lockForUpdate()
            ->count();

        return 'VTA-' . $anio . '-' . str_pad($ultimo + 1, 6, '0', STR_PAD_LEFT);
    }
}
