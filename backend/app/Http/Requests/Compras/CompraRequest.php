<?php

namespace App\Http\Requests\Compras;

use App\Traits\Sanitizable;
use Illuminate\Foundation\Http\FormRequest;

class CompraRequest extends FormRequest
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
            'proveedor_id'                    => ['required', 'integer', 'exists:proveedores,id'],
            'metodo_pago_id'                  => ['required', 'integer', 'exists:metodo_pago,id'],
            'descuento'                       => ['nullable', 'numeric', 'min:0'],
            'impuesto'                        => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notas'                           => ['nullable', 'string', 'max:1000'],
            'fecha_compra'                    => ['nullable', 'date'],

            'items'                           => ['required', 'array', 'min:1'],
            'items.*.producto_id'             => ['required', 'integer', 'exists:productos,id'],
            'items.*.cantidad'                => ['required', 'integer', 'min:1'],
            'items.*.precio_unitario'         => ['required', 'numeric', 'min:0.01'],
            'items.*.descuento'               => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'proveedor_id.required'           => 'Debe seleccionar un proveedor.',
            'proveedor_id.exists'             => 'El proveedor no existe.',
            'metodo_pago_id.required'         => 'Debe seleccionar un método de pago.',
            'items.required'                  => 'Debe agregar al menos un producto.',
            'items.*.producto_id.required'    => 'Cada ítem debe indicar el producto.',
            'items.*.cantidad.min'            => 'La cantidad mínima es 1.',
            'items.*.precio_unitario.required'=> 'El precio unitario es obligatorio.',
        ];
    }
}
