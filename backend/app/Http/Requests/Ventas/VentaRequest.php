<?php

namespace App\Http\Requests\Ventas;

use App\Traits\Sanitizable;
use Illuminate\Foundation\Http\FormRequest;

class VentaRequest extends FormRequest
{
    use Sanitizable;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->sanitizeInputs(['notas']);
    }

    public function rules(): array
    {
        return [
            'cliente_id'               => ['nullable', 'integer', 'exists:clientes,id'],
            'cliente_nombre_manual'    => ['nullable', 'string', 'max:120'],
            'metodo_pago_id'           => ['required', 'integer', 'exists:metodo_pago,id'],
            'descuento'                => ['nullable', 'numeric', 'min:0', 'max:100'],
            'impuesto'                 => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notas'                    => ['nullable', 'string', 'max:1000'],
            'referencia_transferencia' => ['nullable', 'string', 'max:120'],
            'fecha_venta'              => ['nullable', 'date'],

            // Detalle
            'items'                       => ['required', 'array', 'min:1'],
            'items.*.producto_id'         => ['required', 'integer', 'exists:productos,id'],
            'items.*.cantidad'            => ['required', 'integer', 'min:1'],
            'items.*.precio_unitario'     => ['required', 'numeric', 'min:0.01'],
            'items.*.descuento'           => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'metodo_pago_id.required'         => 'Debe seleccionar un método de pago.',
            'metodo_pago_id.exists'           => 'El método de pago no existe.',
            'items.required'                  => 'Debe agregar al menos un producto.',
            'items.min'                       => 'Debe agregar al menos un producto.',
            'items.*.producto_id.required'    => 'Cada ítem debe indicar el producto.',
            'items.*.producto_id.exists'      => 'Uno de los productos no existe.',
            'items.*.cantidad.required'       => 'La cantidad es obligatoria.',
            'items.*.cantidad.min'            => 'La cantidad mínima es 1.',
            'items.*.precio_unitario.required'=> 'El precio unitario es obligatorio.',
            'items.*.precio_unitario.min'     => 'El precio debe ser mayor a 0.',
        ];
    }
}
