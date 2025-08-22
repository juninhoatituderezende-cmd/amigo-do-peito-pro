import React from 'react';
import { FieldError } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { AlertCircle, Check } from 'lucide-react';

interface FormFieldProps {
  children: React.ReactNode;
  error?: FieldError;
  success?: boolean;
  className?: string;
}

export function FormField({ children, error, success, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
      {error && <FormError message={error.message} />}
      {success && !error && <FormSuccess />}
    </div>
  );
}

interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className="flex items-center space-x-2 text-sm text-destructive">
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );
}

export function FormSuccess() {
  return (
    <div className="flex items-center space-x-2 text-sm text-green-600">
      <Check className="w-4 h-4" />
      <span>Campo válido</span>
    </div>
  );
}

// Validation utilities
export const validation = {
  required: (fieldName: string) => ({
    required: `${fieldName} é obrigatório`,
  }),
  
  email: {
    required: 'Email é obrigatório',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Email inválido'
    }
  },
  
  password: {
    required: 'Senha é obrigatória',
    minLength: {
      value: 6,
      message: 'Senha deve ter pelo menos 6 caracteres'
    }
  },
  
  phone: {
    required: 'Telefone é obrigatório',
    pattern: {
      value: /^(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})$/,
      message: 'Formato de telefone inválido'
    }
  },
  
  cpf: {
    required: 'CPF é obrigatório',
    pattern: {
      value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
      message: 'Formato de CPF inválido (000.000.000-00)'
    }
  },
  
  currency: {
    required: 'Valor é obrigatório',
    min: {
      value: 0.01,
      message: 'Valor deve ser maior que zero'
    }
  }
};