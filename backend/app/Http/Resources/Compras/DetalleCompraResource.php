<?php

namespace App\Http\Resources\Compras;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DetalleCompraResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'producto_id'     => $this->producto_id,
            'producto'        => $this->whenLoaded('producto', fn() => [
                'id'     => $this->producto->id,
                'codigo' => $this->producto->codigo,
                'nombre' => $this->producto->nombre,
            ]),
            'cantidad'        => $this->cantidad,
            'precio_unitario' => (float) $this->precio_unitario,
            'descuento'       => (float) $this->descuento,
            'subtotal'        => (float) $this->subtotal,
        ];
    }
}
