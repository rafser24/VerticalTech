<?php

namespace App\Http\Resources\Catalogos;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoriaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'nombre'          => $this->nombre,
            'descripcion'     => $this->descripcion,
            'activo'          => $this->activo,
            'productos_count' => $this->whenCounted('productos'),
            'created_at'      => $this->created_at?->toDateTimeString(),
        ];
    }
}
