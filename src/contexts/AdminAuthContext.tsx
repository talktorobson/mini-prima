
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
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
  isAdmin: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
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
        return null;
      }

      console.log('Admin user data:', data);
      return data as AdminUser | null;
    } catch (error) {
      console.error('Unexpected error fetching admin user:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('AdminAuthProvider: Initializing authentication...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AdminAuthProvider: Error getting initial session:', error);
        } else {
          console.log('AdminAuthProvider: Initial session:', initialSession?.user?.email || 'No session');
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            const adminData = await fetchAdminUser(initialSession.user.id);
            setAdminUser(adminData);
          }
        }
      } catch (error) {
        console.error('AdminAuthProvider: Unexpected error during session initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AdminAuthProvider: Auth state changed:', event, session?.user?.email || 'No user');
      
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
      }
      
      setLoading(false);
    });

    return () => {
      console.log('AdminAuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('AdminAuthProvider: Signing out user...');
    
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

      cleanupAuthState();

      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('AdminAuthProvider: Error during sign out:', error);
      }

      // Force page reload for a clean state
      window.location.href = '/admin/login';
      
    } catch (error) {
      console.error('AdminAuthProvider: Unexpected error during sign out:', error);
      window.location.href = '/admin/login';
    }
  };

  const isAdmin = adminUser?.role === 'admin';
  const isStaff = adminUser?.role === 'staff';

  const value = {
    user,
    session,
    adminUser,
    loading,
    isAdmin,
    isStaff,
    signOut,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
