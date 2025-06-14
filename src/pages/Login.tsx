
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validate passwords match
        if (password !== confirmPassword) {
          toast({
            title: "Erro no cadastro",
            description: "As senhas não coincidem.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Validate required fields
        if (!email || !password || !fullName || !companyName) {
          toast({
            title: "Erro no cadastro",
            description: "Por favor, preencha todos os campos obrigatórios.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, {
          full_name: fullName,
          company_name: companyName,
          phone: phone
        });

        if (error) {
          console.error('Sign up error:', error);
          if (error.message.includes('User already registered')) {
            toast({
              title: "Erro no cadastro",
              description: "Este email já está cadastrado. Tente fazer login.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erro no cadastro",
              description: error.message || "Erro desconhecido no cadastro.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Conta criada com sucesso. Você pode fazer login agora.",
          });
          setIsSignUp(false);
          // Clear form
          setPassword('');
          setConfirmPassword('');
          setFullName('');
          setCompanyName('');
          setPhone('');
        }
      } else {
        // Login
        if (!email || !password) {
          toast({
            title: "Erro no login",
            description: "Por favor, preencha todos os campos.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(email, password);

        if (error) {
          console.error('Sign in error:', error);
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Erro no login",
              description: "Email ou senha incorretos.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erro no login",
              description: error.message || "Erro desconhecido no login.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Login realizado!",
            description: "Bem-vindo ao portal.",
          });
          // Redirect will happen automatically via AuthContext
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="absolute top-4 left-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
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
            {isSignUp ? 'Crie sua conta para acessar o portal' : 'Faça login para acessar seu portal'}
          </p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {isSignUp ? 'Criar Conta' : 'Acesso ao Portal'}
            </CardTitle>
            <CardDescription>
              {isSignUp ? 'Preencha os dados para criar sua conta' : 'Digite suas credenciais para continuar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input 
                      id="fullName" 
                      type="text" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      placeholder="Seu nome completo" 
                      required 
                      className="mt-1" 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="companyName">Nome da Empresa *</Label>
                    <Input 
                      id="companyName" 
                      type="text" 
                      value={companyName} 
                      onChange={e => setCompanyName(e.target.value)} 
                      placeholder="Nome da sua empresa" 
                      required 
                      className="mt-1" 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      placeholder="(11) 99999-9999" 
                      className="mt-1" 
                    />
                  </div>
                </>
              )}
              
              <div>
                <Label htmlFor="email">Email {isSignUp && '*'}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="seu@email.com" 
                  required 
                  className="mt-1" 
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha {isSignUp && '*'}</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  className="mt-1" 
                />
              </div>

              {isSignUp && (
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    className="mt-1" 
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? (isSignUp ? 'Criando conta...' : 'Entrando...') : (isSignUp ? 'Criar Conta' : 'Entrar')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  // Clear form when switching
                  setPassword('');
                  setConfirmPassword('');
                  setFullName('');
                  setCompanyName('');
                  setPhone('');
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                {isSignUp ? (
                  <>Já tem uma conta? Faça login</>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Não tem conta? Cadastre-se
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
