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
            'nit'       => ['nullable', 'string', 'max:30'],
            'nrc'       => ['nullable', 'string', 'max:30'],
            'telefono'  => ['nullable', 'string', 'max:20'],
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
            'correo.email'    => 'El correo no tiene un formato válido.',
            'logo.image'      => 'El logo debe ser una imagen.',
            'logo.max'        => 'El logo no puede superar los 2 MB.',
        ];
    }
}
