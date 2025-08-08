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

// Enhanced input validation functions
export function validateReferralCode(code: string): boolean {
  // SECURITY: Validate referral code format
  const referralRegex = /^REF[A-F0-9]{16}$/i;
  return referralRegex.test(code) && code.length === 19;
}

export function sanitizeReferralInput(input: string): string {
  // Remove all non-alphanumeric characters except allowed ones
  return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 19);
}

export function validatePaymentAmount(amount: number): boolean {
  // SECURITY: Validate payment amounts
  return amount > 0 && amount <= 1000000 && Number.isFinite(amount);
}

// Enhanced Security Functions
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /'(\s*OR\s*'|\s*AND\s*')/gi,
    /(\s|^)(OR|AND)\s+\d+\s*=\s*\d+/gi,
    /';(\s*--|\/\*)/gi,
    /(EXEC|EXECUTE)\s*\(/gi
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

export function validateFinancialAmount(amount: number): { isValid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { isValid: false, error: 'Amount must be a positive number' };
  }
  
  if (amount < 0.01) {
    return { isValid: false, error: 'Amount must be at least R$ 0.01' };
  }
  
  if (amount > 50000) {
    return { isValid: false, error: 'Amount exceeds maximum limit of R$ 50,000' };
  }
  
  // Check for suspicious decimal precision (might indicate tampering)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Invalid amount precision' };
  }
  
  return { isValid: true };
}

export function validateSecureInput(input: string, type: 'referral' | 'email' | 'name' | 'general' = 'general'): { isValid: boolean; sanitized: string; errors: string[] } {
  const errors: string[] = [];
  let sanitized = input.trim();
  
  // Check for malicious patterns
  if (detectSQLInjection(sanitized)) {
    errors.push('Input contains potentially malicious SQL patterns');
  }
  
  if (detectXSS(sanitized)) {
    errors.push('Input contains potentially malicious script patterns');
  }
  
  // Length validation based on type
  const maxLengths = {
    referral: 16,
    email: 254,
    name: 100,
    general: 500
  };
  
  if (sanitized.length > maxLengths[type]) {
    errors.push(`Input too long (max ${maxLengths[type]} characters)`);
  }
  
  // Type-specific validation
  switch (type) {
    case 'referral':
      if (!/^[A-Z0-9]{3,16}$/.test(sanitized)) {
        errors.push('Referral code must be 3-16 alphanumeric characters');
      }
      break;
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
        errors.push('Invalid email format');
      }
      break;
    case 'name':
      if (!/^[a-zA-ZÀ-ÿ\s]{2,100}$/.test(sanitized)) {
        errors.push('Name must contain only letters and spaces');
      }
      break;
  }
  
  // Sanitize the input
  sanitized = sanitizeHtml(sanitized);
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
}

// Enhanced rate limiting with security features
export function createSecureRateLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, { times: number[]; blocked: boolean; blockUntil?: number }>();
  
  return {
    isAllowed: (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Get existing requests for this identifier
      const userRecord = requests.get(identifier) || { times: [], blocked: false };
      
      // Check if still blocked
      if (userRecord.blocked && userRecord.blockUntil && now < userRecord.blockUntil) {
        return false;
      }
      
      // Reset if block period expired
      if (userRecord.blocked && userRecord.blockUntil && now >= userRecord.blockUntil) {
        userRecord.blocked = false;
        userRecord.times = [];
      }
      
      // Filter out old requests
      const recentRequests = userRecord.times.filter(time => time > windowStart);
      
      // Check if under limit
      if (recentRequests.length >= maxRequests) {
        // Block for extended period on repeated violations
        userRecord.blocked = true;
        userRecord.blockUntil = now + (windowMs * 5); // Block for 5x the window
        requests.set(identifier, userRecord);
        return false;
      }
      
      // Add current request
      recentRequests.push(now);
      userRecord.times = recentRequests;
      requests.set(identifier, userRecord);
      
      return true;
    },
    
    blockIP: (identifier: string): void => {
      const now = Date.now();
      requests.set(identifier, {
        times: Array(maxRequests).fill(now),
        blocked: true,
        blockUntil: now + (windowMs * 10) // Extended block
      });
    },
    
    unblockIP: (identifier: string): void => {
      requests.delete(identifier);
    },
    
    getStatus: (identifier: string) => {
      const record = requests.get(identifier);
      if (!record) return { blocked: false, requests: 0 };
      
      const now = Date.now();
      const windowStart = now - windowMs;
      const recentRequests = record.times.filter(time => time > windowStart);
      
      return {
        blocked: record.blocked && record.blockUntil ? now < record.blockUntil : false,
        requests: recentRequests.length,
        maxRequests,
        timeUntilReset: record.blockUntil ? Math.max(0, record.blockUntil - now) : 0
      };
    }
  };
}