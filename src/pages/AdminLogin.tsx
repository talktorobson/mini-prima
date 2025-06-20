
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, ArrowLeft, Shield, Users } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { adminAuthService } from '@/services/adminAuth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, adminUser } = useAdminAuth();

  useEffect(() => {
    // If user is already authenticated as admin/staff, redirect to admin dashboard
    if (user && adminUser) {
      console.log('Admin user already authenticated, redirecting to dashboard');
      navigate('/admin');
    }
  }, [user, adminUser, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Attempting admin sign in for:', email);

    const { data, error: signInError } = await adminAuthService.signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data) {
      console.log('Admin sign in successful, redirecting to dashboard');
      // Force page reload to ensure clean state
      window.location.href = '/admin';
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div 
        className="absolute inset-0 opacity-5"
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
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mb-2">
            <Users className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-800 to-red-600 bg-clip-text text-transparent">
            Acesso Administrativo
          </CardTitle>
          <CardDescription className="text-navy-600 text-base">
            Área restrita para administradores e equipe
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-8">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-navy-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="h-12 border-navy-200 focus:border-red-500 focus:ring-red-500 transition-colors"
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
                  className="h-12 pr-12 border-navy-200 focus:border-red-500 focus:ring-red-500 transition-colors"
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
              className="w-full h-12 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar no Painel'
              )}
            </Button>
          </form>
          
          <div className="mt-8 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Área Restrita</span>
            </div>
            <p className="text-xs text-red-600">
              Apenas usuários autorizados podem acessar o painel administrativo.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional decorative elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-red-400/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-red-500/20 rounded-full blur-2xl"></div>
    </div>
  );
};

export default AdminLogin;
