
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logActivity } from '@/services/database';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to portal
    if (user) {
      console.log('User already authenticated, redirecting to portal');
      navigate('/portal');
    }
  }, [user, navigate]);

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Attempting sign in for:', email);

    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out first to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out during cleanup failed (expected):', err);
        // Continue even if this fails
      }

      // Sign in with email/password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError.message);
        
        // Log failed sign in attempt
        setTimeout(() => {
          logActivity('auth', 'Sign in failed', {
            email: email.trim(),
            error: signInError.message,
            timestamp: new Date().toISOString()
          });
        }, 500);
        return;
      }

      if (data.user) {
        console.log('Sign in successful for:', data.user.email);
        
        // Log successful sign in
        setTimeout(() => {
          logActivity('auth', 'Sign in successful', {
            user_email: data.user.email,
            session_id: data.session?.access_token?.slice(-8),
            timestamp: new Date().toISOString()
          });
        }, 1000);

        // Force page reload to ensure clean state
        window.location.href = '/portal';
      }

    } catch (error: any) {
      console.error('Unexpected sign in error:', error);
      setError('Erro inesperado. Tente novamente.');
      
      // Log unexpected error
      setTimeout(() => {
        logActivity('auth', 'Sign in error', {
          email: email.trim(),
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }, 500);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-navy-600 to-navy-800 rounded-full flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-amber-400" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-navy-800 to-navy-600 bg-clip-text text-transparent">
            Portal do Cliente
          </CardTitle>
          <CardDescription className="text-navy-600 text-base">
            Acesse sua conta para visualizar seus processos e documentos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-8">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-navy-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="h-12 border-navy-200 focus:border-navy-500 focus:ring-navy-500 transition-colors"
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
                  className="h-12 pr-12 border-navy-200 focus:border-navy-500 focus:ring-navy-500 transition-colors"
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
              className="w-full h-12 bg-gradient-to-r from-navy-700 to-navy-900 hover:from-navy-800 hover:to-navy-950 text-amber-400 font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200" 
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
          
          <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
            <p className="text-center text-sm text-navy-600 mb-2 font-medium">
              Credenciais de teste:
            </p>
            <p className="font-mono bg-white px-3 py-2 rounded border text-center text-navy-700 font-medium">
              teste@exemplo.com
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional decorative elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-amber-400/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl"></div>
    </div>
  );
};

export default Login;
