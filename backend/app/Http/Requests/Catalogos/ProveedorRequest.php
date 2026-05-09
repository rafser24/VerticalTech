<?php

namespace App\Http\Requests\Catalogos;

use App\Traits\Sanitizable;
use Illuminate\Foundation\Http\FormRequest;

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
        $id = $this->route('proveedor');
        return [
            'nombre'      => ['required', 'string', 'max:120'],
            'razon_social'=> ['required', 'string', 'max:200'],
            'nit'         => ['required', 'string', 'max:50', "unique:proveedores,nit,{$id}"],
            'email'       => ['required', 'email:rfc', 'max:150'],
            'telefono'    => ['required', 'string', 'max:25'],
            'direccion'   => ['required', 'string', 'max:250'],
            'contacto'    => ['required', 'string', 'max:100'],
            'activo'      => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del proveedor es obligatorio.',
            'nit.unique'      => 'Ya existe un proveedor con ese NIT.',
            'email.email'     => 'El formato del correo no es válido.',
        ];
    }
}
