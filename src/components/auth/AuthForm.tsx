import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthFormProps {
  mode: 'login' | 'register';
  accountType: 'user' | 'professional' | 'influencer';
  onBack: () => void;
  onSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  mode, 
  accountType, 
  onBack, 
  onSuccess 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { toast } = useToast();

  const accountTypeLabels = {
    user: 'Usuário',
    professional: 'Profissional', 
    influencer: 'Influenciador'
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkExistingAccountTypes = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('get_existing_account_types', {
        check_email: email
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao verificar contas existentes:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validações básicas
      if (!validateEmail(email)) {
        throw new Error('Email inválido');
      }

      if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      if (mode === 'register') {
        // Verificar se já existe conta com esse email e tipo
        const { data: existsData, error: existsError } = await supabase.rpc(
          'validate_unique_email_by_role', 
          {
            check_email: email,
            check_role: accountType
          }
        );

        if (existsError) throw existsError;

        if (!existsData) {
          // Verificar que tipos de conta já existem para mostrar erro mais específico
          const existingAccounts = await checkExistingAccountTypes(email);
          const accountTypeNames = existingAccounts.map(acc => 
            accountTypeLabels[acc.account_type as keyof typeof accountTypeLabels]
          ).join(', ');
          
          throw new Error(
            `E-mail já cadastrado como: ${accountTypeNames}. Use outro e-mail ou faça login.`
          );
        }

        // Registrar usuário
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              role: accountType,
              phone: phone || null,
              cpf: cpf || null
            }
          }
        });

        if (authError) throw authError;

        if (authData.user && !authData.session) {
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para confirmar a conta.",
          });
        } else {
          toast({
            title: "Cadastro realizado com sucesso!",
            description: `Bem-vindo ao painel ${accountTypeLabels[accountType]}.`,
          });
        }

        onSuccess();
      } else {
        // Login
        const { data: loginData, error: loginError } = await supabase.rpc(
          'login_with_account_type',
          {
            login_email: email,
            requested_role: accountType
          }
        );

        if (loginError) throw loginError;

        if (!loginData || loginData.length === 0 || !loginData[0].valid_login) {
          const errorMsg = loginData?.[0]?.error_message || 'Email ou senha incorretos';
          throw new Error(errorMsg);
        }

        // Fazer login real
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) throw authError;

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo de volta ao painel ${accountTypeLabels[accountType]}.`,
        });

        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      setError(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="w-fit p-0 h-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <CardTitle className="text-2xl">
          {mode === 'login' ? 'Entrar' : 'Criar Conta'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' ? 'Entre' : 'Cadastre-se'} como {accountTypeLabels[accountType]}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mode === 'register' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  disabled={loading}
                />
              </div>

              {accountType === 'professional' && (
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF (opcional)</Label>
                  <Input
                    id="cpf"
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    disabled={loading}
                  />
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {mode === 'register' && (
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'login' ? 'Entrando...' : 'Cadastrando...'}
              </>
            ) : (
              mode === 'login' ? 'Entrar' : 'Criar Conta'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
            <Button
              variant="link"
              className="p-0 ml-1 h-auto"
              onClick={() => window.location.href = mode === 'login' ? '/cadastro' : '/login'}
            >
              {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};