/**
 * Utilitário para validação e formatação de CPF
 */

export const formatCpf = (value: string): string => {
  // Remove caracteres não numéricos
  let cleanValue = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  if (cleanValue.length > 11) {
    cleanValue = cleanValue.substring(0, 11);
  }
  
  // Aplica formatação
  if (cleanValue.length <= 11) {
    cleanValue = cleanValue.replace(/(\d{3})(\d)/, '$1.$2');
    cleanValue = cleanValue.replace(/(\d{3})(\d)/, '$1.$2');
    cleanValue = cleanValue.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  
  return cleanValue;
};

export const validateCpf = (cpf: string): boolean => {
  // Remove formatação
  const cleanCpf = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCpf.length !== 11) return false;
  
  // Verifica se não são todos números iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  // Validação do algoritmo do CPF
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i);
  }
  let checkDigit1 = 11 - (sum % 11);
  if (checkDigit1 > 9) checkDigit1 = 0;
  
  if (parseInt(cleanCpf[9]) !== checkDigit1) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i);
  }
  let checkDigit2 = 11 - (sum % 11);
  if (checkDigit2 > 9) checkDigit2 = 0;
  
  return parseInt(cleanCpf[10]) === checkDigit2;
};

export const cleanCpf = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};