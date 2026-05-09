<?php

namespace App\Http\Requests\Usuarios;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UsuarioUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // CORRECCIÓN 1: se eliminó el dd() que bloqueaba toda actualización.
        // CORRECCIÓN 2: el parámetro de ruta en api.php es '{i}', no '{id}'.
        $userId = $this->route('i');

        return [
            'nombre'  => 'required|string|min:2|max:100',
            'usuario' => [
                'required',
                'string',
                'min:3',
                'max:50',
                // Ignora el usuario actual para permitir guardar sin cambiar el alias
                Rule::unique('usuarios', 'usuario')->ignore($userId, 'id'),
                'regex:/^[a-zA-Z0-9_-]+$/',
            ],
            'correo'  => [
                'nullable',
                'email',
                'max:100',
                // CORRECCIÓN 3: la columna en BD es 'email', no 'correo'
                Rule::unique('usuarios', 'email')->ignore($userId, 'id'),
            ],
            'password'              => 'nullable|string|min:8|confirmed',
            'password_confirmation' => 'nullable|string',
            'rol'                   => 'required|string|in:admin,vendedor,tecnico,bodeguero',
            'activo'                => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required'    => 'El nombre completo es obligatorio.',
            'usuario.required'   => 'El nombre de usuario es obligatorio.',
            'usuario.unique'     => 'Este nombre de usuario ya está en uso.',
            'usuario.regex'      => 'El usuario solo puede contener letras, números, guiones y guiones bajos.',
            'correo.email'       => 'El correo no tiene un formato válido.',
            'correo.unique'      => 'Este correo ya está registrado.',
            'password.min'       => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'rol.required'       => 'El rol es obligatorio.',
            'rol.in'             => 'Rol no válido. Valores: admin, vendedor, tecnico, bodeguero.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status'  => false,
            'message' => $validator->errors()->first(),
            'errors'  => $validator->errors(),
        ], 422));
    }
}
