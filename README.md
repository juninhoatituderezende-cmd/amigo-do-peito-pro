# 🚀 MLM System - Sistema de Marketing Multinível

Sistema completo de MLM com marketplace, grupos de 10 pessoas, pagamentos PIX/Cartão e sistema de créditos integrado.

## 📋 Funcionalidades Principais

### 🔐 **Sistema de Usuários**
- **4 tipos**: User, Professional, Influencer, Admin
- **Autenticação** via Supabase Auth
- **Perfis personalizados** com referência
- **Códigos de indicação** únicos

### 💰 **Sistema de Pagamentos**
- **PIX e Cartão** via Asaas
- **Split automático** de pagamentos
- **Webhook** de confirmação
- **Comissões multinível**

### 👥 **Sistema MLM (Grupos de 10)**
- **Formação automática** de grupos
- **Contemplação por sorteio** 
- **Histórico de participações**
- **Notificações automáticas**

### 💳 **Sistema de Créditos**
- **Carteira digital** integrada
- **Saques via PIX**
- **Histórico de transações**
- **Conversão automática**

### 🛒 **Marketplace**
- **Produtos/serviços** dos profissionais
- **Busca e filtros**
- **Avaliações**
- **Gestão de vendas**

## 🚀 **DEPLOYMENT RÁPIDO**

### **1. Pré-requisitos**
- Conta Supabase
- Conta Asaas (pagamentos)
- Supabase CLI instalado

### **2. Configurar Banco**
No SQL Editor do Supabase, execute o arquivo:
```
database_complete_setup.sql
```

### **3. Configurar Secrets**
```bash
supabase secrets set ASAAS_API_KEY="sua_chave_asaas"
supabase secrets set SENDGRID_API_KEY="sua_chave_sendgrid"
```

### **4. Deploy Edge Functions**
```bash
# Usar o script automatizado
chmod +x deploy.sh
./deploy.sh
```

### **5. Configurar Webhook Asaas**
- **URL**: `https://seu-projeto.supabase.co/functions/v1/asaas-webhook`
- **Eventos**: PAYMENT_RECEIVED, PAYMENT_CONFIRMED

## 🔧 **Arquitetura**

### **Frontend (React + TypeScript)**
```
src/
├── components/          # Componentes React
├── pages/              # Páginas da aplicação  
├── hooks/              # Custom hooks
└── contexts/           # Context providers
```

### **Backend (Supabase)**
```
supabase/
├── functions/          # Edge Functions
│   ├── process-payment/        
│   ├── asaas-webhook/         
│   ├── create-pix-payment/    
│   ├── manage-credits/        
│   └── mlm-group-manager/     
└── migrations/         # SQL setup
```

## 📊 **Monitoramento**

### **Logs das Functions**
```bash
supabase functions logs asaas-webhook --follow
supabase functions logs process-payment --follow
```

### **Queries Úteis**
```sql
-- Vendas hoje
SELECT COUNT(*), SUM(total_amount) FROM marketplace_sales 
WHERE DATE(created_at) = CURRENT_DATE;

-- Grupos ativos  
SELECT COUNT(*) FROM plan_groups WHERE status = 'forming';
```

## 🎯 **Como Usar**

1. **Execute** o `database_complete_setup.sql`
2. **Configure** os secrets do Asaas
3. **Deploy** das edge functions  
4. **Configure** webhook no Asaas
5. **Teste** os fluxos principais

## 📞 **Suporte**

Para dúvidas sobre o deployment, consulte:
- `setup-production.md` - Guia detalhado
- `deploy.sh` - Script automatizado
- Edge Functions já criadas e funcionais

---

**Sistema 100% pronto para produção! 🎉**

## Development

This project uses:
- **Vite** + **TypeScript** + **React** 
- **Supabase** for backend
- **Tailwind CSS** for styling
- **shadcn-ui** components

```bash
npm install
npm run dev
```
