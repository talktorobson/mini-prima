
import { supabase } from '@/integrations/supabase/client';

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
        return { data: null, error: signInError };
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
          return { data: null, error: { message: 'Erro ao verificar permissões de acesso.' } };
        }

        if (!adminUser) {
          console.error('User does not have admin/staff privileges');
          await supabase.auth.signOut();
          return { data: null, error: { message: 'Acesso não autorizado. Apenas administradores e equipe podem acessar.' } };
        }

        console.log('Admin sign in successful:', { email: data.user.email, role: adminUser.role });
        return { data: { user: data.user, adminUser }, error: null };
      }

      return { data: null, error: { message: 'Falha na autenticação.' } };

    } catch (error: any) {
      console.error('Unexpected admin sign in error:', error);
      return { data: null, error: { message: 'Erro inesperado. Tente novamente.' } };
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
        return { data: null, error: authError };
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
          return { data: null, error: adminError };
        }

        console.log('Admin user created successfully:', adminUser);
        return { data: { user: authData.user, adminUser }, error: null };
      }

      return { data: null, error: { message: 'Falha ao criar usuário.' } };

    } catch (error: any) {
      console.error('Unexpected error creating admin user:', error);
      return { data: null, error: { message: 'Erro inesperado. Tente novamente.' } };
    }
  }
};
