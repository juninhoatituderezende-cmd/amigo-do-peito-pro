import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PaymentReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkPaymentStatus();
    }
  }, [user, searchParams]);

  const checkPaymentStatus = async () => {
    try {
      // Verificar parâmetros de retorno do Asaas
      const paymentId = searchParams.get('payment_id');
      const status = searchParams.get('status');
      
      console.log('🔍 Verificando status do pagamento:', { paymentId, status });

      if (paymentId) {
        // Buscar informações do pagamento no banco
        const { data: payment, error } = await supabase
          .from('payments')
          .select('*')
          .eq('asaas_payment_id', paymentId)
          .eq('user_id', user?.id)
          .single();

        if (error || !payment) {
          console.error('❌ Pagamento não encontrado:', error);
          setPaymentStatus('failed');
          return;
        }

        setPaymentInfo(payment);

        // Determinar status baseado nos dados do banco
        switch (payment.status) {
          case 'paid':
            setPaymentStatus('success');
            break;
          case 'pending':
            setPaymentStatus('pending');
            break;
          case 'cancelled':
          case 'failed':
            setPaymentStatus('failed');
            break;
          default:
            setPaymentStatus('pending');
        }

        console.log('✅ Status do pagamento:', payment.status);

      } else {
        // Se não tem payment_id, buscar último pagamento do usuário
        const { data: lastPayment } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastPayment) {
          setPaymentInfo(lastPayment);
          setPaymentStatus(lastPayment.status === 'paid' ? 'success' : 'pending');
        } else {
          setPaymentStatus('failed');
        }
      }

    } catch (error) {
      console.error('💥 Erro ao verificar pagamento:', error);
      setPaymentStatus('failed');
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-gray-400 animate-pulse" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          title: 'Pagamento Confirmado!',
          description: 'Seu pagamento foi processado com sucesso. Você já foi adicionado ao grupo do plano.',
          color: 'text-green-600'
        };
      case 'pending':
        return {
          title: 'Pagamento Pendente',
          description: 'Seu pagamento está sendo processado. Você receberá uma notificação quando for confirmado.',
          color: 'text-yellow-600'
        };
      case 'failed':
        return {
          title: 'Erro no Pagamento',
          description: 'Não foi possível processar seu pagamento. Tente novamente ou entre em contato com o suporte.',
          color: 'text-red-600'
        };
      default:
        return {
          title: 'Verificando Pagamento...',
          description: 'Aguarde enquanto verificamos o status do seu pagamento.',
          color: 'text-gray-600'
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>

          {/* Status Message */}
          <div>
            <h1 className={`text-2xl font-bold mb-2 ${statusMessage.color}`}>
              {statusMessage.title}
            </h1>
            <p className="text-muted-foreground">
              {statusMessage.description}
            </p>
          </div>

          {/* Payment Details */}
          {paymentInfo && (
            <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2">
              <h3 className="font-medium">Detalhes do Pagamento:</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano:</span>
                  <span>{paymentInfo.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span>R$ {Number(paymentInfo.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método:</span>
                  <span className="capitalize">{paymentInfo.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span>{new Date(paymentInfo.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {paymentStatus === 'success' && (
              <Button 
                onClick={() => navigate('/usuario/dashboard')}
                className="w-full"
              >
                Ir para o Dashboard
              </Button>
            )}

            {paymentStatus === 'pending' && (
              <Button 
                onClick={() => navigate('/usuario/dashboard')}
                className="w-full"
              >
                Acompanhar Status
              </Button>
            )}

            {paymentStatus === 'failed' && (
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/usuario/planos')}
                  className="w-full"
                >
                  Tentar Novamente
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/suporte')}
                  className="w-full"
                >
                  Contatar Suporte
                </Button>
              </div>
            )}

            {/* Always show back button */}
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          {/* Loading State */}
          {paymentStatus === 'loading' && (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReturn;