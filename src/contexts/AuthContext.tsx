
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/services/database';

// Enhanced auth context with error handling
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isSessionExpired: boolean;
  connectionStatus: 'online' | 'offline' | 'reconnecting';
  signOut: () => Promise<void>;
  clearError: () => void;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'reconnecting'>('online');
  const navigate = useNavigate();
  
  // Clear error function
  const clearError = () => setError(null);
  
  // Enhanced session validation
  const checkSession = async (): Promise<boolean> => {
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Session check error:', sessionError);
        setError('Erro ao verificar sessão');
        return false;
      }
      
      if (!currentSession) {
        setIsSessionExpired(true);
        return false;
      }
      
      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (currentSession.expires_at && currentSession.expires_at < now) {
        console.log('Session expired, attempting refresh...');
        setIsSessionExpired(true);
        
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('Session refresh failed:', refreshError);
          setError('Sessão expirada. Faça login novamente.');
          return false;
        }
        
        console.log('Session refreshed successfully');
        setIsSessionExpired(false);
        return true;
      }
      
      setIsSessionExpired(false);
      return true;
    } catch (error) {
      console.error('Session check failed:', error);
      setError('Erro de conexão. Verifique sua internet.');
      setConnectionStatus('offline');
      return false;
    }
  };

  useEffect(() => {
    console.log('AuthProvider: Initializing authentication...');
    
    // Enhanced session initialization with better error handling
    const getInitialSession = async () => {
      try {
        setConnectionStatus('online');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting initial session:', error);
          setError('Erro ao inicializar sessão');
          
          // Check if it's a network error
          if (error.message?.includes('fetch') || error.name === 'NetworkError') {
            setConnectionStatus('offline');
            setError('Sem conexão com o servidor');
          }
        } else {
          console.log('AuthProvider: Initial session:', initialSession?.user?.email || 'No session');
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setError(null);
          
          // Validate session if present
          if (initialSession?.user) {
            const sessionValid = await checkSession();
            if (!sessionValid) {
              console.warn('Initial session is invalid or expired');
              setSession(null);
              setUser(null);
            } else {
              setTimeout(() => {
                logActivity('auth', 'Session restored', {
                  user_email: initialSession.user.email,
                  session_id: initialSession.access_token?.slice(-8)
                });
              }, 1000);
            }
          }
        }
      } catch (error: any) {
        console.error('AuthProvider: Unexpected error during session initialization:', error);
        setError('Erro inesperado durante inicialização');
        setConnectionStatus('offline');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Enhanced auth state listener with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed:', event, session?.user?.email || 'No user');
      
      // Clear previous errors on successful auth events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setError(null);
        setConnectionStatus('online');
        setIsSessionExpired(false);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Enhanced authentication event logging
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            logActivity('auth', 'User signed in', {
              user_email: session.user.email,
              session_id: session.access_token?.slice(-8),
              sign_in_method: session.user.app_metadata?.provider || 'email',
              timestamp: new Date().toISOString()
            });
          }, 1000);
        } else if (event === 'SIGNED_OUT') {
          setIsSessionExpired(false);
          setError(null);
          setTimeout(() => {
            logActivity('auth', 'User signed out', {
              event_timestamp: new Date().toISOString()
            });
          }, 100);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed successfully');
          setIsSessionExpired(false);
          setTimeout(() => {
            logActivity('auth', 'Token refreshed', {
              user_email: session.user.email,
              session_id: session.access_token?.slice(-8),
              timestamp: new Date().toISOString()
            });
          }, 1000);
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery initiated');
        }
      } catch (error) {
        console.error('Error logging auth event:', error);
      }
    });
    
    // Set up periodic session validation
    const sessionCheckInterval = setInterval(async () => {
      if (session && user) {
        const isValid = await checkSession();
        if (!isValid) {
          console.warn('Session validation failed, user will be signed out');
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Network status monitoring
    const handleOnline = () => {
      console.log('Network back online');
      setConnectionStatus('online');
      setError(null);
      // Recheck session when back online
      if (session) {
        checkSession();
      }
    };
    
    const handleOffline = () => {
      console.log('Network went offline');
      setConnectionStatus('offline');
      setError('Conexão perdida. Reconectando...');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      console.log('AuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const signOut = async () => {
    console.log('AuthProvider: Signing out user...');
    
    try {
      // Log sign out attempt
      if (user) {
        await logActivity('auth', 'Sign out initiated', {
          user_email: user.email,
          timestamp: new Date().toISOString()
        });
      }

      // Clear auth state first
      const cleanupAuthState = () => {
        // Remove standard auth tokens
        localStorage.removeItem('supabase.auth.token');
        
        // Remove all Supabase auth keys from localStorage
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        
        // Remove from sessionStorage if in use
        Object.keys(sessionStorage || {}).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      };

      // Clear local state immediately
      setUser(null);
      setSession(null);
      setError(null);
      setIsSessionExpired(false);
      
      cleanupAuthState();

      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('AuthProvider: Error during sign out:', error);
        // Don't show error to user as cleanup already happened
      }

      // Navigate to login page
      navigate('/login', { replace: true });
      
    } catch (error) {
      console.error('AuthProvider: Unexpected error during sign out:', error);
      // Clear state and navigate even on error
      setUser(null);
      setSession(null);
      setError(null);
      navigate('/login', { replace: true });
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    isSessionExpired,
    connectionStatus,
    signOut,
    clearError,
    checkSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
