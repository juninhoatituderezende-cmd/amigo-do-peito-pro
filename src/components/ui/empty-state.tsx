import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: "default" | "minimal" | "detailed";
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = "default",
  children
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      {Icon && (
        <div className={cn(
          "rounded-full flex items-center justify-center",
          variant === "minimal" ? "w-12 h-12 bg-muted" : "w-16 h-16 bg-muted/50"
        )}>
          <Icon className={cn(
            "text-muted-foreground",
            variant === "minimal" ? "w-6 h-6" : "w-8 h-8"
          )} />
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className={cn(
          "font-semibold text-foreground",
          variant === "minimal" ? "text-sm" : "text-lg"
        )}>
          {title}
        </h3>
        
        {description && (
          <p className={cn(
            "text-muted-foreground max-w-sm",
            variant === "minimal" ? "text-xs" : "text-sm"
          )}>
            {description}
          </p>
        )}
      </div>

      {children}

      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          variant={variant === "minimal" ? "outline" : "default"}
          size={variant === "minimal" ? "sm" : "default"}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );

  if (variant === "minimal") {
    return (
      <div className={cn("py-8", className)}>
        {content}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="py-12">
        {content}
      </CardContent>
    </Card>
  );
}

// Specific empty states for common use cases
export function EmptyNotifications() {
  return (
    <EmptyState
      title="Nenhuma notificação"
      description="Você está em dia! Não há notificações pendentes no momento."
      variant="minimal"
    />
  );
}

export function EmptyTransactions() {
  return (
    <EmptyState
      title="Nenhuma transação encontrada"
      description="Não há transações para exibir com os filtros selecionados."
      variant="minimal"
    />
  );
}

export function EmptyProducts() {
  return (
    <EmptyState
      title="Nenhum produto cadastrado"
      description="Comece cadastrando seu primeiro produto para começar a vender."
      actionLabel="Cadastrar produto"
      onAction={() => console.log("Navigate to product creation")}
    />
  );
}