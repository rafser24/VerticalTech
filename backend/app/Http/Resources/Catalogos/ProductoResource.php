<?php

namespace App\Http\Resources\Catalogos;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'codigo'        => $this->codigo,
            'nombre'        => $this->nombre,
            'descripcion'   => $this->descripcion,
            'precio_compra' => (float) $this->precio_compra,
            'precio_venta'  => (float) $this->precio_venta,
            'stock'         => $this->stock,
            'stock_minimo'  => $this->stock_minimo,
            'stock_bajo'    => $this->stock <= $this->stock_minimo,
            'unidad'        => $this->unidad,
            'activo'        => $this->activo,
            'categoria_id'  => $this->categoria_id,
            'proveedor_id'  => $this->proveedor_id,
            'categoria'     => new CategoriaResource($this->whenLoaded('categoria')),
            'proveedor'     => new ProveedorResource($this->whenLoaded('proveedor')),
            'created_at'    => $this->created_at?->toDateTimeString(),
            'updated_at'    => $this->updated_at?->toDateTimeString(),
        ];
    }
}
