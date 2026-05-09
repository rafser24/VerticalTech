<?php

namespace App\Http\Requests\Catalogos;

use App\Traits\Sanitizable;
use Illuminate\Foundation\Http\FormRequest;

class CategoriaRequest extends FormRequest
{
    use Sanitizable;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->sanitizeInputs(['nombre', 'descripcion']);
    }

   public function rules(): array
{
    $categoria = $this->route('categoria');

    // Si $categoria es un objeto (por Route Model Binding), usamos su id.
    // Si es solo el parámetro, lo usamos directamente.
    $id = is_object($categoria) ? $categoria->id : $categoria;

    return [
        'nombre' => [
            'required',
            'string',
            'max:300',

            $id ? "unique:categorias,nombre,{$id}" : "unique:categorias,nombre"
        ],
        'descripcion' => ['nullable', 'string', 'max:300'],
        'activo'      => ['sometimes', 'boolean'],
    ];
}

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la categoría es obligatorio.',
            'nombre.unique'   => 'Ya existe una categoría con ese nombre.',
            'nombre.max'      => 'El nombre no puede superar 300 caracteres.',
        ];
    }
}
