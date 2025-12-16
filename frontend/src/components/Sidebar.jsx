import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  Truck,
  Building2,
  Calculator,
  ClipboardList,
  UserCheck,
  Building,
  UserCog,
  BarChart
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import logo from '../assets/logo.png';
import { ThemeToggle } from './Layout/ThemeToggle';

export default function Sidebar() {
  const location = useLocation();
  const { logout, selectedCompany } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    {
      icon: ShoppingCart, label: 'Ventas', path: '/quotations', submenu: [
        { icon: FileText, label: 'Cotizaciones', path: '/quotations' },
        { icon: Users, label: 'Clientes', path: '/customers' },
        { icon: ClipboardList, label: 'Contratos', path: '/contracts' }
      ]
    },
    {
      icon: Truck, label: 'Compras', path: '/purchase-orders', submenu: [
        { icon: ShoppingCart, label: 'Ordenes de Compra', path: '/purchase-orders' },
        { icon: Truck, label: 'Proveedores', path: '/suppliers' },
      ]
    },
    { icon: Briefcase, label: 'Proyectos', path: '/projects' },
    { icon: Package, label: 'Productos', path: '/products' },
    { icon: BarChart, label: 'Reportes', path: '/reports' },
    {
      icon: Building2, label: 'Administración', path: '/admin/companies', submenu: [
        { icon: Building, label: 'Empresas', path: '/admin/companies' },
        { icon: UserCog, label: 'Usuarios', path: '/admin/users' }
      ]
    }
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');


  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg text-primary border border-border shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
                fixed top-0 left-0 h-full w-64 bg-card border-r border-border transition-transform duration-300 z-50 flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
        <div className="p-6 border-b border-border flex flex-col items-center gap-4">
          <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />

          {selectedCompany && (
            <div className="w-full bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-md">
                <Building2 size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Empresa Actual</p>
                <p className="text-sm font-bold text-foreground truncate" title={selectedCompany.name}>
                  {selectedCompany.name}
                </p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.submenu ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-3 text-muted-foreground font-medium">
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </div>
                  <div className="pl-4 space-y-1">
                    {item.submenu.map((sub, subIndex) => (
                      <Link
                        key={subIndex}
                        to={sub.path}
                        onClick={handleLinkClick}
                        className={`
                                                    flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors
                                                    ${isActive(sub.path)
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                                                `}
                      >
                        {sub.icon && <sub.icon size={18} />}
                        <span>{sub.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`
                                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium
                                        ${isActive(item.path)
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                                    `}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );

}
