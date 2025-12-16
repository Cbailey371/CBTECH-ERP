import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario comience a escribir
    if (error) setError('');
  }, [error]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Intentando login con:', formData.username);
      const response = await authService.login(formData);
      console.log('Respuesta del servidor:', response);

      if (response.success) {
        login(response.data.token, response.data.user);
        // Redirigir a selección de empresa en lugar del dashboard
        navigate('/select-company');
      } else {
        setError(response.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }, [formData, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4 relative overflow-hidden">
      {/* Botón de cambio de tema */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-2xl shadow-xl p-10 w-full max-w-md relative z-10 animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            CBTECH-ERP
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Ingresa a tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fadeIn">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-wide">
              Usuario o Email
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 focus:-translate-y-0.5 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Ingresa tu usuario o email"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-wide">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 focus:-translate-y-0.5 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Ingresa tu contraseña"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={`w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 relative overflow-hidden mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-lg active:translate-y-0'
              } focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2`}
            disabled={loading}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <span className={loading ? 'invisible' : ''}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;