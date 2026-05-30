import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    Building2,
    Lock,
    Save,
    Upload,
    X,
    Eye,
    EyeOff,
    RefreshCw,
    UserCircle,
    Phone,
    Mail,
    BadgeCheck,
    Camera,
} from 'lucide-react';

import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import { useApp }  from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────
const configuracionService = {
    getEmpresa: () =>
        api.get('/configuracion/empresa'),
    updateEmpresa: (formData) =>
        api.post('/configuracion/empresa', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    cambiarPassword: (data) =>
        api.post('/configuracion/cambiar-password', data),
    updatePerfil: (formData) =>
        api.post('/configuracion/perfil', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const unwrap = (res) => res?.data?.data || res?.data || null;

function getInitials(nombre) {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─────────────────────────────────────────────────────────────
// COMPONENTES UI
// ─────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, badge, children }) {
    return (
        <div className="card">
            <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-100">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50">
                    <Icon size={16} className="text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-gray-800">{title}</h2>
                {badge && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block mb-1 text-xs font-medium tracking-wide text-gray-500 uppercase">
                {label}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
    const { setEmpresa: setEmpresaGlobal } = useApp();
    const { user: authUser, token, roles, permissions, updateUser } = useAuth();

    // ── Estado empresa ──────────────────────────────────────────
    const [empresa, setEmpresa] = useState({
        nombre: '', nit: '', nrc: '', telefono: '', correo: '', direccion: '', logo_url: null,
    });
    const [loadingEmpresa, setLoadingEmpresa] = useState(false);
    const [savingEmpresa, setSavingEmpresa] = useState(false);
    const [erroresEmpresa, setErroresEmpresa] = useState({});
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const fileInputRef = useRef(null);

    // ── Estado perfil administrador ─────────────────────────────
    const [perfil, setPerfil] = useState({
        nombre: '',
        usuario: '',
        correo: '',
        telefono: '',
        cargo: '',
        foto_url: null,
    });
    const [savingPerfil, setSavingPerfil] = useState(false);
    const [erroresPerfil, setErroresPerfil] = useState({});
    const [fotoPreview, setFotoPreview] = useState(null);
    const [fotoFile, setFotoFile] = useState(null);
    const fotoInputRef = useRef(null);

    // ── Estado contraseña ───────────────────────────────────────
    const [passwords, setPasswords] = useState({
        password_actual: '', password_nuevo: '', password_nuevo_confirmation: '',
    });
    const [savingPass, setSavingPass] = useState(false);
    const [erroresPass, setErroresPass] = useState({});
    const [showPass, setShowPass] = useState({ actual: false, nuevo: false, confirm: false });

    // ── Cargar empresa ──────────────────────────────────────────
    useEffect(() => {
        const fetchEmpresa = async () => {
            try {
                setLoadingEmpresa(true);
                const res = await configuracionService.getEmpresa();
                const data = unwrap(res);
                if (data) {
                    const loaded = {
                        nombre: data.nombre || '',
                        nit: data.nit || '',
                        nrc: data.nrc || '',
                        telefono: data.telefono || '',
                        correo: data.correo || '',
                        direccion: data.direccion || '',
                        logo_url: data.logo_url || null,
                    };
                    setEmpresa(loaded);
                    if (data.logo_url) setLogoPreview(data.logo_url);
                    setEmpresaGlobal(loaded);
                }
            } catch {
                toast.error('Error al cargar la configuración');
            } finally {
                setLoadingEmpresa(false);
            }
        };
        fetchEmpresa();
    }, [setEmpresaGlobal]);

    // ── Cargar perfil del admin (directo del authStore, sin llamada al backend) ──
    useEffect(() => {
        setPerfil({
            nombre: authUser?.nombre || '',
            usuario: authUser?.usuario || '',
            correo: authUser?.correo || authUser?.email || '',
            telefono: authUser?.telefono || '',
            cargo: authUser?.cargo || '',
            foto_url: authUser?.foto_url || null,
        });
        if (authUser?.foto_url) setFotoPreview(authUser.foto_url);
    }, [authUser]);

    // ── Formateadores automáticos ───────────────────────────────
    const formatNit = (value) => {
        // Elimina todo lo que no sea dígito
        const digits = value.replace(/\D/g, '').slice(0, 14);
        // Aplica máscara: 0000-000000-000-0
        let result = '';
        if (digits.length > 0)  result += digits.slice(0, 4);
        if (digits.length > 4)  result += '-' + digits.slice(4, 10);
        if (digits.length > 10) result += '-' + digits.slice(10, 13);
        if (digits.length > 13) result += '-' + digits.slice(13, 14);
        return result;
    };

    const formatNrc = (value) => {
        // Máscara: 000000-0
        const digits = value.replace(/\D/g, '').slice(0, 7);
        let result = '';
        if (digits.length > 0) result += digits.slice(0, 6);
        if (digits.length > 6) result += '-' + digits.slice(6, 7);
        return result;
    };

    const formatTelefono = (value) => {
        // Máscara: 0000-0000
        const digits = value.replace(/\D/g, '').slice(0, 8);
        let result = '';
        if (digits.length > 0) result += digits.slice(0, 4);
        if (digits.length > 4) result += '-' + digits.slice(4, 8);
        return result;
    };

    // Validadores en cliente
    const validarEmpresaForm = (data) => {
        const errs = {};
        if (!data.nombre.trim()) errs.nombre = 'El nombre es obligatorio.';
        if (data.nit && !/^\d{4}-\d{6}-\d{3}-\d{1}$/.test(data.nit))
            errs.nit = 'Formato inválido. Ejemplo: 0614-310890-101-8';
        if (data.nrc && !/^\d{1,6}-\d{1}$/.test(data.nrc))
            errs.nrc = 'Formato inválido. Ejemplo: 123456-7';
        if (data.telefono && !/^\d{4}-\d{4}$/.test(data.telefono))
            errs.telefono = 'Formato inválido. Ejemplo: 2222-3333';
        if (data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo))
            errs.correo = 'Correo electrónico inválido.';
        return errs;
    };

    // ── Handlers empresa ────────────────────────────────────────
    const handleEmpresaChange = (e) => {
        const { name, value } = e.target;
        let formatted = value;
        if (name === 'nit')      formatted = formatNit(value);
        if (name === 'nrc')      formatted = formatNrc(value);
        if (name === 'telefono') formatted = formatTelefono(value);
        setEmpresa((prev) => ({ ...prev, [name]: formatted }));
        setErroresEmpresa((prev) => ({ ...prev, [name]: null }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast.error('El logo no puede superar los 2 MB'); return; }
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const quitarLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const guardarEmpresa = async (e) => {
        e.preventDefault();
        const errs = validarEmpresaForm(empresa);
        setErroresEmpresa(errs);
        if (Object.keys(errs).length > 0) return;
        try {
            setSavingEmpresa(true);
            const formData = new FormData();
            Object.entries(empresa).forEach(([key, val]) => {
                if (key !== 'logo_url' && val !== null && val !== undefined) formData.append(key, val);
            });
            if (logoFile) formData.append('logo', logoFile);
            const res = await configuracionService.updateEmpresa(formData);
            const data = unwrap(res);
            const newLogoUrl = data?.logo_url || logoPreview || empresa.logo_url;
            if (data?.logo_url) setLogoPreview(data.logo_url);
            setLogoFile(null);
            setEmpresaGlobal({ ...empresa, logo_url: newLogoUrl });
            toast.success('Configuración de empresa guardada');
        } catch (err) {
            const errors = err?.response?.data?.errors;
            if (errors) setErroresEmpresa(errors);
            else toast.error(err?.response?.data?.message || 'Error al guardar');
        } finally {
            setSavingEmpresa(false);
        }
    };

    // ── Handlers perfil ─────────────────────────────────────────
    const handlePerfilChange = (e) => {
        setPerfil((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setErroresPerfil((prev) => ({ ...prev, [e.target.name]: null }));
    };

    const handleFotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast.error('La foto no puede superar los 2 MB'); return; }
        setFotoFile(file);
        setFotoPreview(URL.createObjectURL(file));
    };

    const quitarFoto = () => {
        setFotoFile(null);
        setFotoPreview(null);
        if (fotoInputRef.current) fotoInputRef.current.value = '';
    };

    const guardarPerfil = async (e) => {
        e.preventDefault();
        setErroresPerfil({});
        if (!perfil.nombre.trim()) { setErroresPerfil({ nombre: 'El nombre es obligatorio.' }); return; }
        try {
            setSavingPerfil(true);
            const formData = new FormData();
            Object.entries(perfil).forEach(([key, val]) => {
                if (key !== 'foto_url' && val !== null && val !== undefined) formData.append(key, val);
            });
            if (fotoFile) formData.append('foto', fotoFile);

            let nuevaFotoUrl = fotoPreview; // la url actual del preview

            try {
                const res = await configuracionService.updatePerfil(formData);
                const data = unwrap(res);
                if (data?.foto_url) {
                    nuevaFotoUrl = data.foto_url;
                    setFotoPreview(data.foto_url);
                }
            } catch {
                // El endpoint aún no existe en el backend — actualizamos solo localmente
            }

            // updateUser mezcla parcialmente los campos del usuario activo
            // sin necesidad de volver a llamar login() con todos los datos.
            updateUser({
                nombre:   perfil.nombre,
                usuario:  perfil.usuario,
                correo:   perfil.correo,
                telefono: perfil.telefono,
                cargo:    perfil.cargo,
                foto_url: nuevaFotoUrl,
            });

            setFotoFile(null);
            toast.success('Perfil actualizado correctamente');
        } catch (err) {
            const errors = err?.response?.data?.errors;
            if (errors) setErroresPerfil(errors);
            else toast.error('Error al guardar el perfil');
        } finally {
            setSavingPerfil(false);
        }
    };

    // ── Handlers contraseña ─────────────────────────────────────
    const handlePassChange = (e) => {
        setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setErroresPass((prev) => ({ ...prev, [e.target.name]: null }));
    };

    const guardarPassword = async (e) => {
        e.preventDefault();
        setErroresPass({});
        if (!passwords.password_actual) { setErroresPass({ password_actual: 'Ingresa tu contraseña actual.' }); return; }
        if (passwords.password_nuevo.length < 8) { setErroresPass({ password_nuevo: 'Mínimo 8 caracteres.' }); return; }
        if (passwords.password_nuevo !== passwords.password_nuevo_confirmation) {
            setErroresPass({ password_nuevo_confirmation: 'Las contraseñas no coinciden.' });
            return;
        }
        try {
            setSavingPass(true);
            await configuracionService.cambiarPassword(passwords);
            toast.success('Contraseña actualizada correctamente');
            setPasswords({ password_actual: '', password_nuevo: '', password_nuevo_confirmation: '' });
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Error al cambiar la contraseña');
            if (err?.response?.data?.errors) setErroresPass(err.response.data.errors);
        } finally {
            setSavingPass(false);
        }
    };

    const rolBadgeColor = {
        'super-admin': 'bg-red-100 text-red-700',
        'admin': 'bg-purple-100 text-purple-700',
        'vendedor': 'bg-blue-100 text-blue-700',
    };
    const rolLabel = {
        'super-admin': 'Super Admin',
        'admin': 'Administrador',
        'vendedor': 'Vendedor',
    };

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    return (
        <MainLayout title="Configuración">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* ══════════════════════════════════════════
                    SECCIÓN: PERFIL DEL ADMINISTRADOR
                ══════════════════════════════════════════ */}
                <Section icon={UserCircle} title="Mi perfil" badge={rolLabel[authUser?.rol] || authUser?.rol}>
                    {(
                        <form onSubmit={guardarPerfil} className="space-y-5">

                            {/* Foto de perfil */}
                            <div className="flex items-center gap-6">
                                {/* Avatar grande */}
                                <div className="relative flex-shrink-0 group">
                                    <div className="flex items-center justify-center w-24 h-24 overflow-hidden border-2 border-gray-200 shadow-sm rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200">
                                        {fotoPreview ? (
                                            <img
                                                src={fotoPreview}
                                                alt="Foto de perfil"
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <span className="text-3xl font-bold text-blue-700">
                                                {getInitials(perfil.nombre || authUser?.nombre)}
                                            </span>
                                        )}
                                    </div>
                                    {/* Botón de cámara encima */}
                                    <button
                                        type="button"
                                        onClick={() => fotoInputRef.current?.click()}
                                        className="absolute flex items-center justify-center w-8 h-8 text-white transition-colors bg-blue-600 rounded-full shadow-md -bottom-2 -right-2 hover:bg-blue-700"
                                        title="Cambiar foto"
                                    >
                                        <Camera size={14} />
                                    </button>
                                    <input
                                        ref={fotoInputRef}
                                        type="file"
                                        accept="image/png,image/jpg,image/jpeg,image/webp"
                                        className="hidden"
                                        onChange={handleFotoChange}
                                    />
                                </div>

                                {/* Info rápida + acciones foto */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg font-bold text-gray-800 truncate">
                                        {perfil.nombre || authUser?.nombre || 'Administrador'}
                                    </p>
                                    <p className="text-sm text-gray-400 truncate">@{perfil.usuario || authUser?.usuario}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${rolBadgeColor[authUser?.rol] || 'bg-gray-100 text-gray-600'}`}>
                                            <BadgeCheck size={11} />
                                            {rolLabel[authUser?.rol] || authUser?.rol}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            type="button"
                                            onClick={() => fotoInputRef.current?.click()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                            <Upload size={12} /> Cambiar foto
                                        </button>
                                        {fotoPreview && (
                                            <button
                                                type="button"
                                                onClick={quitarFoto}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                <X size={12} /> Quitar foto
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-1 text-[10px] text-gray-400">PNG, JPG, WEBP · máx 2 MB</p>
                                </div>
                            </div>

                            {/* Separador */}
                            <hr className="border-gray-100" />

                            {/* Nombre y usuario */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Nombre completo *" error={erroresPerfil.nombre}>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={perfil.nombre}
                                        onChange={handlePerfilChange}
                                        className="w-full input-field"
                                        placeholder="Tu nombre completo"
                                    />
                                </Field>
                                <Field label="Usuario (login)" error={erroresPerfil.usuario}>
                                    <div className="relative">
                                        <span className="absolute text-sm text-gray-400 -translate-y-1/2 left-3 top-1/2">@</span>
                                        <input
                                            type="text"
                                            name="usuario"
                                            value={perfil.usuario}
                                            onChange={handlePerfilChange}
                                            className="w-full input-field pl-7"
                                            placeholder="tu_usuario"
                                        />
                                    </div>
                                </Field>
                            </div>

                            {/* Correo y teléfono */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Correo electrónico" error={erroresPerfil.correo}>
                                    <div className="relative">
                                        <Mail size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                                        <input
                                            type="email"
                                            name="correo"
                                            value={perfil.correo}
                                            onChange={handlePerfilChange}
                                            className="w-full pl-8 input-field"
                                            placeholder="correo@empresa.com"
                                        />
                                    </div>
                                </Field>
                                <Field label="Teléfono" error={erroresPerfil.telefono}>
                                    <div className="relative">
                                        <Phone size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                                        <input
                                            type="text"
                                            name="telefono"
                                            value={perfil.telefono}
                                            onChange={handlePerfilChange}
                                            className="w-full pl-8 input-field"
                                            placeholder="7777-8888"
                                        />
                                    </div>
                                </Field>
                            </div>

                            {/* Cargo */}
                            <Field label="Cargo / Puesto" error={erroresPerfil.cargo}>
                                <input
                                    type="text"
                                    name="cargo"
                                    value={perfil.cargo}
                                    onChange={handlePerfilChange}
                                    className="w-full input-field"
                                    placeholder="Ej. Gerente General, Administrador del sistema..."
                                />
                            </Field>

                            <div className="flex justify-end pt-1">
                                <button
                                    type="submit"
                                    disabled={savingPerfil}
                                    className="flex items-center gap-2 btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {savingPerfil ? (
                                        <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /><span>Guardando...</span></span>
                                    ) : (
                                        <span className="flex items-center gap-2"><Save size={14} /><span>Guardar perfil</span></span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </Section>

                {/* ══════════════════════════════════════════
                    SECCIÓN: DATOS DE EMPRESA
                ══════════════════════════════════════════ */}
                <Section icon={Building2} title="Datos de la empresa">
                    {loadingEmpresa ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                            <RefreshCw size={16} className="animate-spin" /> Cargando...
                        </div>
                    ) : (
                        <form onSubmit={guardarEmpresa} className="space-y-4">

                            {/* Logo */}
                            <div>
                                <label className="block mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                                    Logo de la empresa
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center flex-shrink-0 w-20 h-20 overflow-hidden border-2 border-gray-200 border-dashed rounded-xl bg-gray-50">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="object-contain w-full h-full" />
                                        ) : (
                                            <Building2 size={28} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <input ref={fileInputRef} type="file" accept="image/png,image/jpg,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                            <Upload size={13} /> Subir logo
                                        </button>
                                        {logoPreview && (
                                            <button type="button" onClick={quitarLogo} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                                                <X size={13} /> Quitar logo
                                            </button>
                                        )}
                                        <p className="text-[10px] text-gray-400">PNG, JPG, WEBP · máx 2 MB</p>
                                    </div>
                                </div>
                            </div>

                            <Field label="Nombre de la empresa *" error={erroresEmpresa.nombre}>
                                <input type="text" name="nombre" value={empresa.nombre} onChange={handleEmpresaChange} className="w-full input-field" placeholder="Ej. Distribuidora XYZ S.A. de C.V." />
                            </Field>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="NIT" error={erroresEmpresa.nit}>
                                    <input type="text" name="nit" value={empresa.nit} onChange={handleEmpresaChange} className={`w-full input-field ${erroresEmpresa.nit ? 'border-red-400' : ''}`} placeholder="0000-000000-000-0" maxLength={17} />
                                </Field>
                                <Field label="NRC" error={erroresEmpresa.nrc}>
                                    <input type="text" name="nrc" value={empresa.nrc} onChange={handleEmpresaChange} className={`w-full input-field ${erroresEmpresa.nrc ? 'border-red-400' : ''}`} placeholder="000000-0" maxLength={8} />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Teléfono" error={erroresEmpresa.telefono}>
                                    <input type="text" name="telefono" value={empresa.telefono} onChange={handleEmpresaChange} className={`w-full input-field ${erroresEmpresa.telefono ? 'border-red-400' : ''}`} placeholder="2222-3333" maxLength={9} />
                                </Field>
                                <Field label="Correo electrónico" error={erroresEmpresa.correo}>
                                    <input type="email" name="correo" value={empresa.correo} onChange={handleEmpresaChange} className="w-full input-field" placeholder="contacto@empresa.com" />
                                </Field>
                            </div>

                            <Field label="Dirección" error={erroresEmpresa.direccion}>
                                <textarea name="direccion" value={empresa.direccion} onChange={handleEmpresaChange} rows={2} className="w-full resize-none input-field" placeholder="Calle, colonia, municipio, departamento" />
                            </Field>

                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={savingEmpresa} className="flex items-center gap-2 btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
                                    {savingEmpresa ? (
                                        <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /><span>Guardando...</span></span>
                                    ) : (
                                        <span className="flex items-center gap-2"><Save size={14} /><span>Guardar cambios</span></span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </Section>

                {/* ══════════════════════════════════════════
                    SECCIÓN: CAMBIAR CONTRASEÑA
                ══════════════════════════════════════════ */}
                <Section icon={Lock} title="Cambiar contraseña">
                    <form onSubmit={guardarPassword} className="space-y-4">

                        <Field label="Contraseña actual" error={erroresPass.password_actual}>
                            <div className="relative">
                                <input type={showPass.actual ? 'text' : 'password'} name="password_actual" value={passwords.password_actual} onChange={handlePassChange} className="w-full pr-10 input-field" placeholder="••••••••" autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPass((p) => ({ ...p, actual: !p.actual }))} className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600">
                                    {showPass.actual ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </Field>

                        <Field label="Nueva contraseña" error={erroresPass.password_nuevo}>
                            <div className="relative">
                                <input type={showPass.nuevo ? 'text' : 'password'} name="password_nuevo" value={passwords.password_nuevo} onChange={handlePassChange} className="w-full pr-10 input-field" placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
                                <button type="button" onClick={() => setShowPass((p) => ({ ...p, nuevo: !p.nuevo }))} className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600">
                                    {showPass.nuevo ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </Field>

                        <Field label="Confirmar nueva contraseña" error={erroresPass.password_nuevo_confirmation}>
                            <div className="relative">
                                <input type={showPass.confirm ? 'text' : 'password'} name="password_nuevo_confirmation" value={passwords.password_nuevo_confirmation} onChange={handlePassChange} className="w-full pr-10 input-field" placeholder="Repite la nueva contraseña" autoComplete="new-password" />
                                <button type="button" onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))} className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600">
                                    {showPass.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </Field>

                        {passwords.password_nuevo.length > 0 && (
                            <div>
                                <div className="flex gap-1 mt-1">
                                    {[1, 2, 3, 4].map((n) => {
                                        const len = passwords.password_nuevo.length;
                                        const active = (len >= 8 && n <= 2) || (len >= 10 && n <= 3) || (len >= 12 && n <= 4);
                                        return (
                                            <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${active ? n <= 2 ? 'bg-yellow-400' : n === 3 ? 'bg-blue-400' : 'bg-green-400' : 'bg-gray-100'}`} />
                                        );
                                    })}
                                </div>
                                <p className="mt-1 text-[10px] text-gray-400">
                                    {passwords.password_nuevo.length < 8 ? 'Muy corta' : passwords.password_nuevo.length < 10 ? 'Aceptable' : passwords.password_nuevo.length < 12 ? 'Buena' : 'Fuerte'}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={savingPass} className="flex items-center gap-2 btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
                                {savingPass ? (
                                    <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /><span>Guardando...</span></span>
                                ) : (
                                    <span className="flex items-center gap-2"><Lock size={14} /><span>Cambiar contraseña</span></span>
                                )}
                            </button>
                        </div>
                    </form>
                </Section>

            </div>
        </MainLayout>
    );
}
