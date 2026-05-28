<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Ventas\Venta;
use App\Models\Compras\Compra;
use App\Models\Catalogos\{Producto, Cliente};
use App\Models\Usuario;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    use ApiResponse;

    // ─── HELPER: calcular fecha_inicio y fecha_fin según tipo de período ──
    private function calcularRango(Request $request): array
    {
        $tipo = $request->get('tipo', 'mes'); // dia | semana | mes | anio

        switch ($tipo) {

            case 'dia':
                $fecha = $request->get('fecha', now()->toDateString());
                $inicio = Carbon::parse($fecha)->startOfDay();
                $fin    = Carbon::parse($fecha)->endOfDay();
                break;

            case 'semana':
                $fecha  = $request->get('fecha', now()->toDateString());
                $inicio = Carbon::parse($fecha)->startOfWeek(Carbon::MONDAY);
                $fin    = Carbon::parse($fecha)->endOfWeek(Carbon::SUNDAY);
                break;

            case 'anio':
                $anio   = (int) $request->get('anio', now()->year);
                $inicio = Carbon::create($anio, 1, 1)->startOfDay();
                $fin    = Carbon::create($anio, 12, 31)->endOfDay();
                break;

            case 'mes':
            default:
                $mes    = (int) $request->get('mes',  now()->month);
                $anio   = (int) $request->get('anio', now()->year);
                $inicio = Carbon::create($anio, $mes, 1)->startOfDay();
                $fin    = Carbon::create($anio, $mes, 1)->endOfMonth()->endOfDay();
                break;
        }

        return [
            'inicio' => $inicio,
            'fin'    => $fin,
            'tipo'   => $tipo,
        ];
    }

    // ─── GET /api/dashboard/resumen ───────────────────────────────────────
    public function resumen(Request $request)
    {
        try {
            $rango = $this->calcularRango($request);
            $inicio = $rango['inicio'];
            $fin    = $rango['fin'];
            $hoy    = now()->toDateString();

            $ventasHoy = Venta::whereDate('fecha_venta', $hoy)
                ->where('estado', 'completada');

            $ventasPeriodo = Venta::whereBetween('fecha_venta', [$inicio, $fin])
                ->where('estado', 'completada');

            $comprasPeriodo = Compra::whereBetween('fecha_compra', [$inicio, $fin])
                ->where('estado', 'recibida');

            $ingresosPeriodo = (float) $ventasPeriodo->sum('total');
            $egresosPeriodo  = (float) $comprasPeriodo->sum('total');

            return $this->success([
                'ventas' => [
                    'hoy' => [
                        'cantidad' => $ventasHoy->count(),
                        'total'    => (float) $ventasHoy->sum('total'),
                    ],
                    'mes' => [
                        'cantidad' => $ventasPeriodo->count(),
                        'total'    => $ingresosPeriodo,
                    ],
                ],
                'compras' => [
                    'mes' => [
                        'cantidad' => $comprasPeriodo->count(),
                        'total'    => $egresosPeriodo,
                    ],
                ],
                'margen_mes'           => round($ingresosPeriodo - $egresosPeriodo, 2),
                'total_clientes'       => Cliente::where('activo', true)->count(),
                'total_productos'      => Producto::where('activo', true)->count(),
                'total_usuarios'       => Usuario::where('activo', true)->count(),
                'productos_stock_bajo' => Producto::where('activo', true)
                    ->whereRaw('stock <= stock_minimo')
                    ->count(),
                'total_sales'     => $ingresosPeriodo,
                'total_products'  => Producto::where('activo', true)->count(),
                'total_clients'   => Cliente::where('activo', true)->count(),
                'low_stock_count' => Producto::where('activo', true)
                    ->whereRaw('stock <= stock_minimo')
                    ->count(),
                'recent_sales' => Venta::with('cliente')
                    ->where('estado', 'completada')
                    ->orderBy('fecha_venta', 'desc')
                    ->limit(10)
                    ->get()
                    ->map(fn($v) => [
                        'id'         => $v->id,
                        'total'      => (float) $v->total,
                        'created_at' => $v->fecha_venta,
                        'client'     => $v->cliente
                            ? ['name' => $v->cliente->nombre]
                            : null,
                    ]),
            ], 'Resumen del dashboard');

        } catch (\Throwable $th) {
            return $this->error('Error al obtener el resumen: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/ventas-por-periodo ────────────────────────────
    public function ventasPorPeriodo()
    {
        try {
            $datos = DB::select("
                SELECT
                    TO_CHAR(fecha_venta, 'YYYY-MM') AS periodo,
                    COUNT(*)                        AS cantidad,
                    SUM(total)                      AS total
                FROM ventas
                WHERE estado = 'completada'
                  AND fecha_venta >= NOW() - INTERVAL '12 months'
                GROUP BY periodo
                ORDER BY periodo ASC
            ");

            return $this->success($datos, 'Ventas por período (últimos 12 meses)');

        } catch (\Throwable $th) {
            return $this->error('Error al obtener ventas por período: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/productos-mas-vendidos ───────────────────────
    public function productosMasVendidos(Request $request)
    {
        try {
            $rango  = $this->calcularRango($request);
            $inicio = $rango['inicio'];
            $fin    = $rango['fin'];

            $productos = DB::table('detalle_venta')
                ->join('productos', 'detalle_venta.producto_id', '=', 'productos.id')
                ->join('ventas', 'detalle_venta.venta_id', '=', 'ventas.id')
                ->select(
                    'productos.id',
                    'productos.nombre as nombre_producto',
                    DB::raw('SUM(detalle_venta.cantidad) as unidades_vendidas'),
                    DB::raw('SUM(detalle_venta.subtotal) as total_generado')
                )
                ->whereBetween('ventas.fecha_venta', [$inicio, $fin])
                ->where('ventas.estado', 'completada')
                ->groupBy('productos.id', 'productos.nombre')
                ->orderByDesc('unidades_vendidas')
                ->limit(15)
                ->get();

            return $this->success($productos, 'Productos más vendidos');

        } catch (\Throwable $th) {
            return $this->error('Error al obtener productos más vendidos: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/top-clientes ─────────────────────────────────
    public function topClientes(Request $request)
    {
        try {
            $rango  = $this->calcularRango($request);
            $inicio = $rango['inicio'];
            $fin    = $rango['fin'];

            $clientes = DB::table('ventas')
                ->join('clientes', 'ventas.cliente_id', '=', 'clientes.id')
                ->select(
                    'clientes.id',
                    DB::raw("CONCAT(clientes.nombre, ' ', clientes.apellido) as nombre_cliente"),
                    'clientes.telefono',
                    DB::raw('COUNT(ventas.id) as total_compras'),
                    DB::raw('SUM(ventas.total) as total_gastado')
                )
                ->whereBetween('ventas.fecha_venta', [$inicio, $fin])
                ->where('ventas.estado', 'completada')
                ->groupBy(
                    'clientes.id',
                    'clientes.nombre',
                    'clientes.apellido',
                    'clientes.telefono'
                )
                ->orderByDesc('total_gastado')
                ->limit(10)
                ->get();

            return $this->success($clientes, 'Top clientes');

        } catch (\Throwable $th) {
            return $this->error('Error al obtener top clientes: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/stock-bajo ───────────────────────────────────
    public function stockBajo()
    {
        try {
            $productos = Producto::with(['categoria', 'proveedor'])
                ->where('activo', true)
                ->whereRaw('stock <= stock_minimo')
                ->orderBy('stock', 'asc')
                ->get()
                ->map(fn($p) => [
                    'id'              => $p->id,
                    'nombre'          => $p->nombre,
                    'stock'           => $p->stock,
                    'stock_minimo'    => $p->stock_minimo,
                    'diferencia'      => $p->stock_minimo - $p->stock,
                    'categoria'       => $p->categoria?->nombre,
                    'proveedor'       => $p->proveedor?->nombre,
                ]);

            return $this->success($productos, 'Productos con stock bajo');

        } catch (\Throwable $th) {
            return $this->error('Error al obtener stock bajo: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/reporte-ventas ───────────────────────────────
    public function reporteVentas(Request $request)
    {
        try {
            $rango  = $this->calcularRango($request);
            $inicio = $rango['inicio'];
            $fin    = $rango['fin'];

            $ventas = Venta::with(['cliente', 'usuario', 'metodoPago', 'detalles.producto'])
                ->whereBetween('fecha_venta', [$inicio, $fin])
                ->orderBy('fecha_venta', 'desc')
                ->get();

            $completadas = $ventas->where('estado', 'completada');

            return $this->success([
                'tipo'     => $rango['tipo'],
                'inicio'   => $inicio->toDateString(),
                'fin'      => $fin->toDateString(),
                'cantidad' => $ventas->count(),
                'total'    => (float) $completadas->sum('total'),
                'promedio' => $completadas->count() > 0
                    ? round($completadas->sum('total') / $completadas->count(), 2)
                    : 0,
                'ventas'   => $ventas,
            ], 'Reporte de ventas');

        } catch (\Throwable $th) {
            return $this->error('Error al generar reporte de ventas: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/reporte-compras ──────────────────────────────
    public function reporteCompras(Request $request)
    {
        try {
            $rango  = $this->calcularRango($request);
            $inicio = $rango['inicio'];
            $fin    = $rango['fin'];

            $compras = Compra::with(['proveedor', 'usuario', 'detalles.producto'])
                ->whereBetween('fecha_compra', [$inicio, $fin])
                ->orderBy('fecha_compra', 'desc')
                ->get();

            $completadas = $compras->where('estado', 'recibida');

            return $this->success([
                'tipo'     => $rango['tipo'],
                'inicio'   => $inicio->toDateString(),
                'fin'      => $fin->toDateString(),
                'cantidad' => $compras->count(),
                'total'    => (float) $completadas->sum('total'),
                'compras'  => $compras,
            ], 'Reporte de compras');

        } catch (\Throwable $th) {
            return $this->error('Error al generar reporte de compras: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/reporte-completo ─────────────────────────────
    /**
     * Consolida los 5 endpoints del módulo Reportes en una sola llamada.
     * Acepta los mismos query params que los endpoints individuales:
     *   tipo, fecha, mes, anio
     */
    public function reporteCompleto(Request $request)
    {
        try {
            $rango  = $this->calcularRango($request);
            $inicio = $rango['inicio'];
            $fin    = $rango['fin'];

            // ── Resumen ───────────────────────────────────────────────────
            $hoy = now()->toDateString();

            $ventasHoy     = Venta::whereDate('fecha_venta', $hoy)->where('estado', 'completada');
            $ventasPeriodo = Venta::whereBetween('fecha_venta', [$inicio, $fin])->where('estado', 'completada');
            $comprasPeriodo = Compra::whereBetween('fecha_compra', [$inicio, $fin])->where('estado', 'recibida');

            $ingresosPeriodo = (float) $ventasPeriodo->sum('total');
            $egresosPeriodo  = (float) $comprasPeriodo->sum('total');

            $resumen = [
                'ventas' => [
                    'hoy' => ['cantidad' => $ventasHoy->count(),     'total' => (float) $ventasHoy->sum('total')],
                    'mes' => ['cantidad' => $ventasPeriodo->count(), 'total' => $ingresosPeriodo],
                ],
                'compras'              => ['mes' => ['cantidad' => $comprasPeriodo->count(), 'total' => $egresosPeriodo]],
                'margen_mes'           => round($ingresosPeriodo - $egresosPeriodo, 2),
                'total_clientes'       => Cliente::where('activo', true)->count(),
                'total_productos'      => Producto::where('activo', true)->count(),
                'total_sales'          => $ingresosPeriodo,
                'total_products'       => Producto::where('activo', true)->count(),
                'total_clients'        => Cliente::where('activo', true)->count(),
                'low_stock_count'      => Producto::where('activo', true)->whereRaw('stock <= stock_minimo')->count(),
                'productos_stock_bajo' => Producto::where('activo', true)->whereRaw('stock <= stock_minimo')->count(),
            ];

            // ── Reporte de ventas ─────────────────────────────────────────
            $ventasDetalle = Venta::with(['cliente', 'usuario', 'metodoPago', 'detalles.producto'])
                ->whereBetween('fecha_venta', [$inicio, $fin])
                ->orderBy('fecha_venta', 'desc')
                ->get();

            $completadas = $ventasDetalle->where('estado', 'completada');

            $reporteVentas = [
                'tipo'     => $rango['tipo'],
                'inicio'   => $inicio->toDateString(),
                'fin'      => $fin->toDateString(),
                'cantidad' => $ventasDetalle->count(),
                'total'    => (float) $completadas->sum('total'),
                'promedio' => $completadas->count() > 0
                    ? round($completadas->sum('total') / $completadas->count(), 2)
                    : 0,
                'ventas'   => $ventasDetalle->values(),
            ];

            // ── Productos más vendidos ────────────────────────────────────
            $topProductos = DB::table('detalle_venta')
                ->join('productos', 'detalle_venta.producto_id', '=', 'productos.id')
                ->join('ventas', 'detalle_venta.venta_id', '=', 'ventas.id')
                ->select(
                    'productos.id',
                    'productos.nombre as nombre_producto',
                    DB::raw('SUM(detalle_venta.cantidad) as unidades_vendidas'),
                    DB::raw('SUM(detalle_venta.subtotal) as total_generado')
                )
                ->whereBetween('ventas.fecha_venta', [$inicio, $fin])
                ->where('ventas.estado', 'completada')
                ->groupBy('productos.id', 'productos.nombre')
                ->orderByDesc('unidades_vendidas')
                ->limit(15)
                ->get();

            // ── Top clientes ──────────────────────────────────────────────
            $topClientes = DB::table('ventas')
                ->join('clientes', 'ventas.cliente_id', '=', 'clientes.id')
                ->select(
                    'clientes.id',
                    DB::raw("CONCAT(clientes.nombre, ' ', clientes.apellido) as nombre_cliente"),
                    'clientes.telefono',
                    DB::raw('COUNT(ventas.id) as total_compras'),
                    DB::raw('SUM(ventas.total) as total_gastado')
                )
                ->whereBetween('ventas.fecha_venta', [$inicio, $fin])
                ->where('ventas.estado', 'completada')
                ->groupBy('clientes.id', 'clientes.nombre', 'clientes.apellido', 'clientes.telefono')
                ->orderByDesc('total_gastado')
                ->limit(10)
                ->get();

            // ── Stock bajo ────────────────────────────────────────────────
            $stockBajo = Producto::with(['categoria', 'proveedor'])
                ->where('activo', true)
                ->whereRaw('stock <= stock_minimo')
                ->orderBy('stock', 'asc')
                ->get()
                ->map(fn($p) => [
                    'id'           => $p->id,
                    'nombre'       => $p->nombre,
                    'stock'        => $p->stock,
                    'stock_minimo' => $p->stock_minimo,
                    'diferencia'   => $p->stock_minimo - $p->stock,
                    'categoria'    => $p->categoria?->nombre,
                    'proveedor'    => $p->proveedor?->nombre,
                ]);

            return $this->success([
                'resumen'        => $resumen,
                'reporte_ventas' => $reporteVentas,
                'top_productos'  => $topProductos,
                'top_clientes'   => $topClientes,
                'stock_bajo'     => $stockBajo,
            ], 'Reporte completo');

        } catch (\Throwable $th) {
            return $this->error('Error al generar el reporte completo: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/stats ─────────────────────────────────────────
    public function stats()
    {
        try {
            $stats = [
                'total_sales'     => (float) Venta::where('estado', 'completada')
                    ->whereMonth('fecha_venta', now()->month)
                    ->whereYear('fecha_venta', now()->year)
                    ->sum('total'),
                'total_products'  => Producto::where('activo', true)->count(),
                'total_clients'   => Cliente::where('activo', true)->count(),
                'low_stock_count' => Producto::where('activo', true)
                    ->whereRaw('stock <= stock_minimo')
                    ->count(),
            ];

            $recentSales = Venta::with('cliente')
                ->where('estado', 'completada')
                ->orderBy('fecha_venta', 'desc')
                ->limit(10)
                ->get()
                ->map(fn($v) => [
                    'id'         => $v->id,
                    'total'      => (float) $v->total,
                    'created_at' => $v->fecha_venta,
                    'client'     => $v->cliente ? ['name' => $v->cliente->nombre] : null,
                ]);

            return $this->success([
                'stats'        => $stats,
                'recent_sales' => $recentSales,
            ], 'Estadísticas del dashboard');

        } catch (\Throwable $th) {
            return $this->error('Error al obtener estadísticas: ' . $th->getMessage());
        }
    }
}
