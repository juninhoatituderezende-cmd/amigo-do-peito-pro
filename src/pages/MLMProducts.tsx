import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Smile, Users, Crown, Zap, QrCode, Copy, ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  full_value: number;
  entry_value: number;
  product_code: string;
  category: string;
  stripe_product_id: string;
  stripe_price_id: string;
}

export default function MLMProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [pixPaymentData, setPixPaymentData] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Pegar código de indicação da URL se existir
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
    
    loadProducts();
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("price");

      if (error) throw error;
      
      const formattedProducts = (data || []).map(service => ({
        id: service.id,
        product_code: `SRV-${service.id.slice(-4)}`,
        name: service.name,
        full_value: service.price,
        entry_value: service.price * 0.1,
        category: service.category,
        stripe_product_id: `prod_${service.id}`,
        stripe_price_id: `price_${service.id}`
      }));
      
      setProducts(formattedProducts);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productCode: string) => {
    try {
      setPurchasing(productCode);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para fazer uma compra",
          variant: "destructive",
        });
        navigate("/user-login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-pix-payment", {
        body: {
          product_code: productCode,
          referral_code: referralCode || undefined,
          user_id: session.session.user.id
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Mostrar dados do PIX
        setPixPaymentData(data);
      } else {
        throw new Error(data?.error || "Erro ao processar compra");
      }

    } catch (error) {
      console.error("Erro na compra:", error);
      toast({
        title: "Erro na compra",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getCategoryIcon = (category: string) => {
    return category === 'tattoo' ? <Palette className="w-6 h-6" /> : <Smile className="w-6 h-6" />;
  };

  const getCategoryColor = (category: string) => {
    return category === 'tattoo' ? 'bg-purple-500' : 'bg-blue-500';
  };

  const copyPixCode = async () => {
    if (pixPaymentData?.pix_copy_paste) {
      await navigator.clipboard.writeText(pixPaymentData.pix_copy_paste);
      toast({
        title: "Código PIX copiado!",
        description: "Cole no seu app bancário para pagar",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  // Show PIX payment screen
  if (pixPaymentData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => setPixPaymentData(null)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos produtos
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">PIX Gerado com Sucesso!</CardTitle>
            <CardDescription>
              Escaneie o QR Code ou copie o código para pagar
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge variant="outline" className="text-lg px-4 py-2 mb-4">
                R$ {pixPaymentData.amount?.toFixed(2)}
              </Badge>
            </div>

            {pixPaymentData.pix_qr_code && (
              <div className="text-center">
                <img 
                  src={pixPaymentData.pix_qr_code} 
                  alt="QR Code PIX" 
                  className="mx-auto border rounded-lg shadow-lg max-w-xs"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Abra seu app bancário e escaneie o QR Code
                </p>
              </div>
            )}

            {pixPaymentData.pix_copy_paste && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Código PIX (Copiar e Colar):</Label>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 bg-muted rounded text-xs break-all border">
                    {pixPaymentData.pix_copy_paste}
                  </code>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyPixCode}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-semibold text-blue-800 mb-2">Como pagar:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Abra o app do seu banco</li>
                <li>2. Vá em PIX → Pagar</li>
                <li>3. Escaneie o QR Code ou cole o código</li>
                <li>4. Confirme o pagamento</li>
                <li>5. Aguarde a confirmação automática</li>
              </ol>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
              <p className="text-sm text-green-700">
                <strong>✅ Confirmação automática:</strong> Assim que o pagamento for confirmado, 
                você será automaticamente adicionado ao grupo e receberá seu link de indicação!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Pague apenas 10% de entrada e monte seu grupo de 9 indicações para ser contemplado!
        </p>
        
        {/* Como funciona */}
        <Card className="max-w-4xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Como funciona o sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Pague a Entrada</h3>
                <p className="text-sm text-muted-foreground">
                  Você paga apenas 10% do valor total do serviço
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Indique 9 Pessoas</h3>
                <p className="text-sm text-muted-foreground">
                  Use seu link único para formar um grupo de 10 pessoas
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Seja Contemplado</h3>
                <p className="text-sm text-muted-foreground">
                  Receba seu serviço completo sem pagar mais nada!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Código de Indicação */}
      {referralCode && (
        <div className="max-w-md mx-auto mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800">Você foi indicado!</p>
                <p className="text-sm text-green-600">Código: {referralCode}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campo para inserir código de indicação */}
      {!referralCode && (
        <div className="max-w-md mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tem um código de indicação?</CardTitle>
              <CardDescription>
                Digite o código de quem te indicou para entrar no grupo dela
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="referral">Código de Indicação (opcional)</Label>
                <Input
                  id="referral"
                  placeholder="Ex: ABC12345"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${getCategoryColor(product.category)}`}></div>
            
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getCategoryColor(product.category)} text-white`}>
                  {getCategoryIcon(product.category)}
                </div>
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {product.category === 'tattoo' ? 'Tatuagem' : 'Dental'}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor total:</span>
                  <span className="text-lg font-semibold line-through text-muted-foreground">
                    {formatCurrency(product.full_value)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Você paga apenas:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(product.entry_value)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground text-center p-2 bg-muted rounded">
                  Apenas 10% de entrada - O restante é absorvido quando seu grupo fechar!
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handlePurchase(product.product_code)}
                disabled={purchasing === product.product_code}
                size="lg"
              >
                {purchasing === product.product_code ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    Comprar por {formatCurrency(product.entry_value)}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">💡 Dica Importante</h3>
            <p className="text-sm text-muted-foreground">
              Quanto mais você indicar, mais rápido forma novos grupos e pode ser contemplado novamente! 
              Cada pessoa que você indica também forma seu próprio grupo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}