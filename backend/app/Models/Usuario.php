<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Tymon\JWTAuth\Contracts\JWTSubject;

class Usuario extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes, HasRoles, Auditable;

    protected $table = 'usuarios';

    protected $guard_name = 'api';

    protected $fillable = [
        'nombre',
        'apellido',
        'usuario',
        'email',
        'contrasena',
        'activo',
    ];

    protected $hidden = [
        'contrasena',
        'remember_token',
    ];

    protected $casts = [
        'activo'             => 'boolean',
        'email_verified_at'  => 'datetime',
    ];

    // ──────────────────────────────────────────
    // JWT Interface
    // ──────────────────────────────────────────

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'id'      => $this->id,
            'nombre'  => $this->nombre . ' ' . $this->apellido,
            'usuario' => $this->usuario,
        ];
    }

    // ──────────────────────────────────────────
    // Auth — map 'password' key → contrasena
    // ──────────────────────────────────────────

    public function getAuthPassword(): string
    {
        return $this->contrasena;
    }

    // ──────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────

    public function ventas()
    {
        return $this->hasMany(\App\Models\Ventas\Venta::class, 'usuario_id');
    }

    public function compras()
    {
        return $this->hasMany(\App\Models\Compras\Compra::class, 'usuario_id');
    }

    public function auditorias()
    {
        return $this->hasMany(\App\Models\Logs\AuditoriaLog::class, 'usuario_id');
    }

    // ──────────────────────────────────────────
    // Accessors / Mutators
    // ──────────────────────────────────────────

    public function getNombreCompletoAttribute(): string
    {
        return $this->nombre . ' ' . $this->apellido;
    }

    protected function setContrasenaAttribute(string $value): void
    {
        $this->attributes['contrasena'] = bcrypt($value);
    }
}
