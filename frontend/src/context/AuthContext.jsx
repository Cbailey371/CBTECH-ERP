import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [selectedCompany, setSelectedCompany] = useState(JSON.parse(localStorage.getItem('company')));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await authService.verifyToken(token);
          if (response.success) {
            setUser(response.data.user);
          } else {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      if (response.success) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSelectedCompany(null);
    localStorage.removeItem('token');
    localStorage.removeItem('company');
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    localStorage.setItem('company', JSON.stringify(company));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      selectedCompany,
      login,
      logout,
      selectCompany,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};