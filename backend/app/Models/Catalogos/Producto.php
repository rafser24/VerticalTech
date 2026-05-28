<?php

namespace App\Models\Catalogos;

use App\Traits\Auditable;
use App\Traits\HasApiCache;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Producto extends Model
{
    use HasFactory, SoftDeletes, Auditable, HasApiCache;

    /** Invalida también el dashboard (stock-bajo, top-productos, etc.) */
    protected array $cacheModules = ['productos', 'dashboard'];

    protected $table = 'productos';

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'precio_compra',
        'precio_venta',
        'stock',
        'stock_minimo',
        'unidad',
        'activo',
        'categoria_id',
        'proveedor_id',
    ];

    protected $casts = [
        'activo'        => 'boolean',
        'precio_compra' => 'decimal:2',
        'precio_venta'  => 'decimal:2',
        'stock'         => 'integer',
        'stock_minimo'  => 'integer',
    ];

    // ──────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function detallesVenta()
    {
        return $this->hasMany(\App\Models\Ventas\DetalleVenta::class, 'producto_id');
    }

    public function detallesCompra()
    {
        return $this->hasMany(\App\Models\Compras\DetalleCompra::class, 'producto_id');
    }

    // ──────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeStockBajo($query)
    {
        return $query->whereColumn('stock', '<=', 'stock_minimo');
    }

    // ──────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────

    public function tieneStock(int $cantidad): bool
    {
        return $this->stock >= $cantidad;
    }

    public function decrementarStock(int $cantidad): void
    {
        // Usa DB::table() para el UPDATE directo (más eficiente que increment(),
        // que haría un SELECT + UPDATE). La invalidación la hace el llamador
        // una sola vez fuera del loop, no aquí dentro.
        DB::table('productos')
            ->where('id', $this->id)
            ->whereNull('deleted_at')
            ->update([
                'stock'      => DB::raw("GREATEST(stock - {$cantidad}, 0)"),
                'updated_at' => now(),
            ]);
    }

    public function incrementarStock(int $cantidad): void
    {
        DB::table('productos')
            ->where('id', $this->id)
            ->whereNull('deleted_at')
            ->update([
                'stock'      => DB::raw("stock + {$cantidad}"),
                'updated_at' => now(),
            ]);
    }
}
