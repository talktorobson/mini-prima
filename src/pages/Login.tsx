
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, ArrowLeft, Shield, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { adminAuthService } from '@/services/adminAuth';
import { logActivity } from '@/services/database';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'auto' | 'client' | 'admin'>('auto');
  const navigate = useNavigate();
  const { user: clientUser } = useAuth();
  const { user: adminUser, adminUser: adminData } = useAdminAuth();

  useEffect(() => {
    // If user is already authenticated as client, redirect to portal
    if (clientUser && !adminData) {
      console.log('Client user already authenticated, redirecting to portal');
      navigate('/portal');
    }
    // If user is already authenticated as admin, redirect to admin dashboard
    if (adminUser && adminData) {
      console.log('Admin user already authenticated, redirecting to dashboard');
      navigate('/admin');
    }
  }, [clientUser, adminUser, adminData, navigate]);

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

  const attemptClientLogin = async (email: string, password: string) => {
    console.log('Attempting client login for:', email);
    
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      throw signInError;
    }

    if (data.user) {
      // Check if this user has admin privileges
      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (adminCheck) {
        // User has admin privileges, sign them out and try admin login
        await supabase.auth.signOut();
        throw new Error('ADMIN_LOGIN_REQUIRED');
      }

      console.log('Client login successful for:', data.user.email);
      setTimeout(() => {
        logActivity('auth', 'Client login successful', {
          user_email: data.user.email,
          session_id: data.session?.access_token?.slice(-8),
          timestamp: new Date().toISOString()
        });
      }, 1000);

      return { success: true, redirectTo: '/portal' };
    }

    throw new Error('Falha na autenticação.');
  };

  const attemptAdminLogin = async (email: string, password: string) => {
    console.log('Attempting admin login for:', email);
    
    const { data, error: signInError } = await adminAuthService.signIn(email, password);

    if (signInError) {
      throw signInError;
    }

    if (data) {
      console.log('Admin login successful for:', email);
      return { success: true, redirectTo: '/admin' };
    }

    throw new Error('Falha na autenticação administrativa.');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out during cleanup failed (expected):', err);
      }

      let result;

      if (loginType === 'client') {
        result = await attemptClientLogin(email, password);
      } else if (loginType === 'admin') {
        result = await attemptAdminLogin(email, password);
      } else {
        // Auto-detect mode: try client first, then admin
        try {
          result = await attemptClientLogin(email, password);
        } catch (clientError: any) {
          if (clientError.message === 'ADMIN_LOGIN_REQUIRED') {
            // User has admin privileges, try admin login
            result = await attemptAdminLogin(email, password);
          } else {
            // Client login failed, try admin login
            try {
              result = await attemptAdminLogin(email, password);
            } catch (adminError: any) {
              // Both failed, show the original client error
              throw clientError;
            }
          }
        }
      }

      if (result.success) {
        window.location.href = result.redirectTo;
      }

    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Erro inesperado. Tente novamente.');
      
      setTimeout(() => {
        logActivity('auth', 'Sign in failed', {
          email: email.trim(),
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const getLoginTypeDisplay = () => {
    switch (loginType) {
      case 'admin':
        return {
          title: 'Acesso Administrativo',
          description: 'Área restrita para administradores e equipe',
          icon: Users,
          gradient: 'from-red-800 to-red-600',
          buttonGradient: 'from-red-700 to-red-900 hover:from-red-800 hover:to-red-950',
          accentColor: 'red'
        };
      case 'client':
        return {
          title: 'Portal do Cliente',
          description: 'Acesse sua conta para visualizar seus processos e documentos',
          icon: Shield,
          gradient: 'from-navy-800 to-navy-600',
          buttonGradient: 'from-navy-700 to-navy-900 hover:from-navy-800 hover:to-navy-950',
          accentColor: 'navy'
        };
      default:
        return {
          title: 'Fazer Login',
          description: 'Entre com suas credenciais para acessar o sistema',
          icon: Shield,
          gradient: 'from-navy-800 to-navy-600',
          buttonGradient: 'from-navy-700 to-navy-900 hover:from-navy-800 hover:to-navy-950',
          accentColor: 'navy'
        };
    }
  };

  const displayConfig = getLoginTypeDisplay();
  const IconComponent = displayConfig.icon;

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      {/* Back to site link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center text-amber-200 hover:text-amber-100 transition-colors duration-200 group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
        <span className="text-sm font-medium">Voltar ao Site</span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className={`mx-auto w-16 h-16 bg-gradient-to-br ${loginType === 'admin' ? 'from-red-600 to-red-800' : 'from-navy-600 to-navy-800'} rounded-full flex items-center justify-center mb-2`}>
            <IconComponent className={`h-8 w-8 ${loginType === 'admin' ? 'text-white' : 'text-amber-400'}`} />
          </div>
          <CardTitle className={`text-3xl font-bold bg-gradient-to-r ${displayConfig.gradient} bg-clip-text text-transparent`}>
            {displayConfig.title}
          </CardTitle>
          <CardDescription className="text-navy-600 text-base">
            {displayConfig.description}
          </CardDescription>
          
          {/* Login type selector */}
          <div className="flex justify-center space-x-2 mt-4">
            <Button
              type="button"
              variant={loginType === 'auto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLoginType('auto')}
              className="text-xs"
            >
              Auto
            </Button>
            <Button
              type="button"
              variant={loginType === 'client' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLoginType('client')}
              className="text-xs"
            >
              Cliente
            </Button>
            <Button
              type="button"
              variant={loginType === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLoginType('admin')}
              className="text-xs"
            >
              Admin
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pb-8">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-navy-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={loginType === 'admin' ? 'admin@exemplo.com' : 'seu@email.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className={`h-12 border-navy-200 ${loginType === 'admin' ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-navy-500 focus:ring-navy-500'} transition-colors`}
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-navy-700 font-medium">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className={`h-12 pr-12 border-navy-200 ${loginType === 'admin' ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-navy-500 focus:ring-navy-500'} transition-colors`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-navy-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-navy-400" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className={`w-full h-12 bg-gradient-to-r ${displayConfig.buttonGradient} ${loginType === 'admin' ? 'text-white' : 'text-amber-400'} font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
          
          {loginType !== 'admin' && (
            <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
              <p className="text-center text-sm text-navy-600 mb-2 font-medium">
                Credenciais de teste:
              </p>
              <p className="font-mono bg-white px-3 py-2 rounded border text-center text-navy-700 font-medium">
                teste@exemplo.com
              </p>
            </div>
          )}
          
          {loginType === 'admin' && (
            <div className="mt-8 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Área Restrita</span>
              </div>
              <p className="text-xs text-red-600">
                Apenas usuários autorizados podem acessar o painel administrativo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Additional decorative elements */}
      <div className={`absolute top-20 right-20 w-32 h-32 ${loginType === 'admin' ? 'bg-red-400/10' : 'bg-amber-400/10'} rounded-full blur-xl`}></div>
      <div className={`absolute bottom-20 left-20 w-24 h-24 ${loginType === 'admin' ? 'bg-red-500/20' : 'bg-amber-500/20'} rounded-full blur-2xl`}></div>
    </div>
  );
};

export default Login;
