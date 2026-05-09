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

class DashboardController extends Controller
{
    use ApiResponse;

    // ─── GET /api/dashboard/resumen ────────────────────────────────────────
    public function resumen(Request $request)
    {
        try {
            $mes  = (int) $request->get('mes',  now()->month);
            $anio = (int) $request->get('anio', now()->year);
            $hoy  = now()->toDateString();

            $ventasHoy = Venta::whereDate('fecha_venta', $hoy)
                ->where('estado', 'completada');

            $ventasMes = Venta::whereMonth('fecha_venta', $mes)
                ->whereYear('fecha_venta', $anio)
                ->where('estado', 'completada');

            // Nota: ajusta 'fecha_venta' al nombre real de la columna fecha en la tabla compras
            $comprasMes = Compra::whereMonth('fecha_compra', $mes)
                ->whereYear('fecha_compra', $anio)
                ->where('estado', 'completada');

            $ingresosMes = (float) $ventasMes->sum('total');
            $egresosMes  = (float) $comprasMes->sum('total');

            // CORRECCIÓN: orden correcto → success($data, $message, $status, $meta)
            return $this->success([
                'ventas' => [
                    'hoy' => [
                        'cantidad' => $ventasHoy->count(),
                        'total'    => (float) $ventasHoy->sum('total'),
                    ],
                    'mes' => [
                        'cantidad' => $ventasMes->count(),
                        'total'    => $ingresosMes,
                    ],
                ],
                'compras' => [
                    'mes' => [
                        'cantidad' => $comprasMes->count(),
                        'total'    => $egresosMes,
                    ],
                ],
                'margen_mes'           => round($ingresosMes - $egresosMes, 2),
                'total_clientes'       => Cliente::where('activo', true)->count(),
                'total_productos'      => Producto::where('activo', true)->count(),
                'total_usuarios'       => Usuario::where('activo', true)->count(),
                'productos_stock_bajo' => Producto::where('activo', true)
                    ->whereRaw('stock <= stock_minimo')
                    ->count(),
                // Aliases planos para DashboardPage.jsx
                'total_sales'     => $ingresosMes,
                'total_products'  => Producto::where('activo', true)->count(),
                'total_clients'   => Cliente::where('activo', true)->count(),
                'low_stock_count' => Producto::where('activo', true)
                    ->whereRaw('stock <= stock_minimo')
                    ->count(),
                // Ventas recientes para la tabla del dashboard
                'recent_sales'    => Venta::with('cliente')
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

    // ─── GET /api/dashboard/ventas-por-periodo ─────────────────────────────
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

            // CORRECCIÓN: orden correcto → success($data, $message, $status, $meta)
            return $this->success($datos, 'Ventas por período (últimos 12 meses)');

        } catch (\Throwable $th) {
            return $this->error('Error al obtener ventas por período: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/productos-mas-vendidos ─────────────────────────
    public function productosMasVendidos(Request $request)
    {
        try {
            $mes  = (int) $request->get('mes',  now()->month);
            $anio = (int) $request->get('anio', now()->year);

            $productos = DB::select("
                SELECT
                    p.id_producto,
                    p.nombre_producto,
                    p.marca,
                    SUM(dv.cantidad) AS unidades_vendidas,
                    SUM(dv.subtotal) AS total_generado
                FROM detalle_venta dv
                JOIN ventas    v ON v.id          = dv.id_venta
                               AND v.estado       = 'completada'
                               AND EXTRACT(MONTH FROM v.fecha_venta) = :mes
                               AND EXTRACT(YEAR  FROM v.fecha_venta) = :anio
                JOIN productos p ON p.id_producto = dv.id_producto
                GROUP BY p.id_producto, p.nombre_producto, p.marca
                ORDER BY unidades_vendidas DESC
                LIMIT 10
            ", ['mes' => $mes, 'anio' => $anio]);

            return $this->success($productos, 'Top 10 productos más vendidos');

        } catch (\Throwable $th) {
            return $this->error('Error al obtener productos más vendidos: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/top-clientes ──────────────────────────────────
    public function topClientes(Request $request)
    {
        try {
            $mes  = (int) $request->get('mes',  now()->month);
            $anio = (int) $request->get('anio', now()->year);

            $clientes = DB::select("
                SELECT
                    c.id_cliente,
                    c.nombre,
                    c.telefono,
                    COUNT(v.id)  AS total_compras,
                    SUM(v.total) AS total_gastado
                FROM clientes c
                JOIN ventas v ON v.cliente_id = c.id_cliente
                             AND v.estado     = 'completada'
                             AND EXTRACT(MONTH FROM v.fecha_venta) = :mes
                             AND EXTRACT(YEAR  FROM v.fecha_venta) = :anio
                GROUP BY c.id_cliente, c.nombre, c.telefono
                ORDER BY total_gastado DESC
                LIMIT 10
            ", ['mes' => $mes, 'anio' => $anio]);

            return $this->success($clientes, 'Top 10 clientes del período');

        } catch (\Throwable $th) {
            return $this->error('Error al obtener top clientes: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/stock-bajo ────────────────────────────────────
    public function stockBajo()
    {
        try {
            $productos = Producto::with(['categoria', 'proveedor'])
                ->where('activo', true)
                ->whereRaw('stock <= stock_minimo')
                ->orderBy('stock', 'asc')
                ->get()
                ->map(fn($p) => [
                    'id_producto'     => $p->id_producto,
                    'nombre_producto' => $p->nombre_producto,
                    'marca'           => $p->marca,
                    'stock_actual'    => $p->stock,
                    'stock_minimo'    => $p->stock_minimo,
                    'diferencia'      => $p->stock_minimo - $p->stock,
                    'categoria'       => $p->categoria?->nombre_categoria,
                    'proveedor'       => $p->proveedor?->nombre,
                ]);

            return $this->success($productos, 'Productos con stock bajo');

        } catch (\Throwable $th) {
            return $this->error('Error al obtener stock bajo: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/reporte-ventas ────────────────────────────────
    public function reporteVentas(Request $request)
    {
        try {
            $mes  = (int) $request->get('mes',  now()->month);
            $anio = (int) $request->get('anio', now()->year);

            $ventas      = Venta::with(['cliente', 'usuario', 'metodoPago', 'detalles.producto'])
                ->whereMonth('fecha_venta', $mes)
                ->whereYear('fecha_venta', $anio)
                ->orderBy('fecha_venta', 'desc')
                ->get();

            $completadas = $ventas->where('estado', 'completada');

            return $this->success([
                'mes'      => $mes,
                'anio'     => $anio,
                'cantidad' => $ventas->count(),
                'total'    => (float) $completadas->sum('total'),
                'promedio' => $completadas->count() > 0
                    ? round($completadas->sum('total') / $completadas->count(), 2)
                    : 0,
                'ventas'   => $ventas,
            ], "Reporte de ventas — {$mes}/{$anio}");

        } catch (\Throwable $th) {
            return $this->error('Error al generar reporte de ventas: ' . $th->getMessage());
        }
    }

    // ─── GET /api/dashboard/reporte-compras ───────────────────────────────
    public function reporteCompras(Request $request)
    {
        try {
            $mes  = (int) $request->get('mes',  now()->month);
            $anio = (int) $request->get('anio', now()->year);

            $compras     = Compra::with(['proveedor', 'usuario', 'detalles.producto'])
                ->whereMonth('fecha_compra', $mes)
                ->whereYear('fecha_compra', $anio)
                ->orderBy('fecha_compra', 'desc')
                ->get();

            $completadas = $compras->where('estado', 'completada');

            return $this->success([
                'mes'      => $mes,
                'anio'     => $anio,
                'cantidad' => $compras->count(),
                'total'    => (float) $completadas->sum('total'),
                'compras'  => $compras,
            ], "Reporte de compras — {$mes}/{$anio}");

        } catch (\Throwable $th) {
            return $this->error('Error al generar reporte de compras: ' . $th->getMessage());
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
