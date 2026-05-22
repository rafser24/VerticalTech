<?php

namespace App\Models\Catalogos;

use App\Traits\HasApiCache;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MetodoPago extends Model
{
    use HasFactory, HasApiCache;

    protected array $cacheModules = ['metodos-pago'];

    protected $table = 'metodo_pago';

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
