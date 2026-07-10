import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('zaksoft_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* corrupt */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('zaksoft_token', data.access_token);
    localStorage.setItem('zaksoft_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, full_name) => {
    const { data } = await authAPI.register({ email, password, full_name });
    localStorage.setItem('zaksoft_token', data.access_token);
    localStorage.setItem('zaksoft_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('zaksoft_token');
    localStorage.removeItem('zaksoft_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
