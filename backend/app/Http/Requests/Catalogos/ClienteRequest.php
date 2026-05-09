<?php

namespace App\Http\Requests\Catalogos;

use App\Traits\Sanitizable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClienteRequest extends FormRequest
{
    use Sanitizable;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // $this->sanitizeInputs(['nombre', 'apellido', 'email', 'telefono', 'direccion', 'dui', 'nit']);
    }

    public function rules(): array
    {
       
        $parametros = $this->route()->parameters();

       
        $param = reset($parametros);

      
        $id = $param ? (is_object($param) ? $param->id : $param) : null;

        return [
            'nombre'         => ['required', 'string', 'max:100'],
            'apellido'       => ['required', 'string', 'max:100'],
            'email'          => [
                'required',
                'email:rfc',
                'max:150',
                Rule::unique('clientes', 'email')->ignore($id)
            ],
            'telefono'       => ['required', 'string', 'regex:/^\d{8}$/'],
            'direccion'      => ['required', 'string', 'max:250'],
            'dui'            => [
                'required',
                'string',
                'regex:/^\d{8}-\d$/',
                Rule::unique('clientes', 'dui')->ignore($id)
            ],
            'nit'            => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('clientes', 'nit')->ignore($id)
            ],
            'limite_credito' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'activo'         => ['sometimes', 'boolean'],
        ];
    }
    public function messages(): array
    {
        return [
            'nombre.required'    => 'El nombre del cliente es obligatorio.',
            'email.unique'       => 'Ya existe un cliente con ese correo.',
            'dui.unique'         => 'Ya existe un cliente con ese DUI.',
            'nit.unique'         => 'Ya existe un cliente con ese NIT.',
            'limite_credito.min' => 'El límite de crédito no puede ser negativo.',
        ];
    }
}
