import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authAPI.me();
        setUser(data.user);
      } catch {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  function saveSession(data) {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function login(payload) {
    const { data } = await authAPI.login(payload);
    saveSession(data);
    return data.user;
  }

  async function signup(payload) {
    const { data } = await authAPI.signup(payload);
    saveSession(data);
    return data.user;
  }

  async function googleLogin(credential) {
    const { data } = await authAPI.google(credential);
    if (data.requireOtp) {
      return { requireOtp: true, email: data.email };
    }
    saveSession(data);
    return data.user;
  }

  async function verifyOtp({ email, otp }) {
    const { data } = await authAPI.verifyOtp({ email, otp });
    saveSession(data);
    return data.user;
  }

  async function resendOtp(email) {
    const { data } = await authAPI.resendOtp({ email });
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        googleLogin,
        verifyOtp,
        resendOtp,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
