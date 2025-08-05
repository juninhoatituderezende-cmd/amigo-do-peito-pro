import { z } from "zod";

// Validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").max(100),
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100).regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone inválido"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
});

export const planCreationSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(200),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres").max(1000),
  entry_value: z.number().min(1, "Valor deve ser maior que R$ 1").max(100000),
  contemplation_value: z.number().min(1, "Valor deve ser maior que R$ 1").max(1000000),
  max_participants: z.number().min(5, "Mínimo 5 participantes").max(1000),
  cycle_duration_months: z.number().min(1, "Mínimo 1 mês").max(60),
});

export const paymentSchema = z.object({
  amount: z.number().min(1).max(1000000),
  payment_method: z.enum(["credit_card", "pix", "boleto"]),
  plan_id: z.string().uuid(),
  user_id: z.string().uuid(),
  influencer_code: z.string().optional(),
});

export const fileUploadSchema = z.object({
  file_name: z.string().min(1).max(255),
  file_size: z.number().min(1).max(100 * 1024 * 1024), // 100MB
  file_type: z.enum(["image", "document", "video"]),
  category: z.string().min(1).max(50),
});

// Sanitization functions
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[char] || char;
    })
    .trim();
}

export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  
  const digits = cpf.split('').map(el => +el);
  const rest = (count: number) => (digits.slice(0, count-1)
    .reduce((soma, el, index) => (soma + el * (count-index)), 0) * 10) % 11 % 10;
  
  return rest(10) === digits[9] && rest(11) === digits[10];
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Rate limiting helper
export function createRateLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier)!;
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    return true;
  };
}