<?php

namespace App\Http\Controllers\Api\Catalogos;

use App\Http\Controllers\Controller;
use App\Http\Resources\Catalogos\MetodoPagoResource;
use App\Models\Catalogos\MetodoPago;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MetodoPagoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $metodos = MetodoPago::when(
            // Si se pasa ?activo=false explícitamente, muestra inactivos (admin)
            // Por defecto (sin parámetro) devuelve solo los activos
            $request->filled('activo'),
            fn($q) => $q->where('activo', filter_var($request->activo, FILTER_VALIDATE_BOOLEAN)),
            fn($q) => $q->where('activo', true)
        )->orderBy('nombre')->get();

        return $this->success(MetodoPagoResource::collection($metodos));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre'      => ['required', 'string', 'max:80', 'unique:metodo_pago,nombre'],
            'descripcion' => ['nullable', 'string', 'max:200'],
            'activo'      => ['sometimes', 'boolean'],
        ]);

        $metodo = MetodoPago::create($data);

        return $this->success(new MetodoPagoResource($metodo), 'Método de pago creado.', 201);
    }

    public function show(MetodoPago $metodoPago): JsonResponse
    {
        return $this->success(new MetodoPagoResource($metodoPago));
    }

    public function update(Request $request, MetodoPago $metodoPago): JsonResponse
    {
        $data = $request->validate([
            'nombre'      => ['required', 'string', 'max:80', Rule::unique('metodo_pago')->ignore($metodoPago)],
            'descripcion' => ['nullable', 'string', 'max:200'],
            'activo'      => ['sometimes', 'boolean'],
        ]);

        $metodoPago->update($data);

        return $this->success(new MetodoPagoResource($metodoPago->fresh()), 'Método de pago actualizado.');
    }

    public function destroy(MetodoPago $metodoPago): JsonResponse
    {
        $metodoPago->delete();

        return $this->success(message: 'Método de pago eliminado.');
    }
}
