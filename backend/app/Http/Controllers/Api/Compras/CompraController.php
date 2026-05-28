<?php

namespace App\Http\Controllers\Api\Compras;

use App\Http\Controllers\Controller;
use App\Http\Requests\Compras\CompraRequest;
use App\Http\Resources\Catalogos\MetodoPagoResource;
use App\Http\Resources\Catalogos\ProveedorResource;
use App\Http\Resources\Compras\CompraResource;
use App\Models\Catalogos\MetodoPago;
use App\Models\Catalogos\Producto;
use App\Models\Catalogos\Proveedor;
use App\Models\Compras\Compra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompraController extends Controller
{
    /**
     * Inicialización del módulo Compras.
     * Devuelve compras + catálogos del formulario en un solo request.
     */
    public function init(): JsonResponse
    {
        $compras = Compra::with(['proveedor', 'metodoPago', 'usuario'])
            ->orderBy('fecha_compra', 'desc')
            ->get();

        $proveedores = Proveedor::where('activo', true)->orderBy('nombre')
            ->get(['id', 'nombre', 'razon_social']);

        // Solo lo esencial para el selector del formulario
        $productos = Producto::where('activo', true)->orderBy('nombre')
            ->get(['id', 'nombre', 'codigo', 'precio_compra']);

        $metodosPago = MetodoPago::where('activo', true)->orderBy('nombre')->get();

        return $this->success([
            'compras'      => CompraResource::collection($compras),
            'proveedores'  => ProveedorResource::collection($proveedores),
            'productos'    => $productos->map(fn ($p) => [
                'id'            => $p->id,
                'nombre'        => $p->nombre,
                'codigo'        => $p->codigo,
                'precio_compra' => (float) $p->precio_compra,
            ]),
            'metodos_pago' => MetodoPagoResource::collection($metodosPago),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Compra::with(['proveedor', 'metodoPago', 'usuario'])
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('numero_compra', 'ilike', "%{$s}%")
                      ->orWhereHas('proveedor', fn($p) =>
                          $p->where('nombre', 'ilike', "%{$s}%")
                      )
                )
            )
            ->when($request->filled('estado'), fn($q) =>
                $q->where('estado', $request->estado)
            )
            ->when($request->filled('proveedor_id'), fn($q) =>
                $q->where('proveedor_id', $request->proveedor_id)
            )
            ->when($request->filled('desde') && $request->filled('hasta'), fn($q) =>
                $q->whereBetween('fecha_compra', [
                    $request->desde . ' 00:00:00',
                    $request->hasta . ' 23:59:59',
                ])
            )
            ->orderBy($request->get('sort', 'fecha_compra'), $request->get('dir', 'desc'));

        $resultado = $request->filled('per_page')
            ? $query->paginate((int) $request->per_page)
            : $query->get();

        return $this->success(
            CompraResource::collection($resultado),
            'OK', 200,
            $this->paginationMeta($resultado)
        );
    }

    /**
     * Registrar nueva compra — queda en estado "pendiente".
     * El stock NO se toca todavía.
     */
    public function store(CompraRequest $request): JsonResponse
    {
        $data = $request->validated();

        $compra = DB::transaction(function () use ($data) {
            $subtotal  = 0;
            $impuesto  = (float) ($data['impuesto'] ?? 0);
            $descuento = (float) ($data['descuento'] ?? 0);

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

            $compra = Compra::create([
                'numero_compra'  => $this->generarNumeroCompra(),
                'proveedor_id'   => $data['proveedor_id'],
                'metodo_pago_id' => $data['metodo_pago_id'],
                'usuario_id'     => auth('api')->id(),
                'subtotal'       => round($subtotal, 2),
                'descuento'      => round($montoDescuento, 2),
                'impuesto'       => $montoImpuesto,
                'total'          => round($total, 2),
                'estado'         => 'pendiente',
                'notas'          => $data['notas'] ?? null,
                'fecha_compra'   => $data['fecha_compra'] ?? now(),
            ]);

            foreach ($data['items'] as $item) {
                $compra->detalles()->create([
                    'producto_id'     => $item['producto_id'],
                    'cantidad'        => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'descuento'       => $item['descuento'],
                ]);
                // Stock NO se modifica aquí
            }

            return $compra;
        });

        $compra->load(['proveedor', 'metodoPago', 'usuario', 'detalles.producto']);

        return $this->success(new CompraResource($compra), 'Compra registrada. En espera de confirmación.', 201);
    }

    public function show(int $i): JsonResponse
    {
        $compra = Compra::with(['proveedor', 'metodoPago', 'usuario', 'detalles.producto'])
            ->findOrFail($i);

        return $this->success(new CompraResource($compra));
    }

    /**
     * Confirmar compra: pendiente → confirmada
     * El proveedor aceptó el pedido pero aún no entrega.
     */
    public function confirmar(int $i): JsonResponse
    {
        $compra = Compra::findOrFail($i);

        if ($compra->estado !== 'pendiente') {
            return $this->error("Solo se puede confirmar una compra pendiente. Estado actual: {$compra->estado}.", 422);
        }

        $compra->update(['estado' => 'confirmada']);

        return $this->success(new CompraResource($compra->fresh()), 'Compra confirmada. Esperando recepción de mercancía.');
    }

    /**
     * Recibir compra: confirmada → recibida
     * La mercancía llegó — aquí se sube el stock.
     *
     * OPTIMIZACIÓN: en lugar de iterar con Eloquent (N+1 queries + caché por cada
     * producto), se usa DB::table() con un UPDATE directo por fila y se invalida
     * el caché UNA sola vez al final, fuera de la transacción.
     */
    public function recibir(int $i): JsonResponse
    {
        $compra = Compra::with('detalles')->findOrFail($i);

        if ($compra->estado !== 'confirmada') {
            return $this->error("Solo se puede recibir una compra confirmada. Estado actual: {$compra->estado}.", 422);
        }

        DB::transaction(function () use ($compra) {
            $now = now();
            foreach ($compra->detalles as $detalle) {
                // UPDATE directo: suma stock + actualiza precio_compra en una sola query,
                // sin cargar el modelo ni disparar eventos Eloquent dentro del loop.
                DB::table('productos')
                    ->where('id', $detalle->producto_id)
                    ->whereNull('deleted_at')
                    ->update([
                        'stock'         => DB::raw("stock + {$detalle->cantidad}"),
                        'precio_compra' => $detalle->precio_unitario,
                        'updated_at'    => $now,
                    ]);
            }
            $compra->update([
                'estado'          => 'recibida',
                'fecha_recepcion' => $now,
            ]);
        });

        // Invalida caché una sola vez, fuera de la transacción.
        // Cubre: lista de productos, POS (stock + precios), dashboard y compras.
        (new Producto)->invalidateCache(['productos', 'pos', 'dashboard', 'compras']);

        $compra->load(['proveedor', 'metodoPago', 'usuario', 'detalles.producto']);

        return $this->success(new CompraResource($compra), 'Compra recibida. Stock actualizado.');
    }

    /**
     * Anular compra: solo desde pendiente o confirmada.
     * Si ya fue recibida el stock ya entró — no se puede anular.
     */
    public function anular(int $i): JsonResponse
    {
        $compra = Compra::findOrFail($i);

        if ($compra->estado === 'anulada') {
            return $this->error('La compra ya está anulada.', 422);
        }

        if ($compra->estado === 'recibida') {
            return $this->error('No se puede anular una compra ya recibida. El stock ya fue ingresado.', 422);
        }

        $compra->update(['estado' => 'anulada']);

        return $this->success(null, 'Compra anulada.');
    }

    /**
     * Retroceder una etapa:
     * recibida  → confirmada (revierte stock)
     * confirmada → pendiente
     */
    public function retroceder(int $i): JsonResponse
    {
        $compra = Compra::with('detalles')->findOrFail($i);

        if ($compra->estado === 'pendiente') {
            return $this->error('La compra ya está en la primera etapa.', 422);
        }

        if ($compra->estado === 'anulada') {
            return $this->error('No se puede retroceder una compra anulada.', 422);
        }

        $revertioStock = false;

        DB::transaction(function () use ($compra, &$revertioStock) {
            if ($compra->estado === 'recibida') {
                // UPDATE directo: resta stock sin cargar modelos ni disparar eventos
                foreach ($compra->detalles as $detalle) {
                    DB::table('productos')
                        ->where('id', $detalle->producto_id)
                        ->whereNull('deleted_at')
                        ->update([
                            'stock'      => DB::raw("GREATEST(stock - {$detalle->cantidad}, 0)"),
                            'updated_at' => now(),
                        ]);
                }
                $compra->update([
                    'estado'          => 'confirmada',
                    'fecha_recepcion' => null,
                ]);
                $revertioStock = true;
            } elseif ($compra->estado === 'confirmada') {
                $compra->update(['estado' => 'pendiente']);
            }
        });

        // Invalida caché una sola vez si se tocó el stock
        if ($revertioStock) {
            (new Producto)->invalidateCache(['productos', 'pos', 'dashboard', 'compras']);
        }

        $compra->load(['proveedor', 'metodoPago', 'usuario', 'detalles.producto']);

        return $this->success(new CompraResource($compra), 'Compra retrocedida correctamente.');
    }

    // ─────────────────────────────────────────────────────────────────────
    private function generarNumeroCompra(): string
    {
        $anio   = now()->format('Y');
        $ultimo = Compra::whereYear('created_at', $anio)->count();

        return 'CMP-' . $anio . '-' . str_pad($ultimo + 1, 6, '0', STR_PAD_LEFT);
    }
}
