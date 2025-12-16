import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import GestionUsuarios from './Usuarios/GestionUsuarios';
import RolesDashboard from './Roles/RolesDashboard';
import GestionEmpresas from '../GestionEmpresas';
import UserCompanyManager from '../UserCompany/UserCompanyManager';
import ServidorSMTP from './ServidorSMTP';

const ConfiguracionDashboard = () => {
  const { isDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('usuarios');
  const [selectedSection, setSelectedSection] = useState(null);

  const categories = [
    {
      id: 'usuarios',
      name: 'Usuarios y Roles',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      description: 'Gestión de usuarios, roles y permisos del sistema',
      sections: ['Usuarios', 'Roles', 'Accesos Usuario-Empresa']
    },
    {
      id: 'empresa',
      name: 'Empresa',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      description: 'Información y configuración de la empresa',
      sections: ['Empresas']
    },
    {
      id: 'correo',
      name: 'Correo Electrónico',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Configuración de servidor SMTP',
      sections: ['Servidor SMTP']
    }
  ];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    
    // Si es la categoría "empresa" que solo tiene una sección, ir directamente a ella
    if (categoryId === 'empresa') {
      setSelectedSection('Empresas');
      console.log(`Navegando directamente a: Gestión de Empresas`);
    } 
    // Si es la categoría "correo" que solo tiene una sección, ir directamente a ella
    else if (categoryId === 'correo') {
      setSelectedSection('Servidor SMTP');
      console.log(`Navegando directamente a: Servidor SMTP`);
    } else {
      setSelectedSection(null); // Reset section when changing category
      console.log(`Navegando a configuración: ${categoryId}`);
    }
  };

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    console.log(`Abriendo sección: ${section}`);
  };

  const renderCategoryContent = () => {
    const category = categories.find(cat => cat.id === selectedCategory);
    
    // Si hay una sección específica seleccionada, renderizar ese componente
    if (selectedSection) {
      switch (selectedSection) {
        case 'Usuarios':
          return <GestionUsuarios />;
        case 'Roles':
          return <RolesDashboard />;
        case 'Empresas':
          return <GestionEmpresas />;
        case 'Accesos Usuario-Empresa':
          return <UserCompanyManager />;
        case 'Servidor SMTP':
          return <ServidorSMTP />;
        default:
          return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {selectedSection}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Componente en desarrollo para {selectedSection}...
              </p>
              <button
                onClick={() => setSelectedSection(null)}
                className="mt-4 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
              >
                ← Volver a {category.name}
              </button>
            </div>
          );
      }
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-primary-600 dark:text-primary-400">
              {category.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {category.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {category.description}
              </p>
            </div>
          </div>
        </div>

        {/* Secciones de la categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {category.sections.map((section, index) => (
            <button
              key={index}
              onClick={() => handleSectionSelect(section)}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors duration-200 text-left group"
            >
              <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400">
                {section}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Configurar
                </span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configuración del Sistema
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administra todas las configuraciones del ERP
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Categorías de Configuración
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left group
                ${selectedCategory === category.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }
              `}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${selectedCategory === category.id
                    ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-800/50 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                  }
                `}>
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-medium text-sm">{category.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {category.sections.length} secciones
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {renderCategoryContent()}
    </div>
  );
};

export default ConfiguracionDashboard;