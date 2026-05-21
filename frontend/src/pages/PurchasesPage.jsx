import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Plus, Trash2, CheckCircle, PackageCheck, XCircle, ChevronLeft } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FormField, FormSelect, FormTextarea } from '../components/ui/FormFields';
import { purchaseSchema } from '../schemas';
import { formatCurrency, formatDate, statusColors } from '../utils/helpers';
import { purchaseService, supplierService, productService, paymentMethodService } from '../services/api';

// ── Etiquetas y flujo de etapas ──────────────────────────────────────────────
const ESTADO_LABEL = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  recibida:   'Recibida',
  anulada:    'Anulada',
};

const ACCIONES = {
  pendiente:  ['confirmar', 'anular'],
  confirmada: ['recibir', 'retroceder', 'anular'],
  recibida:   ['retroceder'],
  anulada:    [],
};

// ── Formulario de nueva compra ───────────────────────────────────────────────
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

// ── Indicador visual de progreso ─────────────────────────────────────────────
function PasoEtapa({ estado }) {
  const etapas = ['pendiente', 'confirmada', 'recibida'];
  if (estado === 'anulada') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
        <XCircle size={14} /> Anulada
      </span>
    );
  }
  const actual = etapas.indexOf(estado);
  return (
    <div className="flex items-center gap-1">
      {etapas.map((e, idx) => (
        <div key={e} className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${idx <= actual ? 'bg-blue-500' : 'bg-gray-200'}`} />
          {idx < etapas.length - 1 && (
            <div className={`w-4 h-0.5 ${idx < actual ? 'bg-blue-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
      <span className={`ml-1 text-xs font-medium badge ${statusColors[estado] ?? ''}`}>
        {ESTADO_LABEL[estado] ?? estado}
      </span>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function PurchasesPage() {
  const [purchases, setPurchases]           = useState([]);
  const [suppliers, setSuppliers]           = useState([]);
  const [products, setProducts]             = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [modalOpen, setModalOpen]           = useState(false);
  const [loading, setLoading]               = useState(true);
  const [actionTarget, setActionTarget]     = useState(null);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { items: [] },
  });

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

  const recargar = async () => {
    const res = await purchaseService.getAll();
    const d = res.data?.data ?? res.data;
    setPurchases(Array.isArray(d) ? d : d?.data ?? []);
  };

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
      await purchaseService.create(payload);
      toast.success('Compra registrada. Queda pendiente de confirmación.');
      setModalOpen(false);
      reset({ items: [] });
      await recargar();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al registrar la compra';
      toast.error(msg);
    }
  };

  const ejecutarAccion = async () => {
    if (!actionTarget) return;
    const { compra, accion } = actionTarget;
    setActionTarget(null);
    try {
      if (accion === 'confirmar') {
        await purchaseService.confirmar(compra.id);
        toast.success('Compra confirmada.');
      } else if (accion === 'recibir') {
        await purchaseService.recibir(compra.id);
        toast.success('Mercancía recibida. Stock actualizado.');
      } else if (accion === 'anular') {
        await purchaseService.anular(compra.id);
        toast.success('Compra anulada.');
      } else if (accion === 'retroceder') {
        await purchaseService.retroceder(compra.id);
        toast.success('Compra retrocedida a la etapa anterior.');
      }
      await recargar();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al actualizar la compra';
      toast.error(msg);
    }
  };

  const handleClose = () => { setModalOpen(false); reset({ items: [] }); };

  const dialogTextos = {
    confirmar: {
      title: '¿Confirmar esta compra?',
      message: 'Indica que el proveedor aceptó el pedido. El stock aún no se modifica.',
    },
    recibir: {
      title: '¿Marcar como recibida?',
      message: 'Confirma que la mercancía llegó físicamente. El stock se actualizará en este momento.',
    },
    anular: {
      title: '¿Anular esta compra?',
      message: 'La compra quedará cancelada y no se podrá reactivar.',
    },
    retroceder: {
      title: '¿Retroceder esta compra?',
      message: 'La compra volverá a la etapa anterior. Si está recibida, el stock se revertirá automáticamente.',
    },
  };

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
      render: (v) => <PasoEtapa estado={v} />,
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
            actions={(row) => {
              const acciones = ACCIONES[row.estado] ?? [];
              return (
                <div className="flex items-center gap-1">
                  {acciones.includes('retroceder') && (
                    <button
                      onClick={() => setActionTarget({ compra: row, accion: 'retroceder' })}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                      title="Retroceder etapa"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  )}
                  {acciones.includes('confirmar') && (
                    <button
                      onClick={() => setActionTarget({ compra: row, accion: 'confirmar' })}
                      className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                      title="Confirmar pedido"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  {acciones.includes('recibir') && (
                    <button
                      onClick={() => setActionTarget({ compra: row, accion: 'recibir' })}
                      className="p-1.5 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                      title="Marcar como recibida"
                    >
                      <PackageCheck size={14} />
                    </button>
                  )}
                  {acciones.includes('anular') && (
                    <button
                      onClick={() => setActionTarget({ compra: row, accion: 'anular' })}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                      title="Anular compra"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              );
            }}
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

      <ConfirmDialog
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={ejecutarAccion}
        title={actionTarget ? dialogTextos[actionTarget.accion]?.title : ''}
        message={actionTarget ? dialogTextos[actionTarget.accion]?.message : ''}
        confirmText={
          actionTarget?.accion === 'confirmar'  ? 'Confirmar pedido'      :
          actionTarget?.accion === 'recibir'    ? 'Marcar como recibida'  :
          actionTarget?.accion === 'retroceder' ? 'Sí, retroceder'        :
          'Anular compra'
        }
        confirmClass={
          actionTarget?.accion === 'anular' ? 'btn-danger' : 'btn-primary'
        }
      />
    </MainLayout>
  );
}
