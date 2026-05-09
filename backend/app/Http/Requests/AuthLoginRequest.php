<?php

namespace App\Http\Requests;

use App\Traits\Sanitizable;
use Illuminate\Foundation\Http\FormRequest;

class AuthLoginRequest extends FormRequest
{
    use Sanitizable;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitizeInputs(['usuario']);
    }

    public function rules(): array
    {
        return [
            'usuario'  => ['required', 'string', 'max:60'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'usuario.required'  => 'El nombre de usuario es obligatorio.',
            'usuario.string'    => 'El usuario debe ser texto.',
            'usuario.max'       => 'El usuario no puede superar 60 caracteres.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min'      => 'La contraseña debe tener mínimo 8 caracteres.',
        ];
    }
}
