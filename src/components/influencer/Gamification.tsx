import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Award, Zap, Crown, Star } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward: string;
}

const achievements: Achievement[] = [
  {
    id: "1",
    title: "Primeira Indicação",
    description: "Faça sua primeira indicação bem-sucedida",
    icon: Star,
    progress: 1,
    maxProgress: 1,
    completed: true,
    reward: "R$ 50 de bônus"
  },
  {
    id: "2",
    title: "Indicador Bronze",
    description: "Realize 5 indicações convertidas",
    icon: Award,
    progress: 5,
    maxProgress: 5,
    completed: true,
    reward: "R$ 200 de bônus"
  },
  {
    id: "3",
    title: "Indicador Prata",
    description: "Realize 15 indicações convertidas",
    icon: Trophy,
    progress: 12,
    maxProgress: 15,
    completed: false,
    reward: "R$ 500 de bônus"
  },
  {
    id: "4",
    title: "Indicador Ouro",
    description: "Realize 30 indicações convertidas",
    icon: Crown,
    progress: 12,
    maxProgress: 30,
    completed: false,
    reward: "R$ 1.000 de bônus"
  },
  {
    id: "5",
    title: "Streak de Conversão",
    description: "5 conversões consecutivas em uma semana",
    icon: Zap,
    progress: 3,
    maxProgress: 5,
    completed: false,
    reward: "Multiplicador 2x por 1 semana"
  }
];

interface RankingEntry {
  position: number;
  name: string;
  conversions: number;
  earnings: number;
  isCurrentUser?: boolean;
}

const weeklyRanking: RankingEntry[] = [
  { position: 1, name: "Carlos Silva", conversions: 8, earnings: 3200 },
  { position: 2, name: "Ana Costa", conversions: 6, earnings: 2400 },
  { position: 3, name: "Amanda Ferreira", conversions: 5, earnings: 2000, isCurrentUser: true },
  { position: 4, name: "João Santos", conversions: 4, earnings: 1600 },
  { position: 5, name: "Maria Oliveira", conversions: 3, earnings: 1200 },
];

export const Gamification = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week");
  
  const currentUserRank = weeklyRanking.find(entry => entry.isCurrentUser);
  const completedAchievements = achievements.filter(a => a.completed).length;
  const totalEarnings = 8500; // Mock data
  const currentLevel = Math.floor(totalEarnings / 1000) + 1;
  const nextLevelProgress = (totalEarnings % 1000) / 1000 * 100;

  return (
    <div className="space-y-6">
      {/* Level and Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Seu Nível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">Nível {currentLevel}</h3>
              <p className="text-muted-foreground">Indicador Experiente</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Próximo nível</div>
              <div className="font-medium">
                R$ {(Math.ceil(totalEarnings / 1000) * 1000).toLocaleString()}
              </div>
            </div>
          </div>
          <Progress value={nextLevelProgress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            Faltam R$ {((Math.ceil(totalEarnings / 1000) * 1000) - totalEarnings).toLocaleString()} para o próximo nível
          </p>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Conquistas
            </span>
            <Badge variant="secondary">
              {completedAchievements}/{achievements.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.map((achievement) => {
              const IconComponent = achievement.icon;
              const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
              
              return (
                <div 
                  key={achievement.id} 
                  className={`p-4 border rounded-lg ${
                    achievement.completed ? "bg-green-50 border-green-200" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      achievement.completed ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        achievement.completed ? "text-green-600" : "text-gray-400"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{achievement.title}</h4>
                        {achievement.completed && (
                          <Badge className="bg-green-100 text-green-800">
                            Completo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      {!achievement.completed && (
                        <div className="space-y-1">
                          <Progress value={progressPercentage} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {achievement.progress}/{achievement.maxProgress}
                          </div>
                        </div>
                      )}
                      <div className="text-sm font-medium text-ap-orange mt-2">
                        🎁 {achievement.reward}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Ranking Semanal
            </span>
            <div className="flex gap-2">
              <Button 
                variant={selectedPeriod === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("week")}
              >
                Semana
              </Button>
              <Button 
                variant={selectedPeriod === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("month")}
              >
                Mês
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentUserRank && (
            <div className="mb-6 p-4 bg-ap-orange/10 border border-ap-orange/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Sua Posição</div>
                  <div className="text-sm text-muted-foreground">
                    {currentUserRank.conversions} conversões esta semana
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-ap-orange">
                    #{currentUserRank.position}
                  </div>
                  <div className="text-sm font-medium">
                    R$ {currentUserRank.earnings.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {weeklyRanking.map((entry) => (
              <div 
                key={entry.position}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  entry.isCurrentUser ? "bg-ap-orange/10 border border-ap-orange/20" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    entry.position === 1 ? "bg-yellow-100 text-yellow-800" :
                    entry.position === 2 ? "bg-gray-100 text-gray-800" :
                    entry.position === 3 ? "bg-orange-100 text-orange-800" :
                    "bg-gray-50 text-gray-600"
                  }`}>
                    {entry.position}
                  </div>
                  <div>
                    <div className="font-medium">{entry.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.conversions} conversões
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    R$ {entry.earnings.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};