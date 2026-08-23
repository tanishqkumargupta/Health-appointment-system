import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('health_app_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiRequest('/auth/me', 'GET', null, token)
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', 'POST', { email, password });
    localStorage.setItem('health_app_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (name, email, phone, password, confirm_password) => {
    const data = await apiRequest('/auth/signup', 'POST', {
      name,
      email,
      phone,
      password,
      confirm_password,
    });
    localStorage.setItem('health_app_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('health_app_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
