import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import DataTable from './DataTable';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

export default function CrudPage({
  title,
  entityName,
  initialData = [],
  columns,
  searchFields,
  schema,
  FormContent,
  canCreate = true,
  modalSize = 'md',
  onSave,
  onDelete,
  onToggle,       // ← NUEVA PROP: función para activar/desactivar
  isLoading
}) {
  const [items, setItems]             = useState(initialData);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setItems(initialData || []);
  }, [initialData]);

  const openCreate = () => {
    setEditing(null);
    reset({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    reset(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    reset();
  };

  const onSubmit = async (data) => {
    if (onSave) {
      const success = await onSave({ ...data, id: editing?.id });
      if (success) {
        closeModal();
      }
    } else {
      if (editing) {
        setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...data } : i));
        toast.success(`${entityName} actualizado exitosamente`);
      } else {
        setItems(prev => [...prev, { ...data, id: Date.now() }]);
        toast.success(`${entityName} creado exitosamente`);
      }
      closeModal();
    }
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      const success = await onDelete(deleteTarget);
      if (success) {
        setDeleteTarget(null);
      }
    } else {
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      toast.success(`${entityName} eliminado`);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isLoading ? 'Cargando...' : `${items.length} registros`}
        </p>
        {canCreate && (
          <button onClick={openCreate} className="flex items-center gap-2 btn-primary">
            <Plus size={16} /> Nuevo {entityName}
          </button>
        )}
      </div>

      <div className="card">
        <DataTable
          data={items}
          columns={columns}
          searchFields={searchFields}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEdit(row)}
                className="p-1.5 hover:bg-pastel-primary/20 rounded-lg transition-colors text-blue-600"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
              {onToggle && (
                <button
                  onClick={() => onToggle(row)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    row.activo
                      ? 'hover:bg-orange-100 text-orange-500'
                      : 'hover:bg-green-100 text-green-600'
                  }`}
                  title={row.activo ? 'Desactivar' : 'Activar'}
                >
                  {row.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
              )}
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

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? `Editar ${entityName}` : `Nuevo ${entityName}`}
        size={modalSize}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormContent
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            editing={editing}
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={closeModal} className="border border-gray-200 btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {editing ? 'Guardar cambios' : `Crear ${entityName}`}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`¿Eliminar ${entityName}?`}
        message="Esta acción no se puede deshacer."
      />
    </div>
  );
}
