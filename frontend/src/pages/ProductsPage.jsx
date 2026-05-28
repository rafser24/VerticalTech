/**
 * ProductsPage.jsx
 *
 * Gestión completa del catálogo de productos.
 * Cubre creación, edición, activación/desactivación y eliminación.
 *
 * Regla de negocio importante:
 *   El stock NO se toca desde aquí. Solo se mueve mediante compras
 *   (ComprasPage) y ventas (POS). Intentar editar el stock directamente
 *   rompería el historial de auditoría y desincronizaría inventario.
 *   Por eso el campo "stock" no aparece en el formulario y el backend
 *   lo ignora en store() / update().
 */

import { useEffect, useState } from 'react';
import api, { productService } from '../services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '../components/ui/FormFields';
import { productSchema } from '../schemas';
import { formatCurrency } from '../utils/helpers';

export default function ProductsPage() {
  const [products, setProducts]         = useState([]);
  const [modalOpen, setModalOpen]       = useState(false);
  // null = modo creación, objeto = modo edición
  const [editing, setEditing]           = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Catálogos auxiliares — solo se cargan una vez en el init
  const [categories, setCategories]     = useState([]);
  const [suppliers, setSuppliers]       = useState([]);

  /**
   * Recarga solo la lista de productos después de una mutación
   * (toggle, guardar, etc.). Los catálogos (categorías, proveedores)
   * no cambian con frecuencia, así que no tiene sentido pedirlos de nuevo.
   */
  const loadProducts = async () => {
    const prodRes = await productService.getAll();
    const list = prodRes.data?.data || prodRes.data || [];
    const sorted = [...list].sort((a, b) => (b.activo ? 1 : 0) - (a.activo ? 1 : 0));
    setProducts(sorted);
  };

  /**
   * Carga inicial: un solo request a /productos/init devuelve productos
   * + categorías + proveedores juntos. Evita tres round-trips separados
   * con su correspondiente validación de token cada uno.
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const res  = await api.get('/productos/init');
        const data = res.data?.data ?? {};
        const list = Array.isArray(data.productos) ? data.productos : [];
        // Activos primero para que el usuario no tenga que hacer scroll
        setProducts([...list].sort((a, b) => (b.activo ? 1 : 0) - (a.activo ? 1 : 0)));
        setCategories(Array.isArray(data.categorias)  ? data.categorias  : []);
        setSuppliers( Array.isArray(data.proveedores)  ? data.proveedores : []);
      } catch {
        toast.error('Error al cargar los productos');
      }
    };
    loadData();
  }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
  });

  // Limpia el form antes de abrir en modo creación
  const openCreate = () => {
    setEditing(null);
    reset({});
    setModalOpen(true);
  };

  // Precarga los valores actuales del producto para editar
  const openEdit = (product) => {
    setEditing(product);
    reset(product);
    setModalOpen(true);
  };

  /**
   * Activa o desactiva un producto sin eliminarlo.
   * Útil cuando un producto deja de venderse temporalmente pero
   * puede reactivarse después sin perder su historial de ventas.
   */
  const handleToggle = async (row) => {
    try {
      await productService.toggle(row.id);
      toast.success(`Producto ${row.activo ? 'desactivado' : 'activado'} correctamente`);
      await loadProducts();
    } catch (error) {
      toast.error('Error al cambiar el estado del producto');
    }
  };

  /**
   * Unifica la lógica de crear y editar en un solo handler.
   * El campo `editing` determina qué operación ejecutar.
   */
  const onSubmit = async (data) => {
    try {
      if (editing) {
        await productService.update(editing.id, data);
        toast.success('Producto actualizado');
      } else {
        await productService.create(data);
        toast.success('Producto creado exitosamente');
      }
      await loadProducts();
      setModalOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar el producto');
    }
  };

  /**
   * Eliminación permanente — solo se llega aquí después de que el usuario
   * confirmó en el ConfirmDialog. Se actualiza el estado local directamente
   * para no hacer un round-trip extra al servidor.
   */
  const handleDelete = async () => {
    try {
      await productService.remove(deleteTarget.id);
      setProducts(ps => ps.filter(p => p.id !== deleteTarget.id));
      toast.success('Producto eliminado');
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar el producto');
    } finally {
      // Cierra el diálogo pase lo que pase
      setDeleteTarget(null);
    }
  };

  /**
   * Definición de columnas para DataTable.
   *
   * - categoria_id y proveedor_id llegan como IDs numéricos desde el backend,
   *   por eso se resuelven contra los catálogos locales en el render.
   *   Se compara con Number(v) porque el <select> devuelve strings.
   *
   * - Stock: tres estados visuales según la cantidad relativa al stock_minimo:
   *     rojo   → sin existencias
   *     amarillo → por debajo del mínimo (alerta)
   *     normal  → todo bien
   */
  const columns = [
    {
      key: 'codigo',
      label: 'Código',
      render: v => <span className="font-mono text-xs text-gray-400">{v}</span>
    },
    {
      key: 'nombre',
      label: 'Producto',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-800">{v}</p>
          <p className="text-xs text-gray-400">{row.unidad || 'Unidad'}</p>
        </div>
      )
    },
    {
      key: 'categoria_id',
      label: 'Categoría',
      render: v => {
        const cat = categories.find(c => c.id === v || c.id === Number(v));
        return (
          <span className="text-blue-800 badge bg-pastel-primary/30">
            {cat ? (cat.nombre || cat.name) : (v || 'Sin categoría')}
          </span>
        );
      }
    },
    {
      key: 'precio_venta',
      label: 'Precio',
      render: v => <span className="font-semibold">{formatCurrency(v)}</span>
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (v, row) => (
        <div className="flex items-center gap-1.5">
          {v <= row.stock_minimo && <AlertTriangle size={12} className="text-yellow-500" />}
          <span className={
            v === 0          ? 'text-red-500 font-semibold'
            : v <= row.stock_minimo ? 'text-yellow-600 font-semibold'
            : 'text-gray-700'
          }>
            {v}
          </span>
        </div>
      )
    },
    {
      key: 'proveedor_id',
      label: 'Proveedor',
      render: v => {
        const proveedor = suppliers.find(s => s.id === v || s.id === Number(v));
        return <span>{proveedor ? (proveedor.nombre || proveedor.name) : '—'}</span>;
      }
    },
    {
      key: 'activo',
      label: 'Estado',
      render: v => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          {v ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
  ];

  return (
    <MainLayout title="Productos">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{products.length} productos registrados</p>
          <button onClick={openCreate} className="flex items-center gap-2 btn-primary">
            <Plus size={16} /> Nuevo Producto
          </button>
        </div>

        <div className="card">
          <DataTable
            data={products}
            columns={columns}
            searchFields={['nombre', 'codigo', 'categoria_id', 'proveedor_id']}
            actions={(row) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(row)}
                  className="p-1.5 hover:bg-pastel-primary/20 rounded-lg transition-colors text-blue-600"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>

                {/* Toggle activo/inactivo — alternativa a eliminar */}
                <button
                  onClick={() => handleToggle(row)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    row.activo
                      ? 'hover:bg-orange-100 text-orange-500'
                      : 'hover:bg-green-100 text-green-600'
                  }`}
                  title={row.activo ? 'Desactivar' : 'Activar'}
                >
                  {row.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>

                {/* Eliminar — abre el ConfirmDialog antes de ejecutar */}
                <button
                  onClick={() => setDeleteTarget(row)}
                  className="p-1.5 hover:bg-pastel-accent/30 rounded-lg transition-colors text-red-500"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          />
        </div>
      </div>

      {/* Modal compartido para crear y editar.
          El título y el botón de submit cambian según `editing`. */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title={editing ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" required error={errors.nombre?.message}>
              <FormInput register={register('nombre')} placeholder="Nombre del producto" error={errors.nombre} />
            </FormField>
            {/* El código es opcional — si no se ingresa, el backend puede autogenerarlo */}
            <FormField label="Código" error={errors.codigo?.message}>
              <FormInput register={register('codigo')} placeholder="Ej: PROD-001" error={errors.codigo} />
            </FormField>
          </div>

          <FormField label="Descripción" error={errors.descripcion?.message}>
            <FormTextarea register={register('descripcion')} placeholder="Descripción opcional..." error={errors.descripcion} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Precio de venta" required error={errors.precio_venta?.message}>
              <FormInput register={register('precio_venta')} type="number" step="0.01" placeholder="0.00" error={errors.precio_venta} />
            </FormField>
            {/*
              stock_minimo es solo el umbral de alerta visual en la tabla.
              NO modifica el stock real — eso lo hacen las compras y las ventas.
            */}
            <FormField
              label="Stock mínimo"
              error={errors.stock_minimo?.message}
              hint="Umbral de alerta — el stock real solo cambia por compras y ventas"
            >
              <FormInput register={register('stock_minimo')} type="number" placeholder="0" error={errors.stock_minimo} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Categoría" required error={errors.categoria_id?.message}>
              <FormSelect register={register('categoria_id')} error={errors.categoria_id}>
                <option value="">Seleccionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nombre || c.name}</option>)}
              </FormSelect>
            </FormField>
            <FormField label="Proveedor" error={errors.proveedor_id?.message}>
              <FormSelect register={register('proveedor_id')} error={errors.proveedor_id}>
                <option value="">Seleccionar...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre || s.name}</option>)}
              </FormSelect>
            </FormField>
          </div>

          <FormField label="Unidad de medida" error={errors.unidad?.message}>
            <FormSelect register={register('unidad')} error={errors.unidad}>
              <option value="unidad">Unidad</option>
              <option value="caja">Caja</option>
              <option value="kg">Kilogramo</option>
              <option value="litro">Litro</option>
              <option value="metro">Metro</option>
            </FormSelect>
          </FormField>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setModalOpen(false); reset(); }}
              className="border border-gray-200 btn-ghost"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editing ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmación antes de eliminar — evita borrados accidentales */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar producto?"
        message={`Se eliminará "${deleteTarget?.nombre}" permanentemente.`}
      />
    </MainLayout>
  );
}
