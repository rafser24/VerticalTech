import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Truck, Users, ShoppingCart,
  TrendingUp, UserCircle, ChevronLeft, ChevronRight, Boxes,
  BarChart2,
} from 'lucide-react';
import useAppStore  from '../../store/appStore';
import useAuthStore from '../../store/authStore';

const navItems = [
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

  return (
    <aside
      className={`h-screen sticky top-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-soft
        ${sidebarOpen ? 'w-60' : 'w-16'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
        <div className="w-8 h-8 bg-pastel-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <Boxes size={18} className="text-blue-800" />
        </div>
        {sidebarOpen && (
          <span className="font-display font-bold text-gray-800 text-lg leading-tight">
            {user?.nombre ? user.nombre.split(' ')[0] + 'Tech' : 'InveSys'}
          </span>
        )}
      </div>

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
      <div className="border-t border-gray-100">
        {sidebarOpen && user && (
          <div className="px-4 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-pastel-primary flex items-center justify-center text-blue-800 font-bold text-xs flex-shrink-0">
              {user.nombre?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{user.nombre}</p>
              <p className="text-[10px] text-gray-400 truncate">@{user.usuario} · {user.rol}</p>
            </div>
          </div>
        )}

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