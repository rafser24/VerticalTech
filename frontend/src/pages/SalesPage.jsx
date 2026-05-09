import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Plus, Trash2, Eye, User, CreditCard, Package, FileText, Hash } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { FormField, FormSelect, FormTextarea, FormInput } from '../components/ui/FormFields';
import { saleSchema } from '../schemas';
import { formatCurrency, formatDate, statusColors } from '../utils/helpers';
import { saleService, clientService, productService, paymentMethodService } from '../services/api';

/* ─── Modal detalle de venta ─────────────────────────────────────────────── */
function SaleDetailModal({ isOpen, onClose, sale, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sale ? `Detalle — ${sale.numero_venta ?? ''}` : 'Cargando...'} size="lg">
      {loading || !sale ? (
        <div className="space-y-3 animate-pulse">
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
          </div>
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Info general */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Hash size={11} /> N° Venta
              </p>
              <p className="text-sm font-mono font-medium text-gray-800">
                {sale.numero_venta ?? `#${String(sale.id).padStart(4, '0')}`}
              </p>
              <span className={`badge text-xs mt-1 inline-block ${statusColors[sale.estado] ?? ''}`}>
                {sale.estado}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <User size={11} /> Cliente
              </p>
              <p className="text-sm font-medium text-gray-800">
                {sale.cliente
                  ? `${sale.cliente.nombre ?? ''} ${sale.cliente.apellido ?? ''}`.trim()
                  : 'Cliente General'}
              </p>
              {sale.cliente?.telefono && (
                <p className="text-xs text-gray-400 mt-0.5">{sale.cliente.telefono}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <CreditCard size={11} /> Método de pago
              </p>
              <p className="text-sm font-medium text-gray-800">
                {sale.metodo_pago?.nombre ?? sale.metodoPago?.nombre ?? '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.fecha_venta)}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <User size={11} /> Vendedor
              </p>
              <p className="text-sm font-medium text-gray-800">
                {sale.usuario?.nombre ?? sale.usuario?.name ?? '—'}
              </p>
            </div>
          </div>

          {/* Notas */}
          {sale.notas && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
              <FileText size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">{sale.notas}</p>
            </div>
          )}

          {/* Tabla productos */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
            <Package size={11} /> Productos
          </p>
          <div className="border border-gray-100 rounded-xl overflow-hidden mb-5">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5">Producto</th>
                  <th className="text-center px-3 py-2.5">Cant.</th>
                  <th className="text-right px-3 py-2.5">P. Unit.</th>
                  <th className="text-right px-4 py-2.5">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(sale.detalles ?? []).map((d, i) => {
                  const linea = (d.cantidad * d.precio_unitario) - (parseFloat(d.descuento) || 0);
                  return (
                    <tr key={d.id ?? i} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {d.producto?.nombre_producto ?? d.producto?.nombre ?? '—'}
                        </p>
                        {d.producto?.marca && (
                          <p className="text-xs text-gray-400">{d.producto.marca}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">{d.cantidad}</td>
                      <td className="px-3 py-3 text-right text-gray-600">
                        {formatCurrency(d.precio_unitario)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {formatCurrency(linea)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-60 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(sale.subtotal ?? 0)}</span>
              </div>
              {parseFloat(sale.descuento) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Descuento</span>
                  <span>-{formatCurrency(sale.descuento)}</span>
                </div>
              )}
              {parseFloat(sale.impuesto) > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Impuesto</span>
                  <span>{formatCurrency(sale.impuesto)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-green-700">{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ─── Formulario nueva venta ─────────────────────────────────────────────── */
function SaleForm({ register, control, errors, watch, clients, products, paymentMethods }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items    = watch('items') || [];
  const discount = Number(watch('discount') || 0);
  const subtotal = items.reduce((s, i) => s + (Number(i.quantity || 0) * Number(i.unit_price || 0)), 0);
  const total    = subtotal * (1 - discount / 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Cliente" error={errors.client_id?.message}>
          <FormSelect register={register('client_id')} error={errors.client_id}>
            <option value="">Cliente general</option>
            {clients.map(c => (
              <option key={c.id_cliente ?? c.id} value={c.id_cliente ?? c.id}>
                {c.nombre ?? c.name}
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

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Descuento (%)" error={errors.discount?.message}>
          <FormInput register={register('discount')} type="number" min="0" max="100" placeholder="0" error={errors.discount} />
        </FormField>
        <FormField label="Notas" error={errors.notes?.message}>
          <FormInput register={register('notes')} placeholder="Observaciones..." error={errors.notes} />
        </FormField>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Productos <span className="text-red-400">*</span></label>
          <button type="button" onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })} className="text-xs btn-secondary py-1 px-3 flex items-center gap-1">
            <Plus size={12} /> Agregar
          </button>
        </div>
        {errors.items && <p className="text-xs text-red-500 mb-2">{errors.items.message || errors.items.root?.message}</p>}

        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-xl">
              <div className="col-span-5">
                <select {...register(`items.${i}.product_id`)} className="input-field text-xs py-2">
                  <option value="">Producto...</option>
                  {products.map(p => (
                    <option key={p.id_producto ?? p.id} value={p.id_producto ?? p.id}>
                      {p.nombre_producto ?? p.nombre ?? p.name} (Stock: {p.stock ?? '?'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <input {...register(`items.${i}.quantity`)} type="number" min="1" placeholder="Cant." className="input-field text-xs py-2" />
              </div>
              <div className="col-span-3">
                <input {...register(`items.${i}.unit_price`)} type="number" step="0.01" placeholder="Precio" className="input-field text-xs py-2" />
              </div>
              <div className="col-span-1 text-xs text-right text-gray-500">
                {formatCurrency((items[i]?.quantity || 0) * (items[i]?.unit_price || 0))}
              </div>
              <div className="col-span-1 flex justify-end">
                <button type="button" onClick={() => remove(i)} className="p-1 hover:bg-red-100 rounded-lg text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {fields.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal:</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Descuento ({discount}%):</span>
                <span>-{formatCurrency(subtotal * discount / 100)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t">
              <span>Total:</span><span>{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
export default function SalesPage() {
  const [sales, setSales]                   = useState([]);
  const [clients, setClients]               = useState([]);
  const [products, setProducts]             = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [modalOpen, setModalOpen]           = useState(false);
  const [detail, setDetail]                 = useState({ open: false, sale: null, loading: false });
  const [loading, setLoading]               = useState(true);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(saleSchema),
    defaultValues: { items: [], discount: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [salesRes, clientsRes, productsRes, paymentsRes] = await Promise.all([
          saleService.getAll(),
          clientService.getAll(),
          productService.getAll(),
          paymentMethodService.getAll(),
        ]);
        const unwrap = (res) => {
          const d = res.data?.data ?? res.data;
          return Array.isArray(d) ? d : d?.data ?? d?.items ?? [];
        };
        setSales(unwrap(salesRes));
        setClients(unwrap(clientsRes));
        setProducts(unwrap(productsRes));
        setPaymentMethods(unwrap(paymentsRes));
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewDetail = async (row) => {
    setDetail({ open: true, sale: null, loading: true });
    try {
      const res  = await saleService.getById(row.id);
      const sale = res.data?.data ?? res.data;
      setDetail({ open: true, sale, loading: false });
    } catch {
      toast.error('No se pudo cargar el detalle');
      setDetail({ open: false, sale: null, loading: false });
    }
  };

  const closeDetail = () => setDetail({ open: false, sale: null, loading: false });

  const onSubmit = async (data) => {
    try {
      const payload = {
        cliente_id:     data.client_id || null,
        metodo_pago_id: data.payment_method_id,
        descuento:      Number(data.discount || 0),
        notas:          data.notes,
        items: data.items.map(i => ({
          producto_id:     i.product_id,
          cantidad:        Number(i.quantity),
          precio_unitario: Number(i.unit_price),
        })),
      };
      await saleService.create(payload);
      toast.success('Venta registrada exitosamente');
      setModalOpen(false);
      reset({ items: [], discount: 0 });
      const listRes = await saleService.getAll();
      const d = listRes.data?.data ?? listRes.data;
      setSales(Array.isArray(d) ? d : d?.data ?? []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar la venta');
    }
  };

  const handleClose = () => { setModalOpen(false); reset({ items: [], discount: 0 }); };

  const columns = [
    {
      key: 'id',
      label: '#',
      render: (v, row) => (
        <span className="font-mono text-xs text-gray-400">
          {row.numero_venta ?? `#${String(v).padStart(4, '0')}`}
        </span>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (v, row) => (
        <span className="font-medium">{row.cliente?.nombre ?? 'Cliente General'}</span>
      ),
    },
    { key: 'fecha_venta', label: 'Fecha', render: (v, row) => formatDate(v ?? row.fecha) },
    {
      key: 'detalles_count',
      label: 'Items',
      render: (v, row) => (
        <span className="badge bg-pastel-secondary/40 text-green-800">
          {v ?? row.detalles?.length ?? '—'}
        </span>
      ),
    },
    { key: 'total', label: 'Total', render: v => <span className="font-semibold text-green-700">{formatCurrency(v)}</span> },
    { key: 'metodo_pago', label: 'Pago', render: (v, row) => row.metodo_pago?.nombre ?? v ?? '—' },
    { key: 'estado', label: 'Estado', render: v => <span className={`badge ${statusColors[v] ?? ''}`}>{v ?? '—'}</span> },
  ];

  return (
    <MainLayout title="Ventas">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando...' : `${sales.length} ventas registradas`}
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <Plus size={16} /> Nueva Venta
          </button>
        </div>

        <div className="card">
          <DataTable
            data={sales}
            columns={columns}
            searchFields={['estado']}
            actions={(row) => (
              <button
                onClick={() => handleViewDetail(row)}
                className="p-1.5 hover:bg-pastel-secondary/30 rounded-lg transition-colors text-green-600"
                title="Ver detalle"
              >
                <Eye size={14} />
              </button>
            )}
          />
        </div>
      </div>

      {/* Modal detalle */}
      <SaleDetailModal
        isOpen={detail.open}
        onClose={closeDetail}
        sale={detail.sale}
        loading={detail.loading}
      />

      {/* Modal nueva venta */}
      <Modal isOpen={modalOpen} onClose={handleClose} title="Nueva Venta" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SaleForm
            register={register} control={control} errors={errors} watch={watch}
            clients={clients} products={products} paymentMethods={paymentMethods}
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={handleClose} className="btn-ghost border border-gray-200">Cancelar</button>
            <button type="submit" className="btn-secondary">Registrar Venta</button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
