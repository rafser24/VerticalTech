<?php

namespace App\Models\Catalogos;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proveedor extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $table = 'proveedores';

    protected $fillable = [
        'nombre',
        'razon_social',
        'nit',
        'email',
        'telefono',
        'direccion',
        'contacto',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    // ──────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────

    public function productos()
    {
        return $this->hasMany(Producto::class, 'proveedor_id');
    }

    public function compras()
    {
        return $this->hasMany(\App\Models\Compras\Compra::class, 'proveedor_id');
    }

    // ──────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
