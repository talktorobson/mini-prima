import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login - replace with actual Supabase auth
    setTimeout(() => {
      if (email && password) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('clientName', 'João Silva');
        localStorage.setItem('clientCompany', 'Empresa Teste Ltda');
        window.location.href = '/portal';
      } else {
        toast({
          title: "Erro no login",
          description: "Por favor, preencha todos os campos.",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    }, 1000);
  };
  return <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Site</span>
        </Button>
      </div>

      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Portal do Cliente
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar seu portal
          </p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Acesso ao Portal</CardTitle>
            <CardDescription>
              Digite suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="mt-1 bg-slate-200" />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1 bg-slate-300" />
              </div>
              
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Login;