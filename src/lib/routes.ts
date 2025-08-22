// Constantes para rotas do sistema
export const ROUTES = {
  // Public routes
  HOME: '/',
  ABOUT: '/sobre',
  
  // Auth routes
  ADMIN_LOGIN: '/admin-login',
  USER_LOGIN: '/usuario/login',
  USER_REGISTER: '/usuario/cadastro',
  PROFESSIONAL_LOGIN: '/profissional/login',
  INFLUENCER_LOGIN: '/influenciador/login',
  INFLUENCER_REGISTER: '/influenciador/cadastro',
  
  // Dashboard routes by role
  ADMIN_DASHBOARD: '/admin',
  USER_DASHBOARD: '/usuario/dashboard',
  PROFESSIONAL_DASHBOARD: '/profissional/dashboard',
  INFLUENCER_DASHBOARD: '/influenciador/dashboard',
  
  // User routes
  USER_MARKETPLACE: '/usuario/marketplace',
  USER_WITHDRAWALS: '/usuario/saques',
  USER_NOTIFICATIONS: '/usuario/notificacoes',
  USER_HISTORY: '/usuario/historico',
  
  // Professional routes
  PROFESSIONAL_PROFILE: '/profissional/perfil',
  PROFESSIONAL_SCHEDULE: '/profissional/agenda',
  PROFESSIONAL_FINANCES: '/profissional/financeiro',
  PROFESSIONAL_SERVICES: '/profissional/servicos',
  
  // Influencer routes
  INFLUENCER_TOOLS: '/influenciador/ferramentas',
  
  // Admin routes
  ADMIN_USERS: '/admin/usuarios',
  ADMIN_PLANS: '/admin/planos',
  ADMIN_PAYMENTS: '/admin/pagamentos',
  ADMIN_MLM: '/admin/mlm',
  ADMIN_NOTIFICATIONS: '/admin/notificacoes',
  
  // MLM routes
  MLM_PRODUCTS: '/mlm/products',
  MLM_DASHBOARD: '/mlm/dashboard',
  MLM_SUCCESS: '/mlm/success',
  MLM_CANCEL: '/mlm/cancel',
  
  // Other routes
  MARKETPLACE: '/marketplace',
  CONFIRMATION: '/confirmacao',
  NOT_FOUND: '/404'
} as const;

// Helper function to get dashboard route by role
export const getDashboardRoute = (role: string | null): string => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN_DASHBOARD;
    case 'professional':
      return ROUTES.PROFESSIONAL_DASHBOARD;
    case 'influencer':
      return ROUTES.INFLUENCER_DASHBOARD;
    case 'user':
    default:
      return ROUTES.USER_DASHBOARD;
  }
};

// Helper function to get login route by role
export const getLoginRoute = (role: string | null): string => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN_LOGIN;
    case 'professional':
      return ROUTES.PROFESSIONAL_LOGIN;
    case 'influencer':
      return ROUTES.INFLUENCER_LOGIN;
    case 'user':
    default:
      return ROUTES.USER_LOGIN;
  }
};

// Helper function to check if user should be redirected from current path
export const shouldRedirectUser = (currentPath: string, userRole: string | null): boolean => {
  const publicPaths = [
    ROUTES.HOME,
    ROUTES.ABOUT,
    ROUTES.MARKETPLACE,
    ROUTES.CONFIRMATION,
    ROUTES.MLM_PRODUCTS,
    ROUTES.MLM_SUCCESS,
    ROUTES.MLM_CANCEL
  ];
  
  const authPaths = [
    ROUTES.ADMIN_LOGIN,
    ROUTES.USER_LOGIN,
    ROUTES.USER_REGISTER,
    ROUTES.PROFESSIONAL_LOGIN,
    ROUTES.INFLUENCER_LOGIN,
    ROUTES.INFLUENCER_REGISTER
  ];
  
  // Don't redirect on public paths
  if (publicPaths.some(path => path === currentPath)) {
    return false;
  }
  
  // Redirect authenticated users away from auth pages
  if (userRole && authPaths.some(path => path === currentPath)) {
    return true;
  }
  
  // Check if user is on wrong dashboard
  const expectedDashboard = getDashboardRoute(userRole);
  const dashboardPaths = [
    ROUTES.ADMIN_DASHBOARD,
    ROUTES.USER_DASHBOARD,
    ROUTES.PROFESSIONAL_DASHBOARD,
    ROUTES.INFLUENCER_DASHBOARD
  ];
  
  // If user is on a dashboard path but not their own, redirect
  if (dashboardPaths.some(path => path === currentPath) && currentPath !== expectedDashboard) {
    return true;
  }
  
  return false;
};
