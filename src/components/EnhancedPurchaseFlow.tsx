import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PaymentProcessor } from "@/components/PaymentProcessor";
import { supabase } from "@/lib/supabase";
import { 
  CheckCircle, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  CreditCard,
  Loader2,
  Shield,
  Lock
} from "lucide-react";

interface PurchaseFlowProps {
  planId: string;
  planData: {
    title: string;
    description: string;
    entry_value: number;
    contemplation_value: number;
  };
  influencerCode?: string;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export function EnhancedPurchaseFlow({ planId, planData, influencerCode }: PurchaseFlowProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "full_name":
        if (value.length < 2) return "Nome deve ter pelo menos 2 caracteres";
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) return "Nome deve conter apenas letras";
        return "";
      
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inválido";
        return "";
      
      case "phone":
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        if (!phoneRegex.test(value)) return "Formato: (11) 99999-9999";
        return "";
      
      case "cpf":
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        if (!cpfRegex.test(value)) return "Formato: 000.000.000-00";
        if (!validateCPF(value)) return "CPF inválido";
        return "";
      
      default:
        return "";
    }
  };

  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/[^\d]/g, "");
    if (numbers.length !== 11 || /^(\d)\1{10}$/.test(numbers)) return false;
    
    const digits = numbers.split("").map(Number);
    const checkDigit = (slice: number) => {
      const sum = digits.slice(0, slice).reduce((acc, digit, i) => acc + digit * (slice + 1 - i), 0);
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };
    
    return checkDigit(9) === digits[9] && checkDigit(10) === digits[10];
  };

  const formatField = (name: string, value: string): string => {
    switch (name) {
      case "phone":
        const phoneNumbers = value.replace(/\D/g, "");
        if (phoneNumbers.length <= 10) {
          return phoneNumbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }
        return phoneNumbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      
      case "cpf":
        const cpfNumbers = value.replace(/\D/g, "");
        return cpfNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      
      default:
        return value;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatField(name, value);
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Real-time validation
    const error = validateField(name, formattedValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) newErrors[key] = error;
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitUserData = async () => {
    if (!validateForm()) {
      toast({
        title: "Dados inválidos",
        description: "Por favor, corrija os erros nos campos destacados",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Register user and proceed to payment
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-8), // Temporary password
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            cpf: formData.cpf,
          }
        }
      });

      if (error) throw error;
      
      if (data.user) {
        setUserId(data.user.id);
        setStep(2);
        
        toast({
          title: "Dados confirmados!",
          description: "Agora escolha a forma de pagamento",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    setStep(3);
    toast({
      title: "Pagamento processado!",
      description: "Redirecionando para confirmação...",
    });
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case "full_name": return <User className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "phone": return <Phone className="h-4 w-4" />;
      case "cpf": return <CreditCard className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStepIcon = (stepNumber: number) => {
    if (step > stepNumber) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (step === stepNumber) return <div className="h-5 w-5 bg-primary rounded-full" />;
    return <div className="h-5 w-5 bg-gray-300 rounded-full" />;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className="flex items-center space-x-2">
          {getStepIcon(1)}
          <span className={`text-sm ${step >= 1 ? 'text-primary font-medium' : 'text-gray-400'}`}>
            Dados Pessoais
          </span>
        </div>
        <div className="h-px w-8 bg-gray-300" />
        <div className="flex items-center space-x-2">
          {getStepIcon(2)}
          <span className={`text-sm ${step >= 2 ? 'text-primary font-medium' : 'text-gray-400'}`}>
            Pagamento
          </span>
        </div>
        <div className="h-px w-8 bg-gray-300" />
        <div className="flex items-center space-x-2">
          {getStepIcon(3)}
          <span className={`text-sm ${step >= 3 ? 'text-primary font-medium' : 'text-gray-400'}`}>
            Confirmação
          </span>
        </div>
      </div>

      {/* Plan Summary */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{planData.title}</h3>
              <p className="text-sm text-muted-foreground">{planData.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                R$ {planData.entry_value.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Meta: R$ {planData.contemplation_value.toFixed(2)}
              </div>
            </div>
          </div>
          {influencerCode && (
            <Badge variant="secondary" className="mt-2">
              Código de indicação: {influencerCode}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Step 1: Personal Data */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Seus Dados Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Seus dados estão protegidos e serão usados apenas para participação no plano
              </AlertDescription>
            </Alert>

            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="flex items-center space-x-2">
                  {getFieldIcon(key)}
                  <span className="capitalize">
                    {key.replace('_', ' ')} {key === 'cpf' ? '(CPF)' : ''}
                  </span>
                </Label>
                <Input
                  id={key}
                  name={key}
                  value={value}
                  onChange={handleInputChange}
                  className={errors[key] ? "border-red-500" : ""}
                  placeholder={
                    key === 'phone' ? "(11) 99999-9999" :
                    key === 'cpf' ? "000.000.000-00" :
                    key === 'email' ? "seu@email.com" :
                    "Digite seu " + key.replace('_', ' ')
                  }
                />
                {errors[key] && (
                  <div className="flex items-center space-x-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors[key]}</span>
                  </div>
                )}
              </div>
            ))}

            <Button 
              onClick={handleSubmitUserData}
              disabled={loading || Object.keys(errors).some(key => errors[key])}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando dados...
                </>
              ) : (
                "Continuar para pagamento"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Payment */}
      {step === 2 && userId && (
        <PaymentProcessor
          planId={planId}
          userId={userId}
          influencerCode={influencerCode}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <Card className="text-center">
          <CardContent className="p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Parabéns!</h2>
            <p className="text-muted-foreground mb-6">
              Sua participação no plano foi confirmada. Em breve você receberá um email com todos os detalhes.
            </p>
            
            <div className="space-y-4">
              <Button className="w-full" onClick={() => window.location.href = "/usuario/dashboard"}>
                Acessar meu painel
              </Button>
              <Button variant="outline" className="w-full">
                Compartilhar link de indicação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}