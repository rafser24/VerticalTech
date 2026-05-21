import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Truck, Users, ShoppingCart,
<<<<<<< Updated upstream
  TrendingUp, UserCircle, ChevronLeft, ChevronRight, Boxes,
  BarChart2,
=======
  TrendingUp, UserCircle, ChevronLeft, ChevronRight, Boxes, BarChart2, Settings,
>>>>>>> Stashed changes
} from 'lucide-react';
import useAppStore from '../../store/appStore';
import useAuthStore from '../../store/authStore';

const navItems = [
<<<<<<< Updated upstream
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/productos',  label: 'Productos',   icon: Package },
  { to: '/categorias', label: 'Categorías',  icon: Tag },
  { to: '/proveedores',label: 'Proveedores', icon: Truck },
  { to: '/clientes',   label: 'Clientes',    icon: Users },
  { to: '/compras',    label: 'Compras',     icon: ShoppingCart },
  { to: '/ventas',     label: 'Ventas',      icon: TrendingUp },
  { to: '/usuarios',   label: 'Usuarios',    icon: UserCircle, adminOnly: true },
  { to: '/reportes',   label: 'Reportes',    icon: BarChart2,  adminOnly: true },
];

export default function Sidebar() {
  // 1. Extraemos los estados individualmente para evitar renders innecesarios
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  // 2. Extraemos el usuario individualmente
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  // 3. Evaluamos la función. 
  // NOTA: Asegúrate de que isAdmin() en tu store NO haga ningún set(), 
  // solo debe retornar true o false (ej: return get().user?.rol === 'admin')
  const userIsAdmin = isAdmin ? isAdmin() : false;
=======
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super-admin', 'admin', 'vendedor'] },
  { to: '/productos', label: 'Productos', icon: Package, roles: ['super-admin', 'admin', 'vendedor'] },
  { to: '/categorias', label: 'Categorías', icon: Tag, roles: ['super-admin', 'admin'] },
  { to: '/proveedores', label: 'Proveedores', icon: Truck, roles: ['super-admin', 'admin'] },
  { to: '/clientes', label: 'Clientes', icon: Users, roles: ['super-admin', 'admin', 'vendedor'] },
  { to: '/compras', label: 'Compras', icon: ShoppingCart, roles: ['super-admin', 'admin'] },
  { to: '/ventas', label: 'Ventas', icon: TrendingUp, roles: ['super-admin', 'admin', 'vendedor'] },
  { to: '/usuarios', label: 'Usuarios', icon: UserCircle, roles: ['super-admin', 'admin'] },
  { to: '/reportes', label: 'Reportes', icon: BarChart2, roles: ['super-admin', 'admin'] },
  { to: '/configuracion', label: 'Configuración', icon: Settings, roles: ['super-admin', 'admin'] },
];

const rolBadge = {
  'super-admin': { bg: 'bg-red-100', text: 'text-red-700', label: 'Super Admin' },
  'admin': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' },
  'vendedor': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Vendedor' },
  'tecnico': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Técnico' },
  'bodeguero': { bg: 'bg-green-100', text: 'text-green-700', label: 'Bodeguero' },
};

// ── Avatar pequeño reutilizable ──────────────────────────────
function Avatar({ foto, nombre, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
  const letra = nombre?.charAt(0)?.toUpperCase() || '?';

  if (foto) {
    return (
      <img
        src={foto}
        alt={nombre}
        className={`${dim} rounded-full object-cover flex-shrink-0 border border-gray-200`}
      />
    );
  }
  return (
    <div className={`${dim} flex items-center justify-center font-bold text-blue-800 rounded-full bg-pastel-primary flex-shrink-0`}>
      {letra}
    </div>
  );
}

export default function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const empresa = useAppStore((s) => s.empresa);   // ← logo + nombre empresa

  const user = useAuthStore((s) => s.user);           // ← foto_url + nombre usuario
  const hasRole = useAuthStore((s) => s.hasRole);

  const rolActual = user?.rol ?? '';
  const menuVisible = navItems.filter(item => item.roles.some(r => hasRole(r)));
  const badge = rolBadge[rolActual] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: rolActual };
>>>>>>> Stashed changes

  return (
    <aside
      className={`h-screen sticky top-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-soft
        ${sidebarOpen ? 'w-60' : 'w-16'}`}
    >
      {/* ── Logo empresa ── */}
      <div className="flex items-center h-16 gap-3 px-4 border-b border-gray-100">
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 overflow-hidden bg-pastel-primary rounded-xl">
          {empresa.logo_url ? (
            <img
              src={empresa.logo_url}
              alt={empresa.nombre}
              className="object-cover w-full h-full"
            />
          ) : (
            <Boxes size={18} className="text-blue-800" />
          )}
        </div>
        {sidebarOpen && (
<<<<<<< Updated upstream
          <span className="font-display font-bold text-gray-800 text-lg leading-tight">
            {user?.nombre ? user.nombre.split(' ')[0] + 'Tech' : 'InveSys'}
=======
          <span className="text-lg font-bold leading-tight text-gray-800 truncate font-display">
            {empresa.nombre || 'VerticalTech'}
>>>>>>> Stashed changes
          </span>
        )}
      </div>

<<<<<<< Updated upstream
      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems
          .filter(item => !item.adminOnly || userIsAdmin)
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`
              }
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
      </nav>

      {/* Info del usuario + Toggle */}
=======
      {/* ── Navegación ── */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {menuVisible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`
            }
            title={!sidebarOpen ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* ── Info usuario ── */}
>>>>>>> Stashed changes
      <div className="border-t border-gray-100">

        {/* Sidebar abierto */}
        {sidebarOpen && user && (
<<<<<<< Updated upstream
          <div className="px-4 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-pastel-primary flex items-center justify-center text-blue-800 font-bold text-xs flex-shrink-0">
              {user.nombre?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{user.nombre}</p>
              <p className="text-[10px] text-gray-400 truncate">@{user.usuario} · {user.rol}</p>
=======
          <div className="flex items-center gap-2 px-4 py-3">
            {/* Foto o inicial */}
            <Avatar foto={user.foto_url} nombre={user.nombre} size="md" />

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{user.nombre}</p>
              <p className="text-[10px] text-gray-400 truncate">@{user.usuario}</p>
              <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
>>>>>>> Stashed changes
            </div>
          </div>
        )}

<<<<<<< Updated upstream
=======
        {/* Sidebar colapsado */}
        {!sidebarOpen && user && (
          <div className="flex justify-center py-2">
            <Avatar foto={user.foto_url} nombre={user.nombre} size="sm" />
          </div>
        )}

>>>>>>> Stashed changes
        {/* Botón colapsar */}
        <div className="p-3">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-sm
              ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            {sidebarOpen && <span>Colapsar</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}