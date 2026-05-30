<?php

namespace App\Http\Requests\Configuracion;

use Illuminate\Foundation\Http\FormRequest;

class ConfiguracionEmpresaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre'    => ['required', 'string', 'max:150'],
            // NIT El Salvador: 0000-000000-000-0
            'nit'       => ['nullable', 'string', 'regex:/^\d{4}-\d{6}-\d{3}-\d{1}$/'],
            // NRC El Salvador: hasta 6 dígitos - 1 dígito verificador
            'nrc'       => ['nullable', 'string', 'regex:/^\d{1,6}-\d{1}$/'],
            // Teléfono El Salvador: 4 dígitos - 4 dígitos (fijo o celular)
            'telefono'  => ['nullable', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'correo'    => ['nullable', 'email', 'max:150'],
            'direccion' => ['nullable', 'string', 'max:255'],
            // El logo se sube como archivo imagen (max 2 MB)
            'logo'      => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la empresa es obligatorio.',
            'nit.regex'       => 'El NIT debe tener el formato 0000-000000-000-0.',
            'nrc.regex'       => 'El NRC debe tener el formato 000000-0.',
            'telefono.regex'  => 'El teléfono debe tener el formato 2222-3333.',
            'correo.email'    => 'El correo no tiene un formato válido.',
            'logo.image'      => 'El logo debe ser una imagen.',
            'logo.max'        => 'El logo no puede superar los 2 MB.',
        ];
    }
}
