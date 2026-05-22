import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from "../services/api";
import MainLayout from '../components/layout/MainLayout';
import CrudPage from '../components/ui/CrudPage';
import { FormField, FormInput } from '../components/ui/FormFields';
import { supplierSchema } from '../schemas';

function SupplierForm({ register, errors }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre Comercial" required error={errors.nombre?.message}>
          <FormInput register={register('nombre')} placeholder="Empresa S.A." error={errors.nombre} />
        </FormField>
        <FormField label="Razón Social" required error={errors.razon_social?.message}>
          <FormInput register={register('razon_social')} placeholder="Razón legal" error={errors.razon_social} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Persona de Contacto" required error={errors.contacto?.message}>
          <FormInput register={register('contacto')} placeholder="Nombre del contacto" error={errors.contacto} />
        </FormField>
        <FormField label="NIT" required error={errors.nit?.message}>
          <FormInput
            register={register('nit', {
              onChange: (e) => {
                let v = e.target.value.replace(/\D/g, '');
                v = v.replace(/^(\d{4})(\d)/, '$1-$2');
                v = v.replace(/^(\d{4}-\d{6})(\d)/, '$1-$2');
                v = v.replace(/^(\d{4}-\d{6}-\d{3})(\d)/, '$1-$2');
                e.target.value = v.substring(0, 17);
              }
            })}
            placeholder="0614-000000-000-0"
            error={errors.nit}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Correo Electrónico" required error={errors.email?.message}>
          <FormInput register={register('email')} type="email" placeholder="correo@empresa.com" error={errors.email} />
        </FormField>
        <FormField label="Teléfono" required error={errors.telefono?.message}>
          <FormInput
            register={register('telefono', {
              onChange: (e) => {
                let v = e.target.value.replace(/\D/g, '');
                v = v.replace(/^(\d{4})(\d)/, '$1-$2');
                e.target.value = v.substring(0, 9);
              }
            })}
            placeholder="2222-3333"
            error={errors.telefono}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <FormField label="Dirección" required error={errors.direccion?.message}>
          <FormInput register={register('direccion')} placeholder="Dirección completa" error={errors.direccion} />
        </FormField>
      </div>
    </div>
  );
}

const columns = [
  { key: 'nombre', label: 'Empresa', render: v => <span className="font-medium">{v}</span> },
  { key: 'contacto', label: 'Contacto' },
  { key: 'email', label: 'Correo' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'nit', label: 'NIT', render: v => <span className="font-mono text-xs">{v}</span> },
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

export default function SuppliersPage() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/proveedores');
      const data = response.data.data || response.data;
      const arr = Array.isArray(data) ? data : [];
      // Activos primero, inactivos abajo
      const sorted = [...arr].sort((a, b) => (b.activo ? 1 : 0) - (a.activo ? 1 : 0));
      setProveedores(sorted);
    } catch (error) {
      console.error("Error cargando:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggleActivo = async (row) => {
    try {
      
      
      await api.patch(`/proveedores/${row.id}/toggle`);
      toast.success(`Proveedor ${row.activo ? 'desactivado' : 'activado'} correctamente`);
      await loadData();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error("Error al cambiar el estado del proveedor");
    }
  };
  

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await api.put(`/proveedores/${data.id}`, data);
        toast.success('Proveedor actualizado exitosamente');
      } else {
        await api.post('/proveedores', data);
        toast.success('Proveedor creado exitosamente');
      }
      await loadData();
      return true;
    } catch (error) {
      const errores = error.response?.data?.errors;
      const mensaje = error.response?.data?.message;
      if (errores?.nit) {
        toast.warn(errores.nit[0], { autoClose: 5000, icon: '⚠️' });
        return false;
      }
      if (errores) {
        toast.error(Object.values(errores)[0]?.[0] || mensaje || 'Error de validación');
        return false;
      }
      toast.error(mensaje || 'Error al guardar el proveedor');
      return false;
    }
  };

  const handleDelete = async (row) => {
    try {
      await api.delete(`/proveedores/${row.id}`);
      toast.success('Proveedor eliminado');
      await loadData();
      return true;
    } catch (error) {
      toast.error('Error al eliminar el proveedor');
      return false;
    }
  };

  return (
    <MainLayout title="Proveedores">
      {loading && proveedores.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Cargando proveedores...</p>
        </div>
      ) : (
        <CrudPage
          entityName="Proveedor"
          initialData={proveedores}
          columns={columns}
          searchFields={['nombre', 'email', 'contacto', 'nit']}
          schema={supplierSchema}
          FormContent={SupplierForm}
          modalSize="lg"
          onSave={handleSave}
          onDelete={handleDelete}
          onToggle={handleToggleActivo}
        />
      )}
    </MainLayout>
  );
}