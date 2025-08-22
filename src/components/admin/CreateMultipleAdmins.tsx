import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CreateMultipleAdmins = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const admins = [
    {
      email: 'Juninhoatitude@hotmail.com',
      password: 'Atitude2025@',
      full_name: 'Junior Admin',
      phone: null
    },
    {
      email: 'charlesink1996@gmail.com', 
      password: 'Arthur1234!',
      full_name: 'Charles Admin',
      phone: null
    }
  ];

  const createAdmin = async (adminData: any) => {
    const response = await fetch(`https://jiqgwevetdkvcqelniaw.supabase.co/functions/v1/create-admin-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData)
    });

    return await response.json();
  };

  const handleCreateAdmins = async () => {
    setLoading(true);
    setResults([]);

    try {
      const promises = admins.map(admin => createAdmin(admin));
      const results = await Promise.all(promises);
      
      setResults(results);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast({
          title: "Administradores criados!",
          description: `${successCount} admin(s) criado(s) com sucesso. ${failCount > 0 ? `${failCount} falharam.` : ''}`,
        });
      } else {
        toast({
          title: "Erro ao criar administradores",
          description: "Nenhum administrador foi criado.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Falha ao processar requisição.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Cadastrar Administradores
          </CardTitle>
          <CardDescription>
            Criar contas de administrador para os usuários especificados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Lista de admins a serem criados */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Administradores a criar:</h3>
            {admins.map((admin, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{admin.full_name}</p>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Botão para criar */}
          <Button 
            onClick={handleCreateAdmins} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando administradores...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar {admins.length} Administradores
              </>
            )}
          </Button>

          {/* Resultados */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resultados:</h3>
              {results.map((result, index) => (
                <Alert key={index} variant={result.success ? "default" : "destructive"}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">
                        {admins[index].email} - {result.success ? "✅ Sucesso" : "❌ Falhou"}
                      </p>
                      {result.success ? (
                        <div className="text-sm">
                          <p>ID: {result.user_id}</p>
                          <p>Criado em: {new Date(result.created_at).toLocaleString()}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-600">{result.error}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Instruções de acesso */}
          {results.some(r => r.success) && (
            <Alert>
              <AlertDescription>
                <p className="font-medium mb-2">Como acessar:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Acesse <code>/admin-login</code></li>
                  <li>Use as credenciais fornecidas</li>
                  <li>Será redirecionado para <code>/admin</code></li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateMultipleAdmins;