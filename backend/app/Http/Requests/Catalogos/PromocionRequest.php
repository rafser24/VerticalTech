<?php

namespace App\Http\Requests\Catalogos;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PromocionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'nombre' => [
                $isUpdate ? 'sometimes' : 'required',
                'string',
                'max:150',
            ],

            'descripcion' => ['nullable', 'string'],

            'tipo_descuento' => [
                $isUpdate ? 'sometimes' : 'required',
                Rule::in(['porcentaje', 'monto_fijo']),
            ],

            'valor_descuento' => [
                $isUpdate ? 'sometimes' : 'required',
                'numeric',
                'min:0.01',
                // Si es porcentaje, máximo 100
                function ($attribute, $value, $fail) {
                    $tipo = $this->input('tipo_descuento')
                        ?? optional($this->route('promocion'))->tipo_descuento;

                    if ($tipo === 'porcentaje' && $value > 100) {
                        $fail('El porcentaje de descuento no puede ser mayor a 100.');
                    }
                },
            ],

            'tipo_aplicacion' => [
                $isUpdate ? 'sometimes' : 'required',
                Rule::in(['producto', 'categoria']),
            ],

            // Requerido solo si tipo_aplicacion = 'producto'
            'producto_id' => [
                'nullable',
                'integer',
                Rule::exists('productos', 'id')->where('activo', true),
                function ($attribute, $value, $fail) use ($isUpdate) {
                    $tipo = $this->input('tipo_aplicacion')
                        ?? optional($this->route('promocion'))->tipo_aplicacion;

                    if ($tipo === 'producto' && empty($value)) {
                        $fail('El producto es obligatorio cuando el tipo de aplicación es "producto".');
                    }
                },
            ],

            // Requerido solo si tipo_aplicacion = 'categoria'
            'categoria_id' => [
                'nullable',
                'integer',
                Rule::exists('categorias', 'id')->where('activo', true),
                function ($attribute, $value, $fail) use ($isUpdate) {
                    $tipo = $this->input('tipo_aplicacion')
                        ?? optional($this->route('promocion'))->tipo_aplicacion;

                    if ($tipo === 'categoria' && empty($value)) {
                        $fail('La categoría es obligatoria cuando el tipo de aplicación es "categoria".');
                    }
                },
            ],

            'fecha_inicio' => [
                $isUpdate ? 'sometimes' : 'required',
                'date',
            ],

            'fecha_fin' => [
                'nullable',
                'date',
                'after_or_equal:fecha_inicio',
            ],

            'activo' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required'          => 'El nombre de la promoción es obligatorio.',
            'tipo_descuento.required'  => 'El tipo de descuento es obligatorio.',
            'tipo_descuento.in'        => 'El tipo de descuento debe ser "porcentaje" o "monto_fijo".',
            'valor_descuento.required' => 'El valor del descuento es obligatorio.',
            'valor_descuento.min'      => 'El valor del descuento debe ser mayor a 0.',
            'tipo_aplicacion.required' => 'Debe indicar si la promoción aplica a un producto o categoría.',
            'tipo_aplicacion.in'       => 'El tipo de aplicación debe ser "producto" o "categoria".',
            'fecha_inicio.required'    => 'La fecha de inicio es obligatoria.',
            'fecha_fin.after_or_equal' => 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
            'producto_id.exists'       => 'El producto seleccionado no existe o está inactivo.',
            'categoria_id.exists'      => 'La categoría seleccionada no existe o está inactiva.',
        ];
    }
}
