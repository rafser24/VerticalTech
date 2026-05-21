<?php

namespace App\Models\Compras;

use App\Traits\Auditable;
use App\Traits\HasApiCache;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Compra extends Model
{
    use HasFactory, SoftDeletes, Auditable, HasApiCache;

    /** Una compra nueva/anulada afecta el dashboard (reporte-compras). */
    protected array $cacheModules = ['compras', 'dashboard'];

    protected $table = 'compras';

    protected $fillable = [
        'numero_compra',
        'proveedor_id',
        'metodo_pago_id',
        'usuario_id',
        'subtotal',
        'impuesto',
        'descuento',
        'total',
        'estado',
        'notas',
      'fecha_compra',
        'fecha_recepcion',
    ];

    protected $casts = [
        'subtotal'        => 'decimal:2',
        'impuesto'        => 'decimal:2',
        'descuento'       => 'decimal:2',
        'total'           => 'decimal:2',
        'fecha_compra'    => 'datetime',
        'fecha_recepcion' => 'datetime',
    ];

    // ──────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────

    public function proveedor()
    {
        return $this->belongsTo(\App\Models\Catalogos\Proveedor::class, 'proveedor_id');
    }

    public function metodoPago()
    {
        return $this->belongsTo(\App\Models\Catalogos\MetodoPago::class, 'metodo_pago_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\Usuario::class, 'usuario_id');
    }

    public function detalles()
    {
        return $this->hasMany(DetalleCompra::class, 'compra_id');
    }

    // ──────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────

   public function scopeRecibida($query)
    {
        return $query->where('estado', 'recibida');
    }

    public function scopeDelPeriodo($query, string $desde, string $hasta)
    {
        return $query->whereBetween('fecha_compra', [$desde, $hasta]);
    }
}
