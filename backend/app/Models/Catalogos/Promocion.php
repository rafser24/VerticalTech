<?php

namespace App\Models\Catalogos;

use App\Traits\Auditable;
use App\Traits\HasApiCache;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Promocion extends Model
{
    use HasFactory, SoftDeletes, Auditable, HasApiCache;

    protected array $cacheModules = ['promociones'];

    protected $table = 'promociones';

    protected $fillable = [
        'nombre',
        'descripcion',
        'tipo_descuento',
        'valor_descuento',
        'tipo_aplicacion',
        'producto_id',
        'categoria_id',
        'fecha_inicio',
        'fecha_fin',
        'activo',
        'created_by',
    ];

    protected $casts = [
        'activo'           => 'boolean',
        'valor_descuento'  => 'decimal:2',
        'fecha_inicio'     => 'date',
        'fecha_fin'        => 'date',
    ];

    // ──────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    public function creadoPor()
    {
        return $this->belongsTo(\App\Models\Usuario::class, 'created_by');
    }

    // ──────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    /** Promociones vigentes en este momento. */
    public function scopeVigente($query)
    {
        $hoy = now()->toDateString();
        return $query->where('fecha_inicio', '<=', $hoy)
                     ->where(fn ($q) => $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $hoy));
    }

    // ──────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────

    /**
     * Calcula el precio final aplicando el descuento sobre un precio base.
     */
    public function calcularPrecioFinal(float $precioBase): float
    {
        if ($this->tipo_descuento === 'porcentaje') {
            return max(0, $precioBase - ($precioBase * $this->valor_descuento / 100));
        }

        return max(0, $precioBase - $this->valor_descuento);
    }
}
