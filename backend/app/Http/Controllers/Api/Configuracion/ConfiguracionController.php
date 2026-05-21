<?php

namespace App\Http\Controllers\Api\Configuracion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Configuracion\CambiarPasswordRequest;
use App\Http\Requests\Configuracion\ConfiguracionEmpresaRequest;
use App\Models\Configuracion\ConfiguracionEmpresa;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ConfiguracionController extends Controller
{
    // ─── GET /api/configuracion/empresa ───────────────────────────────────
    // Devuelve el único registro de configuración (lo crea si no existe)
    public function getEmpresa(): JsonResponse
    {
        $config = ConfiguracionEmpresa::obtener();

        return $this->success([
            'id'        => $config->id,
            'nombre'    => $config->nombre,
            'nit'       => $config->nit,
            'nrc'       => $config->nrc,
            'telefono'  => $config->telefono,
            'correo'    => $config->correo,
            'direccion' => $config->direccion,
            'logo_url'  => $config->logo_url,
        ]);
    }

    // ─── POST /api/configuracion/empresa ──────────────────────────────────
    // Actualiza los datos de empresa (y el logo si se sube uno)
    public function updateEmpresa(ConfiguracionEmpresaRequest $request): JsonResponse
    {
        try {
            $config    = ConfiguracionEmpresa::obtener();
            $validated = $request->validated();

            // Si llega un nuevo logo, borra el anterior y guarda el nuevo
            if ($request->hasFile('logo')) {
                if ($config->logo_path) {
                    Storage::disk('public')->delete($config->logo_path);
                }
                $validated['logo_path'] = $request->file('logo')
                    ->store('logos', 'public');
            }

            // logo no es una columna, quitarlo si quedó en validated
            unset($validated['logo']);

            $config->update($validated);

            return $this->success([
                'id'        => $config->id,
                'nombre'    => $config->nombre,
                'nit'       => $config->nit,
                'nrc'       => $config->nrc,
                'telefono'  => $config->telefono,
                'correo'    => $config->correo,
                'direccion' => $config->direccion,
                'logo_url'  => $config->fresh()->logo_url,
            ], 'Configuración actualizada correctamente.');

        } catch (\Throwable $th) {
            return $this->error('Error al actualizar la configuración: ' . $th->getMessage());
        }
    }

    // ─── POST /api/configuracion/cambiar-password ─────────────────────────
    // El usuario autenticado cambia su propia contraseña
    public function cambiarPassword(CambiarPasswordRequest $request): JsonResponse
    {
        try {
            /** @var Usuario $usuario */
            $usuario = auth('api')->user();

            // Verificar que la contraseña actual sea correcta
            // El campo en el modelo se llama 'contrasena' pero el guard usa 'password'
            if (!Hash::check($request->password_actual, $usuario->contrasena)) {
                return $this->error('La contraseña actual es incorrecta.', 422);
            }

            // Actualizar — el mutador setContrasenaAttribute del modelo hace el hash
            $usuario->update(['contrasena' => $request->password_nuevo]);

            return $this->success(null, 'Contraseña actualizada correctamente.');

        } catch (\Throwable $th) {
            return $this->error('Error al cambiar la contraseña: ' . $th->getMessage());
        }
    }
}
