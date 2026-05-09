<?php

namespace App\Http\Resources\Catalogos;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProveedorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'nombre'       => $this->nombre,
            'razon_social' => $this->razon_social,
            'nit'          => $this->nit,
            'email'        => $this->email,
            'telefono'     => $this->telefono,
            'direccion'    => $this->direccion,
            'contacto'     => $this->contacto,
            'activo'       => $this->activo,
            'created_at'   => $this->created_at?->toDateTimeString(),
        ];
    }
}
