
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/services/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
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

  useEffect(() => {
    console.log('AuthProvider: Initializing authentication...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting initial session:', error);
        } else {
          console.log('AuthProvider: Initial session:', initialSession?.user?.email || 'No session');
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // Log initial authentication status
          if (initialSession?.user) {
            setTimeout(() => {
              logActivity('auth', 'Session restored', {
                user_email: initialSession.user.email,
                session_id: initialSession.access_token?.slice(-8) // Last 8 chars for identification
              });
            }, 1000);
          }
        }
      } catch (error) {
        console.error('AuthProvider: Unexpected error during session initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed:', event, session?.user?.email || 'No user');
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Log authentication events with security context
      if (event === 'SIGNED_IN' && session?.user) {
        // Defer activity logging to prevent potential deadlocks
        setTimeout(() => {
          logActivity('auth', 'User signed in', {
            user_email: session.user.email,
            session_id: session.access_token?.slice(-8),
            sign_in_method: session.user.app_metadata?.provider || 'email'
          });
        }, 1000);
      } else if (event === 'SIGNED_OUT') {
        setTimeout(() => {
          logActivity('auth', 'User signed out', {
            event_timestamp: new Date().toISOString()
          });
        }, 100);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setTimeout(() => {
          logActivity('auth', 'Token refreshed', {
            user_email: session.user.email,
            session_id: session.access_token?.slice(-8)
          });
        }, 1000);
      }
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('AuthProvider: Signing out user...');
    
    try {
      // Log sign out attempt
      if (user) {
        await logActivity('auth', 'Sign out initiated', {
          user_email: user.email
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

      cleanupAuthState();

      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('AuthProvider: Error during sign out:', error);
        // Continue with cleanup even if sign out fails
      }

      // Force page reload for a clean state
      window.location.href = '/login';
      
    } catch (error) {
      console.error('AuthProvider: Unexpected error during sign out:', error);
      // Force redirect even on error
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
