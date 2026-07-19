import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarPerfil = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const perfil = await api.get('/api/auth/perfil');
      setUsuario(perfil);
    } catch {
      setToken(null);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarPerfil(); }, [cargarPerfil]);

  async function login(email, password) {
    const data = await api.post('/api/auth/login', { email, password });
    setToken(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  async function registro(nombre, email, password) {
    const data = await api.post('/api/auth/registro', { nombre, email, password });
    setToken(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, loading, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
