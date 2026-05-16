<?php

namespace App\Http\Resources\Catalogos;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromocionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'nombre'           => $this->nombre,
            'descripcion'      => $this->descripcion,
            'tipo_descuento'   => $this->tipo_descuento,
            'valor_descuento'  => (float) $this->valor_descuento,
            'tipo_aplicacion'  => $this->tipo_aplicacion,

            // Producto relacionado (si aplica)
            // Null check obligatorio: para promociones por categoría, producto es null.
            'producto_id'      => $this->producto_id,
            'producto'         => $this->whenLoaded('producto', fn () =>
                $this->producto
                    ? [
                        'id'     => $this->producto->id,
                        'nombre' => $this->producto->nombre,
                        'codigo' => $this->producto->codigo,
                    ]
                    : null
            ),

            // Categoría relacionada (si aplica)
            // Null check obligatorio: para promociones por producto, categoria es null.
            'categoria_id'     => $this->categoria_id,
            'categoria'        => $this->whenLoaded('categoria', fn () =>
                $this->categoria
                    ? [
                        'id'     => $this->categoria->id,
                        'nombre' => $this->categoria->nombre,
                    ]
                    : null
            ),

            'fecha_inicio'     => $this->fecha_inicio?->format('Y-m-d'),
            'fecha_fin'        => $this->fecha_fin?->format('Y-m-d'),
            'activo'           => $this->activo,

            'creado_por'       => $this->whenLoaded('creadoPor', fn () =>
                $this->creadoPor
                    ? [
                        'id'     => $this->creadoPor->id,
                        'nombre' => $this->creadoPor->nombre,
                    ]
                    : null
            ),

            'created_at'       => $this->created_at?->format('Y-m-d H:i'),
            'updated_at'       => $this->updated_at?->format('Y-m-d H:i'),
        ];
    }
}
