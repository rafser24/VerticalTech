import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import MainLayout from '../components/layout/MainLayout';
import CrudPage from '../components/ui/CrudPage';
import { FormField, FormInput } from '../components/ui/FormFields';
import { clientSchema } from '../schemas';

function ClientForm({ register, errors }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre" required error={errors.nombre?.message}>
          <FormInput register={register('nombre')} placeholder="Nombre del cliente" error={errors.nombre} />
        </FormField>
        <FormField label="Apellido" required error={errors.apellido?.message}>
          <FormInput register={register('apellido')} placeholder="Apellidos" error={errors.apellido} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Correo electrónico" required error={errors.email?.message}>
          <FormInput register={register('email')} type="email" placeholder="cliente@mail.com" error={errors.email} />
        </FormField>
        <FormField label="Teléfono" required error={errors.telefono?.message}>
          <FormInput
            register={register('telefono', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 8);
              }
            })}
            placeholder="7777-8888"
            error={errors.telefono}
            maxLength="8"
          />
        </FormField>
      </div>

      <FormField label="Dirección" required error={errors.direccion?.message}>
        <FormInput register={register('direccion')} placeholder="Dirección completa" error={errors.direccion} />
      </FormField>

      <FormField label="DUI" required error={errors.dui?.message}>
        <FormInput
          register={register('dui', {
            onChange: (e) => {
              let val = e.target.value.replace(/\D/g, '');
              if (val.length > 8) {
                val = val.substring(0, 8) + '-' + val.substring(8, 9);
              }
              e.target.value = val;
            }
          })}
          placeholder="12345678-9"
          error={errors.dui}
          maxLength="10"
        />
      </FormField>
    </div>
  );
}

const columns = [
  { key: 'nombre', label: 'Cliente', render: (v, row) => <span className="font-medium">{v} {row?.apellido || ''}</span> },
  { key: 'email', label: 'Correo' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'direccion', label: 'Dirección', render: v => v ? v : '—' },
  { key: 'dui', label: 'DUI', render: v => v ? <span className="font-mono text-xs">{v}</span> : '—' },
];

export default function ClientsPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clientes');
      const data = response.data.data || response.data;
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await api.put(`/clientes/${data.id}`, data);
        toast.success('Cliente actualizado exitosamente');
      } else {
        await api.post('/clientes', data);
        toast.success('Cliente creado exitosamente');
      }
      await loadData();
      return true;
    } catch (error) {
      const errores = error.response?.data?.errors;
      if (errores?.dui) {
        toast.warn('El DUI ingresado ya está registrado en el sistema.', { autoClose: 5000, icon: '⚠️' });
      } else {
        toast.error(error.response?.data?.message || 'Error al guardar');
      }
      return false;
    }
  };

  const handleDelete = async (row) => {
    try {
      await api.delete(`/clientes/${row.id}`);
      toast.success('Cliente eliminado');
      await loadData();
      return true;
    } catch (error) {
      toast.error('Error al eliminar');
      return false;
    }
  };

  return (
    <MainLayout title="Clientes">
      {loading && clientes.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Cargando clientes...</p>
        </div>
      ) : (
        <CrudPage
          entityName="Cliente"
          initialData={clientes}
          columns={columns}
          searchFields={['nombre', 'email', 'telefono']}
          schema={clientSchema}
          FormContent={ClientForm}
          modalSize="lg"
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </MainLayout>
  );
}
