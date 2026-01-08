import React, { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './Layout/ThemeToggle';
import Sidebar from './Sidebar';
import ConfiguracionDashboard from './Configuracion/ConfiguracionDashboard';
import CompanySelector from './CompanySelector';
import CRMModule from './CRM/CRMModule';
import ProductsModule from './Products/ProductsModule';
import GeneralDashboard from '../pages/dashboard/GeneralDashboard';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleModuleChange = useCallback((moduleId) => {
    setActiveModule(moduleId);
    // Cerrar sidebar en móvil después de seleccionar
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const renderDashboardContent = () => <GeneralDashboard />;

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'clientes':
        return <CRMModule mode="customers" />;
      case 'ventas':
        return <CRMModule mode="quotations" />;
      case 'productos':
        return <ProductsModule />;
      case 'configuracion':
        return <ConfiguracionDashboard />;
      case 'dashboard':
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Navbar */}
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm lg:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                {/* Botón de menú móvil */}
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Title removed as per user request */}
              </div>

              <div className="flex items-center space-x-4">
                {/* Header elements removed as per user request */}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          {renderModuleContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
