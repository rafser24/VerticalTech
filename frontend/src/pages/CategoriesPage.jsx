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
  { key: 'id', label: 'ID', render: v => <span className="font-mono text-xs text-gray-400">#{v}</span> },
  { key: 'nombre', label: 'Nombre', render: v => <span className="font-medium">{v}</span> },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'productos_count', label: 'Productos', render: v => (
    <span className="badge bg-pastel-primary/30 text-blue-800">{v || 0}</span>
  )},
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar categorías desde el Backend
const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categorias');
      
      console.log("🔍 PAQUETE RECIBIDO:", response.data);

      // Vamos a pelar la cebolla/muñeca rusa capa por capa:
      let dataFinal = [];
      
      // Caso 1: Nivel 3 (Axios -> Success -> Resource)
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          dataFinal = response.data.data.data;
      } 
      // Caso 2: Nivel 2 (Axios -> Success/Resource)
      else if (response.data?.data && Array.isArray(response.data.data)) {
          dataFinal = response.data.data;
      } 
      // Caso 3: Nivel 1 (Directo de Axios)
      else if (Array.isArray(response.data)) {
          dataFinal = response.data;
      }

      console.log("✅ DATOS EXTRAÍDOS:", dataFinal);
      setCategories(dataFinal);
      
    } catch (error) {
      console.error("❌ ERROR AL TRAER DATOS:", error);
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 2. Función para Crear o Actualizar
  const handleSave = async (formData) => {
    try {
      if (formData.id) {
        // Actualizar
        await api.put(`/categorias/${formData.id}`, formData);
        toast.success('Categoría actualizada correctamente');
      } else {
        // Crear
        await api.post('/categorias', formData);
        toast.success('Categoría creada correctamente');
      }
      fetchCategories(); // Refrescar tabla
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al guardar';
      toast.error(msg);
      return false;
    }
  };

  // 3. Función para Eliminar
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
        initialData={categories} // Datos del estado (API)
        columns={columns}
        searchFields={['nombre', 'descripcion']}
        schema={categorySchema}
        FormContent={CategoryForm}
        onSave={handleSave}      // Conexión para Crear/Editar
        onDelete={handleDelete}  // Conexión para Eliminar
        isLoading={loading}      // Feedback visual de carga
      />
    </MainLayout>
  );
}