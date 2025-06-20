
import { supabase } from '@/integrations/supabase/client';

// Enhanced error classification for admin auth
const classifyAdminAuthError = (error: any) => {
  if (error.message?.includes('fetch') || error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
    return { message: 'Problemas de conexão com o servidor administrativo' };
  }
  
  if (error.message?.includes('Invalid login credentials')) {
    return { message: 'Credenciais administrativas inválidas' };
  }
  
  if (error.message?.includes('Email not confirmed')) {
    return { message: 'Email administrativo não confirmado' };
  }
  
  if (error.message?.includes('Too many requests')) {
    return { message: 'Muitas tentativas de login administrativo. Aguarde alguns minutos.' };
  }
  
  return { message: error.message || 'Erro inesperado no login administrativo' };
};

export const adminAuthService = {
  signIn: async (email: string, password: string) => {
    console.log('Admin sign in attempt for:', email);

    try {
      // Clean up existing state
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

      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out during cleanup failed (expected):', err);
      }

      // Sign in with email/password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.error('Admin sign in error:', signInError);
        const classifiedError = classifyAdminAuthError(signInError);
        return { data: null, error: classifiedError };
      }

      if (data.user) {
        // Verify this user has admin/staff privileges
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('id, role, staff_id, permissions, is_active')
          .eq('user_id', data.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (adminError) {
          console.error('Error checking admin privileges:', adminError);
          await supabase.auth.signOut();
          
          // Classify the error for better user feedback
          if (adminError.message?.includes('fetch') || adminError.code === 'PGRST301') {
            return { data: null, error: { message: 'Erro de conexão ao verificar permissões administrativas.' } };
          }
          
          return { data: null, error: { message: 'Erro ao verificar permissões de acesso.' } };
        }

        if (!adminUser) {
          console.error('User does not have admin/staff privileges');
          await supabase.auth.signOut();
          return { 
            data: null, 
            error: { 
              message: 'Acesso não autorizado', 
              details: 'Este usuário não possui permissões administrativas. Entre em contato com o administrador do sistema.' 
            } 
          };
        }

        console.log('Admin sign in successful:', { email: data.user.email, role: adminUser.role });
        return { data: { user: data.user, adminUser }, error: null };
      }

      return { data: null, error: { message: 'Falha na autenticação.' } };

    } catch (error: any) {
      console.error('Unexpected admin sign in error:', error);
      const classifiedError = classifyAdminAuthError(error);
      return { data: null, error: classifiedError };
    }
  },

  createAdminUser: async (userData: {
    email: string;
    password: string;
    role: 'admin' | 'staff';
    staff_id?: string;
    permissions?: any;
  }) => {
    console.log('Creating admin user:', userData.email);

    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        const classifiedError = classifyAdminAuthError(authError);
        return { data: null, error: classifiedError };
      }

      if (authData.user) {
        // Create the admin user record
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .insert({
            user_id: authData.user.id,
            role: userData.role,
            staff_id: userData.staff_id || null,
            permissions: userData.permissions || {},
            is_active: true
          })
          .select()
          .single();

        if (adminError) {
          console.error('Error creating admin user record:', adminError);
          
          // Try to clean up the auth user if admin record creation failed
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
            console.log('Cleaned up auth user after admin record creation failure');
          } catch (cleanupError) {
            console.error('Failed to cleanup auth user:', cleanupError);
          }
          
          const classifiedError = classifyAdminAuthError(adminError);
          return { data: null, error: classifiedError };
        }

        console.log('Admin user created successfully:', adminUser);
        return { data: { user: authData.user, adminUser }, error: null };
      }

      return { data: null, error: { message: 'Falha ao criar usuário.' } };

    } catch (error: any) {
      console.error('Unexpected error creating admin user:', error);
      const classifiedError = classifyAdminAuthError(error);
      return { data: null, error: classifiedError };
    }
  }
};
