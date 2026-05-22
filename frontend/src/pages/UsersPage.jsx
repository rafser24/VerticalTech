import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { Plus, Pencil, Trash2, ShieldCheck, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FormField, FormInput, FormSelect } from '../components/ui/FormFields';
import { userService } from '../services/api';
import useAuthStore from '../store/authStore';
import { formatDate } from '../utils/helpers';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const createUserSchema = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres').max(100),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  usuario:  z.string().min(3, 'Mínimo 3 caracteres').max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  correo:   z.string().email('Correo inválido').optional().or(z.literal('')),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  password_confirmation: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum(['admin', 'vendedor', 'tecnico', 'bodeguero'], {
    required_error: 'Seleccione un rol',
  }),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirmation'],
});

const editUserSchema = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres').max(100),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  usuario:  z.string().min(3, 'Mínimo 3 caracteres').max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  correo:   z.string().email('Correo inválido').optional().or(z.literal('')),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  password_confirmation: z.string().optional().or(z.literal('')),
  rol: z.enum(['admin', 'vendedor', 'tecnico', 'bodeguero'], {
    required_error: 'Seleccione un rol',
  }),
  activo: z.coerce.boolean().default(true),
}).refine(d => !d.password || d.password === d.password_confirmation, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirmation'],
});

// ─── Helpers visuales ─────────────────────────────────────────────────────────
const rolBadgeColors = {
  'super-admin': 'bg-red-100 text-red-800',
  admin:         'bg-pastel-purple text-purple-800',
  vendedor:      'bg-pastel-primary text-blue-800',
  tecnico:       'bg-yellow-100 text-yellow-800',
  bodeguero:     'bg-pastel-secondary text-green-800',
};
const rolLabels = {
  'super-admin': 'Super Admin',
  admin:         'Administrador',
  vendedor:      'Vendedor',
  tecnico:       'Técnico',
  bodeguero:     'Bodeguero',
};

// ─── Formulario ───────────────────────────────────────────────────────────────
function UserForm({ register, errors, editing }) {
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre" required error={errors.nombre?.message}>
          <FormInput register={register('nombre')} placeholder="Ej. Juan" error={errors.nombre} />
        </FormField>
        <FormField label="Apellido" required error={errors.apellido?.message}>
          <FormInput register={register('apellido')} placeholder="Ej. Pérez" error={errors.apellido} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Usuario (login)" required error={errors.usuario?.message}>
          <FormInput register={register('usuario')} placeholder="juan_v" error={errors.usuario} />
        </FormField>
        <FormField label="Correo electrónico (opcional)" error={errors.correo?.message}>
          <FormInput register={register('correo')} type="email" placeholder="contacto@tienda.com" error={errors.correo} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={editing ? 'Nueva contraseña (vacío = sin cambios)' : 'Contraseña'}
          required={!editing}
          error={errors.password?.message}
        >
          <div className="relative">
            <FormInput
              register={register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </FormField>
        <FormField label="Confirmar contraseña" required={!editing} error={errors.password_confirmation?.message}>
          <div className="relative">
            <FormInput
              register={register('password_confirmation')}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repita la contraseña"
              error={errors.password_confirmation}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </FormField>
      </div>
      <FormField label="Rol del sistema" required error={errors.rol?.message}>
        <FormSelect register={register('rol')} error={errors.rol}>
          <option value="">Seleccionar rol...</option>
          <option value="admin">Administrador</option>
          <option value="vendedor">Vendedor</option>
          <option value="tecnico">Técnico</option>
          <option value="bodeguero">Bodeguero</option>
        </FormSelect>
      </FormField>
      {editing && (
        <FormField label="Estado" error={errors.activo?.message}>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('activo')}
              id="activo"
              className="w-4 h-4 rounded accent-blue-400"
            />
            <label htmlFor="activo" className="text-sm text-gray-700">
              Usuario activo
            </label>
          </div>
        </FormField>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const schema = editing ? editUserSchema : createUserSchema;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });
  const currentUser = useAuthStore((s) => s.user);

  // ── Carga ──────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res     = await userService.getAll();
      const payload = res.data?.data ?? res.data;
      const list    = Array.isArray(payload) ? payload : payload?.data ?? [];
      // Activos arriba, inactivos abajo
      const sorted  = [...list].sort((a, b) => (b.activo ? 1 : 0) - (a.activo ? 1 : 0));
      setUsers(sorted);
    } catch {
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchUsers(); }, []);

  // ── Toggle activo/inactivo ─────────────────────────────────────────
  const handleToggle = async (row) => {
    const id = row.id ?? row.id_usuario;
    if (!id) { toast.error('ID de usuario no encontrado'); return; }
    try {
      await userService.toggle(id);
      toast.success(`Usuario ${row.activo ? 'desactivado' : 'activado'} correctamente`);
      await fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cambiar el estado';
      toast.error(msg);
    }
  };

  // ── Abrir modal ────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    reset({ nombre: '', apellido: '', usuario: '', correo: '', password: '', password_confirmation: '', rol: '' });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    reset({
      nombre:                user.nombre,
      apellido:              user.apellido ?? '',
      usuario:               user.usuario,
      correo:                user.correo || '',
      rol:                   user.rol,
      activo:                Boolean(user.activo),
      password:              '',
      password_confirmation: '',
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); reset(); setEditing(null); };

  // ── Guardar ────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const id      = editing?.id ?? editing?.id_usuario;
    const payload = { ...data };
    if (editing && !payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }
    try {
      if (editing) {
        if (!id) throw new Error('ID de usuario inválido');
        await userService.update(id, payload);
        toast.success('Usuario actualizado correctamente');
      } else {
        await userService.create(payload);
        toast.success('Usuario creado exitosamente');
      }
      await fetchUsers();
      closeModal();
    } catch (error) {
      const msg = error.response?.data?.message
        || error.response?.data?.errors?.usuario?.[0]
        || error.message
        || 'Error al guardar el usuario';
      toast.error(msg);
    }
  };

  // ── Eliminar ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    const id = deleteTarget?.id ?? deleteTarget?.id_usuario;
    try {
      await userService.remove(id);
      setUsers(prev => prev.filter(u => (u.id ?? u.id_usuario) !== id));
      toast.success('Usuario eliminado');
    } catch {
      toast.error('Error al eliminar el usuario');
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Columnas ───────────────────────────────────────────────────────
  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-blue-800 rounded-full bg-pastel-primary shrink-0">
            {v?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-gray-800">{v}</p>
            <p className="text-xs text-gray-400">@{row.usuario}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'correo',
      label: 'Correo',
      render: v => <span className="text-sm text-gray-600">{v || '—'}</span>,
    },
    {
      key: 'roles',
      label: 'Rol',
      render: (v, row) => {
        const rol = v?.[0] ?? row.rol ?? null;
        return (
          <span className={`badge ${rolBadgeColors[rol] || 'bg-gray-100 text-gray-600'}`}>
            {rolLabels[rol] || rol || '—'}
          </span>
        );
      },
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
      ),
    },
    {
      key: 'created_at',
      label: 'Creado',
      render: v => <span className="text-xs text-gray-400">{formatDate(v)}</span>,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <MainLayout title="Usuarios">
      <div className="flex items-center gap-2 p-3 mb-4 text-sm text-purple-800 border border-purple-200 bg-pastel-purple/30 rounded-xl">
        <ShieldCheck size={16} className="shrink-0" />
        Sección exclusiva para administradores. Gestiona el acceso al sistema.
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando...' : `${users.length} usuarios registrados`}
          </p>
          <button onClick={openCreate} className="flex items-center gap-2 btn-primary">
            <Plus size={16} /> Nuevo Usuario
          </button>
        </div>
        <div className="card">
          <DataTable
            data={users}
            columns={columns}
            searchFields={['nombre', 'usuario', 'correo', 'rol']}
            actions={(row) => {
              const esMiUsuario = (row.id ?? row.id_usuario) === (currentUser?.id ?? currentUser?.id_usuario);
              return (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(row)}
                    className="p-1.5 hover:bg-pastel-primary/20 rounded-lg transition-colors text-blue-600"
                    title="Editar usuario"
                  >
                    <Pencil size={14} />
                  </button>
                  {!esMiUsuario && (
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
                  )}
                  {esMiUsuario ? (
                    <span
                      title="No puedes eliminar tu propio usuario"
                      className="p-1.5 text-gray-300 cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeleteTarget(row)}
                      className="p-1.5 hover:bg-pastel-accent/30 rounded-lg transition-colors text-red-500"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Modal crear / editar */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <UserForm register={register} errors={errors} editing={editing} />
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={closeModal} className="border border-gray-200 btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar usuario?"
        message={`Se eliminará a "${deleteTarget?.nombre}" permanentemente. Esta acción no se puede deshacer.`}
      />
    </MainLayout>
  );
}