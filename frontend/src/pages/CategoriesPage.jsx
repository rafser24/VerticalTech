import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import MainLayout from '../components/layout/MainLayout';
import CrudPage from '../components/ui/CrudPage';
import { FormField, FormInput, FormTextarea } from '../components/ui/FormFields';
import { categorySchema } from '../schemas';
import api from '../services/api';

function CategoryForm({ register, errors }) {
  return (
    <>
      <FormField label="Nombre" required error={errors.nombre?.message}>
        <FormInput register={register('nombre')} placeholder="Nombre de la categoría" error={errors.nombre} />
      </FormField>
      <FormField label="Descripción" error={errors.descripcion?.message}>
        <FormTextarea register={register('descripcion')} placeholder="Descripción opcional..." error={errors.descripcion} />
      </FormField>
    </>
  );
}

const columns = [
  { key: 'id', label: '#', render: (v, row, i) => <span className="text-xs text-gray-400">{i + 1}</span> },
  { key: 'nombre', label: 'Nombre', render: v => <span className="font-medium">{v}</span> },
  { key: 'descripcion', label: 'Descripción' },
  {
    key: 'activo',
    label: 'Estado',
    render: v => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
      }`}>
        {v ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categorias');

      let dataFinal = [];
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        dataFinal = response.data.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        dataFinal = response.data.data;
      } else if (Array.isArray(response.data)) {
        dataFinal = response.data;
      }

      // Activos arriba, inactivos abajo
      const sorted = [...dataFinal].sort((a, b) => (b.activo ? 1 : 0) - (a.activo ? 1 : 0));
      setCategories(sorted);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleToggle = async (row) => {
    try {
      await api.patch(`/categorias/${row.id}/toggle`);
      toast.success(`Categoría ${row.activo ? 'desactivada' : 'activada'} correctamente`);
      await fetchCategories();
    } catch (error) {
      toast.error('Error al cambiar el estado de la categoría');
    }
  };

  const handleSave = async (formData) => {
    try {
      if (formData.id) {
        await api.put(`/categorias/${formData.id}`, formData);
        toast.success('Categoría actualizada correctamente');
      } else {
        await api.post('/categorias', formData);
        toast.success('Categoría creada correctamente');
      }
      fetchCategories();
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al guardar';
      toast.error(msg);
      return false;
    }
  };

  const handleDelete = async (item) => {
    try {
      await api.delete(`/categorias/${item.id}`);
      toast.success('Categoría eliminada');
      fetchCategories();
      return true;
    } catch (error) {
      toast.error('No se pudo eliminar la categoría');
      return false;
    }
  };

  return (
    <MainLayout title="Categorías">
      <CrudPage
        title="Categorías"
        entityName="Categoría"
        initialData={categories}
        columns={columns}
        searchFields={['nombre', 'descripcion']}
        schema={categorySchema}
        FormContent={CategoryForm}
        onSave={handleSave}
        onDelete={handleDelete}
        onToggle={handleToggle}
        isLoading={loading}
      />
    </MainLayout>
  );
}
