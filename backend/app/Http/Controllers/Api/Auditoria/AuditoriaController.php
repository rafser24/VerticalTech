<?php

namespace App\Http\Controllers\Api\Auditoria;

use App\Http\Controllers\Controller;
use App\Models\Logs\AuditoriaLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditoriaController extends Controller
{
    /**
     * GET /api/auditoria
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditoriaLog::with('usuario')
            ->when($request->filled('modelo'), fn($q) =>
                $q->where('modelo', $request->modelo)
            )
            ->when($request->filled('accion'), fn($q) =>
                $q->where('accion', $request->accion)
            )
            ->when($request->filled('usuario_id'), fn($q) =>
                $q->where('usuario_id', $request->usuario_id)
            )
            ->when($request->filled('desde') && $request->filled('hasta'), fn($q) =>
                $q->whereBetween('created_at', [
                    $request->desde . ' 00:00:00',
                    $request->hasta . ' 23:59:59',
                ])
            )
            ->orderByDesc('created_at');

        $resultado = $query->paginate((int) $request->get('per_page', 25));

        return $this->success(
            $resultado->map(fn($log) => [
                'id'                 => $log->id,
                'modelo'             => $log->modelo,
                'modelo_id'          => $log->modelo_id,
                'accion'             => $log->accion,
                'valores_anteriores' => $log->valores_anteriores,
                'valores_nuevos'     => $log->valores_nuevos,
                'usuario'            => $log->usuario
                    ? ['id' => $log->usuario->id, 'usuario' => $log->usuario->usuario]
                    : null,
                'ip'                 => $log->ip,
                'fecha'              => $log->created_at?->toDateTimeString(),
            ]),
            'OK', 200,
            $this->paginationMeta($resultado)
        );
    }
}
