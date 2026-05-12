import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Plus, Trash2, Eye } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { FormField, FormSelect, FormTextarea } from '../components/ui/FormFields';
import { purchaseSchema } from '../schemas';
import { formatCurrency, formatDate, statusColors } from '../utils/helpers';
import { purchaseService, supplierService, productService, paymentMethodService } from '../services/api';

function PurchaseForm({ register, control, errors, watch, suppliers, products, paymentMethods }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items') || [];
  const total = items.reduce((sum, item) => {
    return sum + (Number(item.quantity || 0) * Number(item.unit_price || 0));
  }, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Proveedor" required error={errors.supplier_id?.message}>
          <FormSelect register={register('supplier_id')} error={errors.supplier_id}>
            <option value="">Seleccionar...</option>
            {suppliers.map(s => (
              <option key={s.id_proveedor ?? s.id} value={s.id_proveedor ?? s.id}>
                {s.nombre ?? s.name}
              </option>
            ))}
          </FormSelect>
        </FormField>
        <FormField label="Método de pago" required error={errors.payment_method_id?.message}>
          <FormSelect register={register('payment_method_id')} error={errors.payment_method_id}>
            <option value="">Seleccionar...</option>
            {paymentMethods.map(m => (
              <option key={m.id_metodo_pago ?? m.id} value={m.id_metodo_pago ?? m.id}>
                {m.nombre ?? m.name}
              </option>
            ))}
          </FormSelect>
        </FormField>
      </div>

      <FormField label="Notas" error={errors.notes?.message}>
        <FormTextarea register={register('notes')} placeholder="Notas u observaciones..." error={errors.notes} />
      </FormField>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Productos <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}
            className="text-xs btn-primary py-1 px-3 flex items-center gap-1"
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
        {errors.items && (
          <p className="text-xs text-red-500 mb-2">
            {errors.items.message || errors.items.root?.message}
          </p>
        )}

        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-xl">
              <div className="col-span-5">
                <select {...register(`items.${i}.product_id`)} className="input-field text-xs py-2">
                  <option value="">Producto...</option>
                  {products.map(p => (
                    <option key={p.id_producto ?? p.id} value={p.id_producto ?? p.id}>
                      {p.nombre_producto ?? p.nombre ?? p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <input
                  {...register(`items.${i}.quantity`)}
                  type="number" min="1" placeholder="Cant."
                  className="input-field text-xs py-2"
                />
              </div>
              <div className="col-span-3">
                <input
                  {...register(`items.${i}.unit_price`)}
                  type="number" step="0.01" placeholder="Precio unit."
                  className="input-field text-xs py-2"
                />
              </div>
              <div className="col-span-1 text-xs text-gray-500 text-right">
                {formatCurrency((items[i]?.quantity || 0) * (items[i]?.unit_price || 0))}
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  type="button" onClick={() => remove(i)}
                  className="p-1 hover:bg-red-100 rounded-lg text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {fields.length > 0 && (
          <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
            <span className="font-semibold text-gray-800">Total: {formatCurrency(total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  const [purchases, setPurchases]       = useState([]);
  const [suppliers, setSuppliers]       = useState([]);
  const [products, setProducts]         = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [modalOpen, setModalOpen]       = useState(false);
  const [loading, setLoading]           = useState(true);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { items: [] },
  });

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [purchasesRes, suppliersRes, productsRes, paymentsRes] = await Promise.all([
          purchaseService.getAll(),
          supplierService.getAll(),
          productService.getAll(),
          paymentMethodService.getAll(),
        ]);

        const unwrap = (res) => {
          const d = res.data?.data ?? res.data;
          return Array.isArray(d) ? d : d?.data ?? d?.items ?? [];
        };

        setPurchases(unwrap(purchasesRes));
        setSuppliers(unwrap(suppliersRes));
        setProducts(unwrap(productsRes));
        setPaymentMethods(unwrap(paymentsRes));
      } catch (error) {
        console.error('Error al cargar datos de compras:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Registrar compra ─────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      const payload = {
        proveedor_id:   data.supplier_id,
        metodo_pago_id: data.payment_method_id,
        notas:          data.notes,
        items: data.items.map(i => ({
          producto_id:     i.product_id,
          cantidad:        Number(i.quantity),
          precio_unitario: Number(i.unit_price),
        })),
      };

      const res = await purchaseService.create(payload);
      const nueva = res.data?.data ?? res.data;

      setPurchases(prev => [nueva, ...prev]);
      toast.success('Compra registrada exitosamente');
      setModalOpen(false);
      reset({ items: [] });

      // Refrescar lista completa para tener datos actualizados
      const listRes = await purchaseService.getAll();
      const d = listRes.data?.data ?? listRes.data;
      setPurchases(Array.isArray(d) ? d : d?.data ?? []);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al registrar la compra';
      toast.error(msg);
      console.error(error);
    }
  };

  const handleClose = () => { setModalOpen(false); reset({ items: [] }); };

  // ── Columnas de la tabla ─────────────────────────────────────────────────
  const columns = [
    {
      key: 'id',
      label: '#',
      render: v => (
        <span className="font-mono text-xs text-gray-400">
          #{String(v).slice(-4).padStart(4, '0')}
        </span>
      ),
    },
    {
      key: 'proveedor',
      label: 'Proveedor',
      render: (v, row) => (
        <span className="font-medium">
          {row.proveedor?.nombre ?? row.supplier ?? v ?? '—'}
        </span>
      ),
    },
    {
      key: 'fecha_compra',
      label: 'Fecha',
      render: (v, row) => formatDate(v ?? row.fecha ?? row.date),
    },
    {
      key: 'detalles_count',
      label: 'Items',
      render: (v, row) => (
        <span className="badge bg-pastel-primary/30 text-blue-800">
          {v ?? row.items_count ?? row.detalles?.length ?? '—'}
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: v => <span className="font-semibold">{formatCurrency(v)}</span>,
    },
    {
      key: 'metodo_pago',
      label: 'Pago',
      render: (v, row) => row.metodo_pago?.nombre ?? row.payment_method ?? v ?? '—',
    },
    {
      key: 'estado',
      label: 'Estado',
      render: v => <span className={`badge ${statusColors[v] ?? ''}`}>{v ?? '—'}</span>,
    },
  ];

  return (
    <MainLayout title="Compras">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando...' : `${purchases.length} compras registradas`}
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nueva Compra
          </button>
        </div>

        <div className="card">
          <DataTable
            data={purchases}
            columns={columns}
            searchFields={['estado']}
            actions={(row) => (
              <button className="p-1.5 hover:bg-pastel-primary/20 rounded-lg transition-colors text-blue-600">
                <Eye size={14} />
              </button>
            )}
          />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={handleClose} title="Nueva Compra" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PurchaseForm
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            suppliers={suppliers}
            products={products}
            paymentMethods={paymentMethods}
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={handleClose} className="btn-ghost border border-gray-200">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Registrar Compra
            </button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
