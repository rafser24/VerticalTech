<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'nombre'         => $this->nombre,
            'apellido'       => $this->apellido,
            'nombre_completo'=> $this->nombre_completo,
            'usuario'        => $this->usuario,
            'email'          => $this->email,
            'activo'         => $this->activo,
            'roles'          => $this->getRoleNames(),
            'permisos'       => $this->getAllPermissions()->pluck('name'),
            'created_at'     => $this->created_at?->toDateTimeString(),
            'updated_at'     => $this->updated_at?->toDateTimeString(),
        ];
    }
}
