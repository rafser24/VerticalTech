<?php

namespace App\Models\Ventas;

use App\Traits\Auditable;
use App\Traits\HasApiCache;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Venta extends Model
{
    use HasFactory, SoftDeletes, Auditable, HasApiCache;

    /** Una venta nueva/anulada impacta el dashboard (stats, gráficas). */
    protected array $cacheModules = ['ventas', 'dashboard'];

    protected $table = 'ventas';

    protected $fillable = [
        'numero_venta',
        'cliente_id',
        'cliente_nombre_manual',
        'metodo_pago_id',
        'usuario_id',
        'subtotal',
        'impuesto',
        'descuento',
        'total',
        'estado',
        'notas',
        'referencia_transferencia',
        'fecha_venta',
    ];

    protected $casts = [
        'subtotal'    => 'decimal:2',
        'impuesto'    => 'decimal:2',
        'descuento'   => 'decimal:2',
        'total'       => 'decimal:2',
        'fecha_venta' => 'datetime',
    ];

    // ──────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────

    public function cliente()
    {
        return $this->belongsTo(\App\Models\Catalogos\Cliente::class, 'cliente_id');
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
        return $this->hasMany(DetalleVenta::class, 'venta_id');
    }

    // ──────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────

    public function scopeCompletada($query)
    {
        return $query->where('estado', 'completada');
    }

    public function scopePendiente($query)
    {
        return $query->where('estado', 'pendiente');
    }

    public function scopeDelPeriodo($query, string $desde, string $hasta)
    {
        return $query->whereBetween('fecha_venta', [$desde, $hasta]);
    }
}
