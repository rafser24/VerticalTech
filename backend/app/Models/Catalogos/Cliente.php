<?php

namespace App\Models\Catalogos;

use App\Traits\Auditable;
use App\Traits\HasApiCache;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Model
{
    use HasFactory, SoftDeletes, Auditable, HasApiCache;

    /** Invalida también el dashboard (top-clientes) */
    protected array $cacheModules = ['clientes', 'dashboard'];

protected $table = 'clientes';

protected $fillable = [
    'nombre',
    'apellido',
    'email',
    'telefono',   
    'direccion',
    'dui',
    'nit',
    'limite_credito',
    'activo',
];

    protected $casts = [
        'activo'          => 'boolean',
        'limite_credito'  => 'decimal:2',
    ];

    // ──────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────

    public function ventas()
    {
        return $this->hasMany(\App\Models\Ventas\Venta::class, 'cliente_id');
    }

    // ──────────────────────────────────────────
    // Accessors
    // ──────────────────────────────────────────

    public function getNombreCompletoAttribute(): string
    {
        return trim($this->nombre . ' ' . $this->apellido);
    }

    // ──────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
