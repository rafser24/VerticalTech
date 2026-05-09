<?php

namespace App\Traits;

trait Sanitizable
{
    /**
     * Sanitiza strings del request eliminando tags HTML y codificando entidades.
     * Llamar en el método prepareForValidation() de cada FormRequest.
     */
    protected function sanitizeInputs(array $campos): void
    {
        $datos = [];
        foreach ($campos as $campo) {
            $valor = $this->input($campo);
            if (is_string($valor)) {
                $datos[$campo] = htmlspecialchars(
                    strip_tags(trim($valor)),
                    ENT_QUOTES | ENT_HTML5,
                    'UTF-8'
                );
            }
        }
        if (!empty($datos)) {
            $this->merge($datos);
        }
    }
}
