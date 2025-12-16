import React, { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import Sidebar from './Sidebar';
import ConfiguracionDashboard from './Configuracion/ConfiguracionDashboard';
import CompanySelector from './CompanySelector';
import CRMModule from './CRM/CRMModule';
import ProductsModule from './Products/ProductsModule';

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

  const renderDashboardContent = () => (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Panel de Control
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Gestiona todos los módulos de tu empresa desde aquí
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Ventas del Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$45,250</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-green-500 text-sm">↗ +12.5%</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">vs mes anterior</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Productos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,246</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400 text-xl">📦</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-blue-500 text-sm">↗ +8.2%</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">nuevos productos</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Clientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">342</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <span className="text-purple-600 dark:text-purple-400 text-xl">👥</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-purple-500 text-sm">↗ +3.1%</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">clientes activos</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Órdenes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">89</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <span className="text-orange-600 dark:text-orange-400 text-xl">📋</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-orange-500 text-sm">↗ +5.7%</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">pendientes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          onClick={() => handleModuleChange('ventas')}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="text-center">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors duration-200">
              <span className="text-primary-600 dark:text-primary-400 text-2xl">💼</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ventas</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Gestiona cotizaciones, pedidos y facturación
            </p>
          </div>
        </div>

        <div
          onClick={() => handleModuleChange('productos')}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="text-center">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors duration-200">
              <span className="text-primary-600 dark:text-primary-400 text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Productos</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Catálogo de productos y servicios
            </p>
          </div>
        </div>

        <div
          onClick={() => handleModuleChange('clientes')}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="text-center">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors duration-200">
              <span className="text-primary-600 dark:text-primary-400 text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Clientes</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Administra clientes y proveedores
            </p>
          </div>
        </div>

        <div
          onClick={() => handleModuleChange('reportes')}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="text-center">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors duration-200">
              <span className="text-primary-600 dark:text-primary-400 text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reportes</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Análisis y reportes de la empresa
            </p>
          </div>
        </div>

        <div
          onClick={() => handleModuleChange('contabilidad')}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="text-center">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors duration-200">
              <span className="text-primary-600 dark:text-primary-400 text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contabilidad</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Estados financieros y contabilidad
            </p>
          </div>
        </div>

        <div
          onClick={() => handleModuleChange('configuracion')}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="text-center">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors duration-200">
              <span className="text-primary-600 dark:text-primary-400 text-2xl">⚙️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Configuración</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Configuración del sistema y usuarios
            </p>
          </div>
        </div>
      </div>
    </div>
  );

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
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
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

                <h1 className="text-xl font-bold text-gray-800 dark:text-white bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  CBTECH-ERP
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                {/* Selector de Empresa */}
                <CompanySelector />

                <span className="text-gray-600 dark:text-gray-300">
                  Bienvenido, <span className="font-medium">{user?.email}</span>
                </span>
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Cerrar Sesión
                </button>
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
