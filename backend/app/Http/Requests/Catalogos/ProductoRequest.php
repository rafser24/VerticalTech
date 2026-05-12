<?php

namespace App\Http\Requests\Catalogos;

use App\Traits\Sanitizable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductoRequest extends FormRequest
{
    use Sanitizable;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->sanitizeInputs(['codigo', 'nombre', 'descripcion', 'unidad']);
    }

    public function rules(): array
    {
        /*
         * CORRECCIÓN: la ruta está definida como /{i} en api.php,
         * pero el controller usa Producto $producto (binding por nombre 'producto').
         * Cuando el parámetro de ruta y el nombre del argumento no coinciden,
         * Laravel no hace el binding y $this->route('producto') devuelve null.
         *
         * Se lee el ID probando ambas claves posibles del route:
         *   - 'producto' → si algún día se corrige la ruta a /{producto}
         *   - 'i'        → nombre actual del parámetro en api.php
         */
        $productoParam = $this->route('producto') ?? $this->route('i');
        $id = is_object($productoParam) ? $productoParam->id : $productoParam;

        return [
            'codigo'        => [
                'required',
                'string',
                'max:60',
                Rule::unique('productos', 'codigo')->ignore($id),
            ],
            'nombre'        => ['required', 'string', 'max:150'],
            'descripcion'   => ['nullable', 'string', 'max:2000'],
            'precio_compra' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'precio_venta'  => ['required', 'numeric', 'min:0.01', 'max:9999999.99'],
            'stock'         => ['nullable', 'integer', 'min:0'],
            'stock_minimo'  => ['nullable', 'integer', 'min:0'],
            'unidad'        => ['nullable', 'string', 'max:30'],
            'activo'        => ['sometimes', 'boolean'],
            'categoria_id'  => ['required', 'integer', 'exists:categorias,id'],
            'proveedor_id'  => ['nullable', 'integer', 'exists:proveedores,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo.required'       => 'El código del producto es obligatorio.',
            'codigo.unique'         => 'Ya existe un producto con ese código.',
            'nombre.required'       => 'El nombre del producto es obligatorio.',
            'precio_venta.required' => 'El precio de venta es obligatorio.',
            'precio_venta.min'      => 'El precio de venta debe ser mayor a cero.',
            'categoria_id.required' => 'Debe seleccionar una categoría.',
            'categoria_id.exists'   => 'La categoría seleccionada no existe.',
            'proveedor_id.exists'   => 'El proveedor seleccionado no existe.',
        ];
    }
}
