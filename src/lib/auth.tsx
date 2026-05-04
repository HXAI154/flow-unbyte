import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const sessionString = localStorage.getItem('shopease_session');
        if (sessionString) {
          const userData = JSON.parse(sessionString);
          setUser(userData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('[v0] Error checking session:', error);
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (userData: User) => {
    try {
      setUser(userData);
      localStorage.setItem('shopease_session', JSON.stringify(userData));
      
      // Optional: Store to Supabase
      try {
        const { error } = await supabase
          .from('users')
          .upsert(userData, { onConflict: 'id' });
        
        if (error) {
          console.error('[v0] Error syncing user to Supabase:', error);
        }
      } catch (err) {
        console.error('[v0] Error in Supabase sync:', err);
      }
    } catch (error) {
      console.error('[v0] Error in login:', error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shopease_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
