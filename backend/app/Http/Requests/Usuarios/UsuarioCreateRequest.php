<?php

namespace App\Http\Requests\Usuarios;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UsuarioCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre'                => 'required|string|min:2|max:100',
            'apellido'              => 'required|string|min:2|max:100',
            'usuario'               => [
                'required',
                'string',
                'min:3',
                'max:50',
                'unique:usuarios,usuario',
                'regex:/^[a-zA-Z0-9_-]+$/',
            ],
            // CORRECCIÓN: la columna en BD es 'email', no 'correo'
            'correo'                => 'nullable|email|max:100|unique:usuarios,email',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string|min:8',
            'rol'                   => 'required|string|in:admin,vendedor',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required'    => 'El nombre completo es obligatorio.',
            'nombre.min'         => 'El nombre debe tener al menos 2 caracteres.',
            'usuario.required'   => 'El nombre de usuario es obligatorio.',
            'usuario.unique'     => 'Este nombre de usuario ya está en uso.',
            'usuario.min'        => 'El usuario debe tener al menos 3 caracteres.',
            'usuario.regex'      => 'El usuario solo puede contener letras, números, guiones y guiones bajos.',
            'correo.email'       => 'El correo no tiene un formato válido.',
            'correo.unique'      => 'Este correo ya está registrado.',
            'password.required'  => 'La contraseña es obligatoria.',
            'password.min'       => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'rol.required'       => 'El rol es obligatorio.',
            'rol.in'             => 'Rol no válido. Valores permitidos: admin, vendedor.',
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
