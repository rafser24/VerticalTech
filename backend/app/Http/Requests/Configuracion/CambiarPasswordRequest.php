<?php

namespace App\Http\Requests\Configuracion;

use Illuminate\Foundation\Http\FormRequest;

class CambiarPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'password_actual'   => ['required', 'string'],
            'password_nuevo'    => ['required', 'string', 'min:8', 'confirmed'],
            // 'password_nuevo_confirmation' debe coincidir (regla confirmed)
        ];
    }

    public function messages(): array
    {
        return [
            'password_actual.required'  => 'Debes ingresar tu contraseña actual.',
            'password_nuevo.required'   => 'La nueva contraseña es obligatoria.',
            'password_nuevo.min'        => 'La nueva contraseña debe tener al menos 8 caracteres.',
            'password_nuevo.confirmed'  => 'Las contraseñas nuevas no coinciden.',
        ];
    }
}
