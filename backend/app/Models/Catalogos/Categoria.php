<?php

namespace App\Models\Catalogos;

//use App\Traits\Auditable;
use App\Traits\HasApiCache;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Categoria extends Model
{
    use HasFactory, SoftDeletes, HasApiCache;
    // use Auditable;

    /** Módulo de caché que se invalida al mutar este modelo. */
    protected array $cacheModules = ['categorias'];

    protected $table = 'categorias';

    protected $fillable = [
        'nombre',
        'descripcion',
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
        return $this->hasMany(Producto::class, 'categoria_id');
    }

    // ──────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
