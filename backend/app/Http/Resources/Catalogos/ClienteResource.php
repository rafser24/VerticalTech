<?php

namespace App\Http\Resources\Catalogos;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClienteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'nombre'         => $this->nombre,
            'apellido'       => $this->apellido,
            'nombre_completo'=> $this->nombre_completo,
            'email'          => $this->email,
            'telefono'       => $this->telefono,
            'direccion'      => $this->direccion,
            'dui'            => $this->dui,
            'nit'            => $this->nit,
            'limite_credito' => $this->limite_credito,
            'activo'         => $this->activo,
            'created_at'     => $this->created_at?->toDateTimeString(),
        ];
    }
}
