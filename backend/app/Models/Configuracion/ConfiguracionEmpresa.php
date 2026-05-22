<?php

namespace App\Models\Configuracion;

use Illuminate\Database\Eloquent\Model;

class ConfiguracionEmpresa extends Model
{
    protected $table = 'configuracion_empresa';

    protected $fillable = [
        'nombre',
        'nit',
        'nrc',
        'telefono',
        'correo',
        'direccion',
        'logo_path',
    ];

    // Siempre hay un único registro. Este helper lo obtiene o lo crea vacío.
    public static function obtener(): self
    {
        return self::firstOrCreate(['id' => 1], [
            'nombre' => 'Mi Empresa',
        ]);
    }

    // URL pública del logo (null si no hay logo)
    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path
            ? asset('storage/' . $this->logo_path)
            : null;
    }
}
