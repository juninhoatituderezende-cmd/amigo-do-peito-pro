// TEMA OFICIAL: PRETO E DOURADO
// Cores padronizadas para todo o aplicativo

export const THEME_COLORS = {
  // Cores Principais
  primary: 'hsl(51 100% 50%)',        // Dourado #FFD700
  primaryForeground: 'hsl(0 0% 0%)',  // Preto sobre dourado
  
  secondary: 'hsl(0 0% 0%)',          // Preto #000000
  secondaryForeground: 'hsl(0 0% 100%)', // Branco sobre preto
  
  background: 'hsl(210 7% 7%)',       // Fundo principal - cinza escuro
  foreground: 'hsl(0 0% 100%)',       // Texto principal - branco
  
  // Cards e Elementos
  card: 'hsl(0 0% 4%)',              // Cards - preto
  cardForeground: 'hsl(0 0% 100%)',   // Texto dos cards
  
  // Estados
  muted: 'hsl(210 7% 15%)',          // Elementos secundários
  mutedForeground: 'hsl(215 16% 70%)', // Texto secundário
  
  border: 'hsl(210 7% 20%)',         // Bordas
  input: 'hsl(210 7% 20%)',          // Campos de entrada
  
  // Cores de Estado
  destructive: 'hsl(0 84% 60%)',     // Vermelho para erros
  success: 'hsl(142 76% 36%)',       // Verde para sucesso
  warning: 'hsl(43 96% 56%)',        // Amarelo para avisos
  
  // Variações do Tema
  goldPrimary: '#FFD700',
  goldLight: '#FFF8DC',
  goldDark: '#B8860B',
  blackPure: '#000000',
  blackSoft: '#121212',
  whitePure: '#FFFFFF'
} as const;

// Classes CSS padronizadas - FORÇA TEMA ESCURO
export const THEME_CLASSES = {
  // Botões
  btnPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all [&]:!bg-primary [&]:!text-primary-foreground',
  btnSecondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-primary/20 hover:border-primary/40 transition-all [&]:!bg-secondary [&]:!text-secondary-foreground',
  btnOutline: 'border border-primary/20 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all [&]:!bg-background',
  btnGhost: 'hover:bg-primary/10 hover:text-primary transition-all',
  
  // Cards
  cardDefault: 'bg-card border border-primary/20 rounded-lg shadow-lg',
  cardPremium: 'bg-card border border-primary/20 rounded-lg shadow-lg hover:border-primary/40 transition-all',
  
  // Textos
  textPrimary: 'text-foreground',
  textSecondary: 'text-muted-foreground',
  textAccent: 'text-primary',
  
  // Backgrounds - FORÇA TEMA ESCURO
  bgPrimary: 'bg-background [&]:!bg-background',
  bgCard: 'bg-card [&]:!bg-card',  
  bgMuted: 'bg-muted [&]:!bg-muted',
  
  // Layout force dark
  containerDark: 'bg-background text-foreground [&]:!bg-background [&]:!text-foreground',
  pageDark: 'min-h-screen bg-background text-foreground [&]:!bg-background [&]:!text-foreground',
  
  // Estados
  textSuccess: 'text-green-400',
  textWarning: 'text-yellow-400',
  textDanger: 'text-destructive',
  
  // Bordas
  borderDefault: 'border-border',
  borderPrimary: 'border-primary/20',
  borderAccent: 'border-primary',
  
  // Sombras
  shadowGold: 'shadow-gold',
  shadowGoldGlow: 'shadow-gold-glow',
  
  // Gradientes
  gradientDark: 'gradient-dark',
  gradientGold: 'gradient-gold',
  gradientPremium: 'gradient-premium'
} as const;

// Função para aplicar o tema globalmente
export const applyGlobalTheme = () => {
  const html = document.documentElement;
  const body = document.body;
  
  // Força tema escuro
  html.classList.add('dark');
  html.classList.remove('light');
  body.classList.add('dark');  
  body.classList.remove('light');
  
  // Força color-scheme
  html.style.colorScheme = 'dark';
  body.style.colorScheme = 'dark';
  
  // CSS customizado para forçar o tema
  const styleEl = document.getElementById('forced-dark-theme');
  if (!styleEl) {
    const style = document.createElement('style');
    style.id = 'forced-dark-theme';
    style.textContent = `
      :root { color-scheme: dark !important; }
      * { color-scheme: dark !important; }
      body { 
        background-color: hsl(210 7% 7%) !important; 
        color: hsl(0 0% 100%) !important; 
      }
      /* Força tema em todos os elementos */
      .bg-white { background-color: hsl(0 0% 4%) !important; }
      .text-black { color: hsl(0 0% 100%) !important; }
      .border-white { border-color: hsl(210 7% 20%) !important; }
    `;
    document.head.appendChild(style);
  }
};

// Utilitários para componentes
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'ativo':
    case 'approved':
    case 'aprovado':
    case 'success':
    case 'sucesso':
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    
    case 'pending':
    case 'pendente':
    case 'waiting':
    case 'aguardando':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    
    case 'inactive':
    case 'inativo':
    case 'rejected':
    case 'rejeitado':
    case 'error':
    case 'erro':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    
    case 'featured':
    case 'destaque':
    case 'premium':
      return 'text-primary bg-primary/10 border-primary/20';
    
    default:
      return 'text-muted-foreground bg-muted/50 border-border';
  }
};

export const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'text-primary bg-primary/10 border-primary/30';
    case 'professional':
    case 'profissional':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'influencer':
    case 'influenciador':
      return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'user':
    case 'usuario':
    case 'usuário':
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    default:
      return 'text-muted-foreground bg-muted/50 border-border';
  }
};