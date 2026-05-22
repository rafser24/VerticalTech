<?php

namespace App\Http\Requests\Catalogos;

use App\Traits\Sanitizable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProveedorRequest extends FormRequest
{
    use Sanitizable;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->sanitizeInputs(['nombre', 'razon_social', 'email', 'telefono', 'direccion', 'contacto', 'nit']);
    }

    public function rules(): array
    {
        /*
         * CORRECCIÓN: la regla antigua usaba interpolación de string:
         *   "unique:proveedores,nit,{$id}"
         * Al crear (POST), $id es null → la regla queda "unique:proveedores,nit,"
         * PostgreSQL intenta comparar id <> '' (string vacío) con bigint → error.
         *
         * Solución: usar Rule::unique() con ->ignore() solo cuando hay ID,
         * garantizando que el valor ignorado sea un entero válido.
         */
        $proveedorParam = $this->route('proveedor');
        $id = is_object($proveedorParam)
            ? $proveedorParam->id
            : ($proveedorParam ? (int) $proveedorParam : null);

        $nitRule = Rule::unique('proveedores', 'nit');
        if ($id) {
            $nitRule = $nitRule->ignore($id);
        }

        return [
            'nombre'       => ['required', 'string', 'max:120'],
            'razon_social' => ['required', 'string', 'max:200'],
            'nit'          => ['required', 'string', 'max:50', $nitRule],
            'email'        => ['required', 'email:rfc', 'max:150'],
            'telefono'     => ['required', 'string', 'max:25'],
            'direccion'    => ['required', 'string', 'max:250'],
            'contacto'     => ['required', 'string', 'max:100'],
            'activo'       => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required'      => 'El nombre del proveedor es obligatorio.',
            'razon_social.required'=> 'La razón social es obligatoria.',
            'nit.required'         => 'El NIT es obligatorio.',
            'nit.unique'           => 'Ya existe un proveedor registrado con ese NIT.',
            'email.required'       => 'El correo electrónico es obligatorio.',
            'email.email'          => 'El formato del correo no es válido.',
            'telefono.required'    => 'El teléfono es obligatorio.',
            'direccion.required'   => 'La dirección es obligatoria.',
            'contacto.required'    => 'La persona de contacto es obligatoria.',
        ];
    }
}
