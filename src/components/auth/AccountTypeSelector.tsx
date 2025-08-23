import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Briefcase, Megaphone } from 'lucide-react';

interface AccountTypeSelectorProps {
  selectedType: 'user' | 'professional' | 'influencer' | null;
  onSelect: (type: 'user' | 'professional' | 'influencer') => void;
}

export const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({ 
  selectedType, 
  onSelect 
}) => {
  const accountTypes = [
    {
      type: 'user' as const,
      title: 'Usuário',
      description: 'Acesso aos serviços e planos disponíveis',
      icon: User,
      color: 'from-blue-500 to-blue-600'
    },
    {
      type: 'professional' as const,
      title: 'Profissional',
      description: 'Ofereça seus serviços e ganhe comissões',
      icon: Briefcase,
      color: 'from-green-500 to-green-600'
    },
    {
      type: 'influencer' as const,
      title: 'Influenciador',
      description: 'Divulgue serviços e ganhe por indicações',
      icon: Megaphone,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Escolha o tipo de conta</h2>
        <p className="text-muted-foreground mt-2">
          Selecione a opção que melhor se adequa ao seu perfil
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accountTypes.map(({ type, title, description, icon: Icon, color }) => (
          <Card 
            key={type}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedType === type 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => onSelect(type)}
          >
            <CardHeader className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${color} flex items-center justify-center mb-4`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant={selectedType === type ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(type);
                }}
              >
                {selectedType === type ? 'Selecionado' : 'Selecionar'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};