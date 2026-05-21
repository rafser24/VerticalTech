<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class Controller
{
    /**
     * Respuesta de éxito estandarizada.
     */
    protected function success(
        mixed $data = null,
        string $message = 'OK',
        int $status = 200,
        ?array $meta = null
    ): JsonResponse {
        $response = ['status' => true, 'message' => $message];

        if ($data !== null) {
            $response['data'] = $data;
        }

        if ($meta !== null) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $status);
    }


    protected function error(
        string $message = 'Error.',
        int $status = 400,
        mixed $errors = null
    ): JsonResponse {
        $response = ['status' => false, 'message' => $message];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $status);
    }
/**
 * Retroceder una etapa:
 * recibida → confirmada (revierte stock)
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

    DB::transaction(function () use ($compra) {
        if ($compra->estado === 'recibida') {
            // Revertir stock
            foreach ($compra->detalles as $detalle) {
                $producto = Producto::find($detalle->producto_id);
                if ($producto) {
                    $producto->decrementarStock($detalle->cantidad);
                }
            }
            $compra->update([
                'estado'          => 'confirmada',
                'fecha_recepcion' => null,
            ]);
        } elseif ($compra->estado === 'confirmada') {
            $compra->update(['estado' => 'pendiente']);
        }
    });

    $compra->load(['proveedor', 'metodoPago', 'usuario', 'detalles.producto']);

    return $this->success(new CompraResource($compra), 'Compra retrocedida correctamente.');
}
    /**
     * Meta de paginación desde un LengthAwarePaginator.
     */
    protected function paginationMeta(mixed $resultado): ?array
    {
        if (! $resultado instanceof LengthAwarePaginator) {
            return null;
        }

        return [
            'total'        => $resultado->total(),
            'per_page'     => $resultado->perPage(),
            'current_page' => $resultado->currentPage(),
            'last_page'    => $resultado->lastPage(),
            'from'         => $resultado->firstItem(),
            'to'           => $resultado->lastItem(),
        ];
    }
}
