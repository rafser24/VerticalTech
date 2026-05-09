<?php

namespace App\Http\Requests\Usuarios;

use App\Traits\Sanitizable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UsuarioRequest extends FormRequest
{
    use Sanitizable;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitizeInputs(['nombre', 'apellido', 'usuario', 'email']);
    }

    public function rules(): array
    {
        $id      = $this->route('usuario');
        $unique  = fn(string $col) => "unique:usuarios,{$col},{$id}";
        $editing = (bool) $id;

        return [
            'nombre'    => ['required', 'string', 'max:100'],
            'apellido'  => ['required', 'string', 'max:100'],
            'usuario'   => ['required', 'string', 'max:60', 'alpha_dash', $unique('usuario')],
            'email'     => ['required', 'email:rfc,dns', 'max:150', $unique('email')],
            'contrasena'=> $editing
                ? ['nullable', 'string', Password::min(8)->mixedCase()->numbers()->symbols()]
                : ['required', 'string', Password::min(8)->mixedCase()->numbers()->symbols()],
            'role'      => ['required', 'string', 'exists:roles,name'],
            'activo'    => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required'    => 'El nombre es obligatorio.',
            'apellido.required'  => 'El apellido es obligatorio.',
            'usuario.required'   => 'El nombre de usuario es obligatorio.',
            'usuario.alpha_dash' => 'El usuario solo puede contener letras, números, guiones y underscores.',
            'usuario.unique'     => 'Este nombre de usuario ya está en uso.',
            'email.required'     => 'El correo es obligatorio.',
            'email.unique'       => 'Este correo ya está registrado.',
            'contrasena.required'=> 'La contraseña es obligatoria.',
            'role.required'      => 'Debe asignar un rol.',
            'role.exists'        => 'El rol seleccionado no existe.',
        ];
    }
}
