<?php

namespace App\Http\Resources\Ventas;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VentaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'numero_venta'   => $this->numero_venta,
            'cliente_id'     => $this->cliente_id,
            'cliente'        => $this->whenLoaded('cliente', fn() => [
                'id'     => $this->cliente->id,
                'nombre' => $this->cliente->nombre_completo,
                'email'  => $this->cliente->email,
            ]),
            'metodo_pago_id' => $this->metodo_pago_id,
            'metodo_pago'    => $this->whenLoaded('metodoPago', fn() => [
                'id'     => $this->metodoPago->id,
                'nombre' => $this->metodoPago->nombre,
            ]),
            'usuario'        => $this->whenLoaded('usuario', fn() => [
                'id'      => $this->usuario->id,
                'usuario' => $this->usuario->usuario,
                'nombre'  => $this->usuario->nombre_completo,
            ]),
            'subtotal'       => (float) $this->subtotal,
            'impuesto'       => (float) $this->impuesto,
            'descuento'      => (float) $this->descuento,
            'total'          => (float) $this->total,
            'estado'         => $this->estado,
            'notas'          => $this->notas,
            'fecha_venta'    => $this->fecha_venta?->toDateTimeString(),
            'items'          => DetalleVentaResource::collection($this->whenLoaded('detalles')),
            'created_at'     => $this->created_at?->toDateTimeString(),
        ];
    }
}
