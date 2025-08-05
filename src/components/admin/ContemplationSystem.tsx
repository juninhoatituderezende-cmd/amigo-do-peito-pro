import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shuffle, User, Calendar, DollarSign, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  amountPaid: number;
  paymentStatus: "paid" | "pending";
}

const mockMembers: Member[] = [
  {
    id: "1",
    name: "Maria Silva",
    email: "maria@email.com",
    joinDate: "2024-01-15",
    amountPaid: 400,
    paymentStatus: "paid"
  },
  {
    id: "2",
    name: "João Santos", 
    email: "joao@email.com",
    joinDate: "2024-01-16",
    amountPaid: 400,
    paymentStatus: "paid"
  },
  {
    id: "3",
    name: "Ana Costa",
    email: "ana@email.com", 
    joinDate: "2024-01-17",
    amountPaid: 400,
    paymentStatus: "pending"
  }
];

interface ContemplationSystemProps {
  groupId: string;
  groupName: string;
}

export const ContemplationSystem = ({ groupId, groupName }: ContemplationSystemProps) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [manualSelection, setManualSelection] = useState("");
  const { toast } = useToast();

  const eligibleMembers = mockMembers.filter(m => m.paymentStatus === "paid");

  const handleRandomDraw = () => {
    if (eligibleMembers.length === 0) {
      toast({
        title: "Erro",
        description: "Não há membros elegíveis para o sorteio.",
        variant: "destructive"
      });
      return;
    }

    const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
    const winner = eligibleMembers[randomIndex];
    setSelectedMember(winner);
    
    toast({
      title: "Contemplado sorteado!",
      description: `${winner.name} foi sorteado(a) para o grupo ${groupName}.`,
    });
  };

  const handleManualSelection = () => {
    const member = mockMembers.find(m => 
      m.name.toLowerCase().includes(manualSelection.toLowerCase()) ||
      m.email.toLowerCase().includes(manualSelection.toLowerCase())
    );
    
    if (!member) {
      toast({
        title: "Membro não encontrado",
        description: "Verifique o nome ou email informado.",
        variant: "destructive"
      });
      return;
    }

    if (member.paymentStatus !== "paid") {
      toast({
        title: "Pagamento pendente",
        description: "Este membro ainda não confirmou o pagamento.",
        variant: "destructive"
      });
      return;
    }

    setSelectedMember(member);
    toast({
      title: "Contemplado selecionado!",
      description: `${member.name} foi selecionado(a) manualmente.`,
    });
  };

  const confirmContemplation = () => {
    if (!selectedMember) return;
    
    // Aqui seria enviado para o backend
    toast({
      title: "Contemplação confirmada!",
      description: `${selectedMember.name} foi oficialmente contemplado(a).`,
    });
    
    setSelectedMember(null);
    setManualSelection("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Sistema de Contemplação - {groupName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sorteio Automático */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Sorteio Automático</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {eligibleMembers.length} membros elegíveis para sorteio
            </p>
            <Button 
              onClick={handleRandomDraw}
              disabled={eligibleMembers.length === 0}
              className="bg-ap-orange hover:bg-ap-orange/90"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Sortear Contemplado
            </Button>
          </div>

          {/* Seleção Manual */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Seleção Manual</h3>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Nome ou email do membro"
                value={manualSelection}
                onChange={(e) => setManualSelection(e.target.value)}
              />
              <Button 
                onClick={handleManualSelection}
                variant="outline"
                disabled={!manualSelection.trim()}
              >
                Selecionar
              </Button>
            </div>
          </div>

          {/* Membro Selecionado */}
          {selectedMember && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-green-800">Contemplado Selecionado</h3>
                <Badge className="bg-green-100 text-green-800">
                  Selecionado
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{selectedMember.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{selectedMember.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Entrou em {selectedMember.joinDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>R$ {selectedMember.amountPaid.toLocaleString()} pagos</span>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                    Confirmar Contemplação
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Contemplação</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja confirmar {selectedMember.name} como contemplado(a) 
                      do grupo {groupName}? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmContemplation}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Membros */}
      <Card>
        <CardHeader>
          <CardTitle>Membros do Grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">R$ {member.amountPaid.toLocaleString()}</span>
                  <Badge 
                    variant="secondary"
                    className={member.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                  >
                    {member.paymentStatus === "paid" ? "Pago" : "Pendente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};