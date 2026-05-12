<?php

namespace App\Http\Controllers\Api\Compras;

use App\Http\Controllers\Controller;
use App\Http\Requests\Compras\CompraRequest;
use App\Http\Resources\Compras\CompraResource;
use App\Models\Catalogos\Producto;
use App\Models\Compras\Compra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompraController extends Controller
{
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
                'estado'         => 'completada',
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

                $producto = Producto::find($item['producto_id']);
                $producto->incrementarStock($item['cantidad']);
                $producto->update(['precio_compra' => $item['precio_unitario']]);
            }

            return $compra;
        });

        $compra->load(['proveedor', 'metodoPago', 'usuario', 'detalles.producto']);

        return $this->success(new CompraResource($compra), 'Compra registrada exitosamente.', 201);
    }

    public function show(int $i): JsonResponse
    {
        $compra = Compra::with(['proveedor', 'metodoPago', 'usuario', 'detalles.producto'])
            ->findOrFail($i);

        return $this->success(new CompraResource($compra));
    }

    public function anular(int $i): JsonResponse
    {
        $compra = Compra::findOrFail($i);

        if ($compra->estado === 'anulada') {
            return $this->error('La compra ya está anulada.', 422);
        }

        DB::transaction(function () use ($compra) {
            foreach ($compra->detalles as $detalle) {
                Producto::find($detalle->producto_id)
                    ?->decrementarStock($detalle->cantidad);
            }
            $compra->update(['estado' => 'anulada']);
        });

        return $this->success(null, 'Compra anulada y stock revertido.');
    }

    // ─────────────────────────────────────────────────────────────────────
    private function generarNumeroCompra(): string
    {
        $anio = now()->format('Y');

        /*
         * CORRECCIÓN: PostgreSQL no permite FOR UPDATE con COUNT.
         * Se eliminó ->lockForUpdate() que causaba SQLSTATE[0A000].
         */
        $ultimo = Compra::whereYear('created_at', $anio)->count();

        return 'CMP-' . $anio . '-' . str_pad($ultimo + 1, 6, '0', STR_PAD_LEFT);
    }
}
