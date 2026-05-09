<?php

namespace App\Http\Resources\Compras;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompraResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'numero_compra'  => $this->numero_compra,
            'proveedor_id'   => $this->proveedor_id,
            'proveedor'      => $this->whenLoaded('proveedor', fn() => [
                'id'     => $this->proveedor->id,
                'nombre' => $this->proveedor->nombre,
            ]),
            'metodo_pago_id' => $this->metodo_pago_id,
            'metodo_pago'    => $this->whenLoaded('metodoPago', fn() => [
                'id'     => $this->metodoPago->id,
                'nombre' => $this->metodoPago->nombre,
            ]),
            'usuario'        => $this->whenLoaded('usuario', fn() => [
                'id'      => $this->usuario->id,
                'usuario' => $this->usuario->usuario,
            ]),
            'subtotal'       => (float) $this->subtotal,
            'impuesto'       => (float) $this->impuesto,
            'descuento'      => (float) $this->descuento,
            'total'          => (float) $this->total,
            'estado'         => $this->estado,
            'notas'          => $this->notas,
            'fecha_compra'   => $this->fecha_compra?->toDateTimeString(),
            'items'          => DetalleCompraResource::collection($this->whenLoaded('detalles')),
            'created_at'     => $this->created_at?->toDateTimeString(),
        ];
    }
}
