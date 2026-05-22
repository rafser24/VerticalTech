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
