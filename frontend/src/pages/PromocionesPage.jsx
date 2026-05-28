import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Tag, Package, Percent, DollarSign, Calendar, Search,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '../components/ui/FormFields';
import { promocionSchema } from '../schemas';
import { promocionService } from '../services/promocionService';
import api from '../services/api';

// ─────────────────────────────────────────────────────────
// Helpers visuales
// ─────────────────────────────────────────────────────────
function BadgeTipo({ tipo }) {
  const map = {
    producto:  { label: 'Producto',  cls: 'bg-blue-100 text-blue-700' },
    categoria: { label: 'Categoría', cls: 'bg-purple-100 text-purple-700' },
  };
  const { label, cls } = map[tipo] ?? { label: tipo, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

function BadgeDescuento({ tipo, valor }) {
  if (tipo === 'porcentaje') {
    return (
      <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
        <Percent size={13} />{Number(valor).toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm font-semibold text-amber-700">
      <DollarSign size={13} />${Number(valor).toFixed(2)}
    </span>
  );
}

function BadgeEstado({ activo }) {
  return activo
    ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Activa</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactiva</span>;
}

// ─────────────────────────────────────────────────────────
// Formulario dentro del modal
// ─────────────────────────────────────────────────────────
function PromocionForm({ register, errors, watch, setValue, productos, categorias }) {
  const tipoAplicacion = watch('tipo_aplicacion');
  const tipoDescuento  = watch('tipo_descuento');

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Nombre */}
      <FormField label="Nombre de la promoción" required error={errors.nombre?.message}>
        <FormInput register={register('nombre')} placeholder="Ej: Descuento de temporada" error={errors.nombre} />
      </FormField>

      {/* Descripción */}
      <FormField label="Descripción" error={errors.descripcion?.message}>
        <FormTextarea register={register('descripcion')} placeholder="Descripción opcional..." error={errors.descripcion} />
      </FormField>

      {/* Tipo de aplicación */}
      <FormField label="Aplica a" required error={errors.tipo_aplicacion?.message}>
        <FormSelect register={register('tipo_aplicacion')} error={errors.tipo_aplicacion}>
          <option value="">— Seleccione —</option>
          <option value="producto">Producto específico</option>
          <option value="categoria">Categoría completa</option>
        </FormSelect>
      </FormField>

      {/* Selector dinámico: Producto o Categoría */}
      {tipoAplicacion === 'producto' && (
        <FormField label="Producto" required error={errors.producto_id?.message}>
          <FormSelect register={register('producto_id')} error={errors.producto_id}>
            <option value="">— Seleccione un producto —</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
            ))}
          </FormSelect>
        </FormField>
      )}

      {tipoAplicacion === 'categoria' && (
        <FormField label="Categoría" required error={errors.categoria_id?.message}>
          <FormSelect register={register('categoria_id')} error={errors.categoria_id}>
            <option value="">— Seleccione una categoría —</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </FormSelect>
        </FormField>
      )}

      {/* Tipo de descuento + valor en la misma fila */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tipo de descuento" required error={errors.tipo_descuento?.message}>
          <FormSelect register={register('tipo_descuento')} error={errors.tipo_descuento}>
            <option value="">— Seleccione —</option>
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="monto_fijo">Monto fijo ($)</option>
          </FormSelect>
        </FormField>

        <FormField
          label={tipoDescuento === 'porcentaje' ? 'Porcentaje (%)' : 'Monto fijo ($)'}
          required
          error={errors.valor_descuento?.message}
        >
          <FormInput
            register={register('valor_descuento')}
            type="number"
            step="0.01"
            min="0.01"
            max={tipoDescuento === 'porcentaje' ? 100 : undefined}
            placeholder={tipoDescuento === 'porcentaje' ? 'Ej: 15' : 'Ej: 5.00'}
            error={errors.valor_descuento}
          />
        </FormField>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha inicio" required error={errors.fecha_inicio?.message}>
          <FormInput register={register('fecha_inicio')} type="date" error={errors.fecha_inicio} />
        </FormField>
        <FormField label="Fecha fin (opcional)" error={errors.fecha_fin?.message}>
          <FormInput register={register('fecha_fin')} type="date" error={errors.fecha_fin} />
        </FormField>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────
export default function PromocionesPage() {
  const [promociones, setPromociones] = useState([]);
  const [productos,   setProductos]   = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search,      setSearch]      = useState('');
  const [filtroTipo,  setFiltroTipo]  = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(promocionSchema) });

  // ── Carga inicial: un solo request con todos los catálogos ──────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const res  = await api.get('/promociones/init');
      const data = res.data?.data ?? {};
      setPromociones(Array.isArray(data.promociones) ? data.promociones : []);
      setProductos(  Array.isArray(data.productos)   ? data.productos   : []);
      setCategorias( Array.isArray(data.categorias)  ? data.categorias  : []);
    } catch (err) {
      console.error('[PromocionesPage] error:', err);
      const status = err.response?.status;
      if (status === 500) {
        toast.error('Error del servidor. ¿Ejecutaste php artisan migrate?');
      } else {
        toast.error('Error al cargar promociones');
      }
    } finally {
      setLoading(false);
    }
  };

  // Solo recarga promociones tras mutaciones (catálogos no cambian)
  const recargarPromociones = async () => {
    try {
      const res  = await api.get('/promociones');
      const data = res.data?.data ?? res.data;
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setPromociones(list);
    } catch {
      toast.error('Error al actualizar promociones');
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Filtros locales ──────────────────────────────────────
  const promocionesFiltradas = promociones
    .filter(p => {
      const textoOk  = !search      || p.nombre?.toLowerCase().includes(search.toLowerCase());
      const tipoOk   = !filtroTipo  || p.tipo_aplicacion === filtroTipo;
      const activoOk = filtroActivo === '' || String(p.activo) === filtroActivo;
      return textoOk && tipoOk && activoOk;
    })
    .sort((a, b) => (b.activo ? 1 : 0) - (a.activo ? 1 : 0));

  // ── Abrir modal ──────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    reset({
      tipo_descuento:  'porcentaje',
      tipo_aplicacion: 'producto',
      activo:          true,
      fecha_inicio:    new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    reset({
      ...item,
      fecha_inicio: item.fecha_inicio ?? '',
      fecha_fin:    item.fecha_fin    ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); reset(); };

  // ── Guardar ──────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      // Limpiar FK contrario según tipo_aplicacion
      if (data.tipo_aplicacion === 'producto') data.categoria_id = null;
      else data.producto_id = null;

      if (editing?.id) {
        await promocionService.update(editing.id, data);
        toast.success('Promoción actualizada');
      } else {
        await promocionService.create(data);
        toast.success('Promoción creada');
      }
      closeModal();
      recargarPromociones();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar';
      toast.error(msg);
    }
  };

  // ── Eliminar ─────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await promocionService.delete(deleteTarget.id);
      toast.success('Promoción eliminada');
      setDeleteTarget(null);
      recargarPromociones();
    } catch {
      toast.error('No se pudo eliminar la promoción');
    }
  };

  // ── Toggle activo ────────────────────────────────────────
  const handleToggle = async (promo) => {
    try {
      await promocionService.toggleActivo(promo.id);
      toast.success(`Promoción ${promo.activo ? 'desactivada' : 'activada'}`);
      recargarPromociones();
    } catch {
      toast.error('Error al cambiar el estado');
    }
  };

  // ── Render nombre del objetivo ───────────────────────────
  const renderObjetivo = (promo) => {
    if (promo.tipo_aplicacion === 'producto') {
      const nombre = promo.producto?.nombre ?? `Producto #${promo.producto_id}`;
      return (
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <Package size={13} className="text-blue-500 flex-shrink-0" />
          <span className="truncate max-w-[160px]" title={nombre}>{nombre}</span>
        </div>
      );
    }
    const nombre = promo.categoria?.nombre ?? `Categoría #${promo.categoria_id}`;
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-700">
        <Tag size={13} className="text-purple-500 flex-shrink-0" />
        <span className="truncate max-w-[160px]" title={nombre}>{nombre}</span>
      </div>
    );
  };

  const tipoAplicacion = watch('tipo_aplicacion');

  return (
    <MainLayout title="Promociones">
      <div className="space-y-4">

        {/* ── Encabezado ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Gestión de Promociones</h2>
            <p className="text-sm text-gray-500">
              Descuentos por producto o categoría · Solo administradores
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
            <Plus size={16} /> Nueva Promoción
          </button>
        </div>

        {/* ── Filtros ── */}
        <div className="card flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="input-field pl-9 w-full"
            />
          </div>
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="input-field w-full sm:w-44"
          >
            <option value="">Todos los tipos</option>
            <option value="producto">Producto</option>
            <option value="categoria">Categoría</option>
          </select>
          <select
            value={filtroActivo}
            onChange={e => setFiltroActivo(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </select>
        </div>

        {/* ── Tabla ── */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              Cargando promociones...
            </div>
          ) : promocionesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <Tag size={36} className="opacity-30" />
              <p className="text-sm">No hay promociones que mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Aplica a</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Objetivo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Descuento</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Período</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {promocionesFiltradas.map(promo => (
                    <tr key={promo.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{promo.nombre}</div>
                        {promo.descripcion && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{promo.descripcion}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeTipo tipo={promo.tipo_aplicacion} />
                      </td>
                      <td className="px-4 py-3">
                        {renderObjetivo(promo)}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeDescuento tipo={promo.tipo_descuento} valor={promo.valor_descuento} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} />
                          {promo.fecha_inicio}
                        </div>
                        {promo.fecha_fin && (
                          <div className="text-gray-400">→ {promo.fecha_fin}</div>
                        )}
                        {!promo.fecha_fin && (
                          <div className="text-gray-400 italic">Sin vencimiento</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeEstado activo={promo.activo} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Toggle */}
                          <button
                            onClick={() => handleToggle(promo)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              promo.activo
                                ? 'hover:bg-green-50 text-green-600'
                                : 'hover:bg-gray-100 text-gray-400'
                            }`}
                            title={promo.activo ? 'Desactivar' : 'Activar'}
                          >
                            {promo.activo
                              ? <ToggleRight size={16} />
                              : <ToggleLeft size={16} />
                            }
                          </button>
                          {/* Editar */}
                          <button
                            onClick={() => openEdit(promo)}
                            className="p-1.5 hover:bg-pastel-primary/20 rounded-lg transition-colors text-blue-600"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          {/* Eliminar */}
                          <button
                            onClick={() => setDeleteTarget(promo)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Total ── */}
        {!loading && (
          <p className="text-xs text-gray-400">
            Mostrando {promocionesFiltradas.length} de {promociones.length} promociones
          </p>
        )}
      </div>

      {/* ── Modal formulario ── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Promoción' : 'Nueva Promoción'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PromocionForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            productos={productos}
            categorias={categorias}
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={closeModal} className="btn-ghost border border-gray-200">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editing ? 'Guardar cambios' : 'Crear Promoción'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirmar eliminación ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar promoción?"
        message={`Se eliminará la promoción "${deleteTarget?.nombre}". Esta acción no se puede deshacer.`}
      />
    </MainLayout>
  );
}
