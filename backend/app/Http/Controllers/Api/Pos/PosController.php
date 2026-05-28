<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Http\Resources\Catalogos\ClienteResource;
use App\Http\Resources\Catalogos\MetodoPagoResource;
use App\Http\Resources\Catalogos\ProductoResource;
use App\Http\Resources\Catalogos\PromocionResource;
use App\Models\Catalogos\Cliente;
use App\Models\Catalogos\MetodoPago;
use App\Models\Catalogos\Producto;
use App\Models\Catalogos\Promocion;
use Illuminate\Http\JsonResponse;

class PosController extends Controller
{
    /**
     * Endpoint único de inicialización del POS.
     *
     * Devuelve en UNA SOLA respuesta todos los catálogos que el POS necesita
     * al arrancar: productos activos con stock, clientes activos, métodos de
     * pago activos y promociones vigentes.
     *
     * Ventajas vs. 4 llamadas separadas:
     *  - 1 round-trip HTTP en lugar de 4
     *  - 1 validación JWT en lugar de 4
     *  - 1 verificación de rol en lugar de 4
     *  - No carga la relación `proveedor` (innecesaria en el POS)
     *  - El CacheApiResponse middleware almacena la respuesta completa
     */
    public function init(): JsonResponse
    {
        // ── Productos: activos y con stock, sin proveedor (el POS no lo muestra)
        $productos = Producto::with('categoria')
            ->where('activo', true)
            ->where('stock', '>', 0)
            ->orderBy('nombre')
            ->get();

        // ── Clientes: solo activos, ordenados para el selector
        $clientes = Cliente::where('activo', true)
            ->orderBy('nombre')
            ->get();

        // ── Métodos de pago activos
        $metodosPago = MetodoPago::where('activo', true)
            ->orderBy('nombre')
            ->get();

        // ── Promociones vigentes: activas + dentro del rango de fechas
        $hoy = now()->toDateString();
        $promociones = Promocion::where('activo', true)
            ->whereDate('fecha_inicio', '<=', $hoy)
            ->where(fn ($q) =>
                $q->whereNull('fecha_fin')
                  ->orWhereDate('fecha_fin', '>=', $hoy)
            )
            ->get();

        return $this->success([
            'productos'    => ProductoResource::collection($productos),
            'clientes'     => ClienteResource::collection($clientes),
            'metodos_pago' => MetodoPagoResource::collection($metodosPago),
            'promociones'  => PromocionResource::collection($promociones),
        ], 'POS inicializado correctamente.');
    }
}
