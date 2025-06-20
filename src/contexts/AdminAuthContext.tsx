
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  role: 'admin' | 'staff';
  staff_id?: string;
  permissions: any;
}

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
  isSessionExpired: boolean;
  connectionStatus: 'online' | 'offline' | 'reconnecting';
  isAdmin: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
  clearError: () => void;
  checkSession: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'reconnecting'>('online');
  const navigate = useNavigate();
  
  const clearError = () => setError(null);
  
  const checkSession = async (): Promise<boolean> => {
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Admin session check error:', sessionError);
        setError('Erro ao verificar sessão administrativa');
        return false;
      }
      
      if (!currentSession) {
        setIsSessionExpired(true);
        return false;
      }
      
      const now = Math.floor(Date.now() / 1000);
      if (currentSession.expires_at && currentSession.expires_at < now) {
        console.log('Admin session expired, attempting refresh...');
        setIsSessionExpired(true);
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('Admin session refresh failed:', refreshError);
          setError('Sessão administrativa expirada. Faça login novamente.');
          return false;
        }
        
        setIsSessionExpired(false);
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Admin session check failed:', error);
      setError('Erro de conexão administrativa');
      setConnectionStatus('offline');
      return false;
    }
  };

  const fetchAdminUser = async (userId: string): Promise<AdminUser | null> => {
    console.log('Fetching admin user for:', userId);
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, role, staff_id, permissions')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching admin user:', error);
        setError('Erro ao carregar dados administrativos');
        
        // Check if it's a network error
        if (error.message?.includes('fetch') || error.code === 'PGRST301') {
          setConnectionStatus('offline');
        }
        return null;
      }

      if (data) {
        setError(null);
        setConnectionStatus('online');
      }

      console.log('Admin user data:', data);
      return data as AdminUser | null;
    } catch (error) {
      console.error('Unexpected error fetching admin user:', error);
      setError('Erro inesperado ao carregar dados administrativos');
      setConnectionStatus('offline');
      return null;
    }
  };

  useEffect(() => {
    console.log('AdminAuthProvider: Initializing authentication...');
    
    // Enhanced admin session initialization
    const getInitialSession = async () => {
      try {
        setConnectionStatus('online');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AdminAuthProvider: Error getting initial session:', error);
          setError('Erro ao inicializar sessão administrativa');
          
          if (error.message?.includes('fetch') || error.name === 'NetworkError') {
            setConnectionStatus('offline');
          }
        } else {
          console.log('AdminAuthProvider: Initial session:', initialSession?.user?.email || 'No session');
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            // Validate session first
            const sessionValid = await checkSession();
            if (sessionValid) {
              const adminData = await fetchAdminUser(initialSession.user.id);
              setAdminUser(adminData);
              
              if (!adminData) {
                setError('Usuário não possui permissões administrativas');
              }
            } else {
              setSession(null);
              setUser(null);
            }
          }
        }
      } catch (error: any) {
        console.error('AdminAuthProvider: Unexpected error during session initialization:', error);
        setError('Erro inesperado durante inicialização administrativa');
        setConnectionStatus('offline');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Enhanced admin auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AdminAuthProvider: Auth state changed:', event, session?.user?.email || 'No user');
      
      // Clear errors on successful auth events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setError(null);
        setConnectionStatus('online');
        setIsSessionExpired(false);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer admin user fetching to prevent potential deadlocks
        setTimeout(async () => {
          const adminData = await fetchAdminUser(session.user.id);
          setAdminUser(adminData);
        }, 100);
      } else {
        setAdminUser(null);
        if (event === 'SIGNED_OUT') {
          setError(null);
          setIsSessionExpired(false);
        }
      }
      
      setLoading(false);
    });
    
    // Periodic session validation for admin
    const adminSessionCheckInterval = setInterval(async () => {
      if (session && user && adminUser) {
        const isValid = await checkSession();
        if (!isValid) {
          console.warn('Admin session validation failed');
          setAdminUser(null);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Network monitoring for admin panel
    const handleOnline = () => {
      setConnectionStatus('online');
      setError(null);
      if (session) {
        checkSession();
      }
    };
    
    const handleOffline = () => {
      setConnectionStatus('offline');
      setError('Conexão perdida. Funcionalidades administrativas podem estar limitadas.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      console.log('AdminAuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe();
      clearInterval(adminSessionCheckInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const signOut = async () => {
    console.log('AdminAuthProvider: Signing out admin user...');
    
    try {
      // Clear auth state first
      const cleanupAuthState = () => {
        localStorage.removeItem('supabase.auth.token');
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage || {}).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      };

      // Clear local state immediately
      setUser(null);
      setSession(null);
      setAdminUser(null);
      setError(null);
      setIsSessionExpired(false);

      cleanupAuthState();

      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('AdminAuthProvider: Error during sign out:', error);
        // Don't show error to user as cleanup already happened
      }

      // Navigate to unified login page
      navigate('/login', { replace: true });
      
    } catch (error) {
      console.error('AdminAuthProvider: Unexpected error during sign out:', error);
      // Clear state and navigate even on error
      setUser(null);
      setSession(null);
      setAdminUser(null);
      setError(null);
      navigate('/login', { replace: true });
    }
  };

  const isAdmin = adminUser?.role === 'admin';
  const isStaff = adminUser?.role === 'staff';

  const value = {
    user,
    session,
    adminUser,
    loading,
    error,
    isSessionExpired,
    connectionStatus,
    isAdmin,
    isStaff,
    signOut,
    clearError,
    checkSession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
