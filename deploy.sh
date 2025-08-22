#!/bin/bash

# ============================================================================
# 🚀 MLM System Deployment Script
# Automatiza o deployment completo do sistema
# ============================================================================

set -e  # Exit on any error

echo "🚀 Iniciando deployment do MLM System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    log_info "Verificando pré-requisitos..."
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI não está instalado. Instale com: npm install -g supabase"
        exit 1
    fi
    
    # Check if user is logged in
    if ! supabase projects list &> /dev/null; then
        log_error "Você precisa fazer login no Supabase primeiro: supabase login"
        exit 1
    fi
    
    log_info "Pré-requisitos verificados!"
}

setup_database() {
    log_info "Configurando banco de dados..."
    
    # Apply migrations
    log_info "Aplicando migrações..."
    supabase db push
    
    log_info "Banco de dados configurado!"
}

deploy_functions() {
    log_info "Fazendo deploy das Edge Functions..."
    
    # List of functions to deploy
    functions=(
        "process-payment"
        "asaas-webhook"
        "create-pix-payment"
        "manage-credits"
        "mlm-group-manager"
        "send-notification-email"
    )
    
    for func in "${functions[@]}"; do
        if [ -d "supabase/functions/$func" ]; then
            log_info "Deploy: $func"
            supabase functions deploy $func
        else
            log_warning "Função $func não encontrada, pulando..."
        fi
    done
    
    log_info "Edge Functions deployadas!"
}

configure_secrets() {
    log_info "Configurando secrets..."
    
    # Check if secrets are already configured
    if supabase secrets list | grep -q "ASAAS_API_KEY"; then
        log_warning "ASAAS_API_KEY já configurada"
    else
        log_warning "Configure o ASAAS_API_KEY: supabase secrets set ASAAS_API_KEY=your_key"
    fi
    
    if supabase secrets list | grep -q "SENDGRID_API_KEY"; then
        log_warning "SENDGRID_API_KEY já configurada"
    else
        log_warning "Configure o SENDGRID_API_KEY: supabase secrets set SENDGRID_API_KEY=your_key"
    fi
    
    log_info "Verifique e configure os secrets necessários!"
}

test_deployment() {
    log_info "Testando deployment..."
    
    # Get project URL
    PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    
    if [ -n "$PROJECT_URL" ]; then
        log_info "Projeto disponível em: $PROJECT_URL"
        
        # Test a simple function
        log_info "Testando função manage-credits..."
        curl -s "$PROJECT_URL/functions/v1/manage-credits" \
             -H "Content-Type: application/json" \
             -d '{"action":"balance"}' > /dev/null
        
        if [ $? -eq 0 ]; then
            log_info "Teste básico passou!"
        else
            log_warning "Teste básico falhou - verifique os logs"
        fi
    fi
}

show_post_deployment_info() {
    echo ""
    echo "🎉 Deployment concluído!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure os secrets necessários:"
    echo "   supabase secrets set ASAAS_API_KEY=your_asaas_key"
    echo "   supabase secrets set SENDGRID_API_KEY=your_sendgrid_key"
    echo ""
    echo "2. Configure o webhook no Asaas:"
    PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    echo "   URL: $PROJECT_URL/functions/v1/asaas-webhook"
    echo ""
    echo "3. Teste as funcionalidades principais"
    echo "4. Configure o domínio personalizado (opcional)"
    echo ""
    echo "📖 Para mais informações, consulte o README.md"
}

# ============================================================================
# MAIN DEPLOYMENT
# ============================================================================

main() {
    echo "============================================================================"
    echo "🚀 MLM System - Deployment Automatizado"
    echo "============================================================================"
    echo ""
    
    # Run deployment steps
    check_requirements
    setup_database
    deploy_functions
    configure_secrets
    test_deployment
    show_post_deployment_info
    
    echo ""
    log_info "Deployment concluído com sucesso! 🎉"
}

# Run main function
main "$@"