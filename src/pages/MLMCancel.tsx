import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react";

export default function MLMCancel() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        
        {/* Ícone de Cancelamento */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold mb-4">Compra Cancelada</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Sua compra foi cancelada. Nenhum valor foi cobrado.
        </p>

        {/* Card de Informações */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>O que aconteceu?</CardTitle>
          </CardHeader>
          <CardContent className="text-left">
            <p className="text-muted-foreground mb-4">
              Você cancelou o processo de pagamento antes de concluí-lo. 
              Isso pode ter acontecido por vários motivos:
            </p>
            
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
              <li>Você fechou a janela de pagamento</li>
              <li>Decidiu não prosseguir com a compra</li>
              <li>Houve algum problema técnico</li>
              <li>Você quer revisar os detalhes antes de comprar</li>
            </ul>

            <Alert>
              <AlertDescription>
                <strong>Não se preocupe!</strong> Nenhum valor foi cobrado e você pode tentar novamente 
                a qualquer momento. Seus dados estão seguros.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>O que você gostaria de fazer agora?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button 
                onClick={() => navigate('/mlm/products')}
                size="lg"
                className="w-full"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                size="lg"
                className="w-full"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar à Página Anterior
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                size="lg"
                className="w-full"
              >
                Ir para a Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Suporte */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Precisa de ajuda? Entre em contato conosco através do suporte.
          </p>
        </div>
      </div>
    </div>
  );
}