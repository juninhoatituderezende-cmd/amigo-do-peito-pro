# 🚀 Setup de Produção - MLM System

## ✅ Checklist de Deployment

### 1. Configuração Inicial
- [ ] Projeto Supabase criado
- [ ] Conta Asaas configurada
- [ ] Edge Functions deployadas
- [ ] Banco de dados configurado

### 2. Configurar Secrets
```bash
# API Keys obrigatórias
supabase secrets set ASAAS_API_KEY="your_asaas_api_key"
supabase secrets set SENDGRID_API_KEY="your_sendgrid_key"  
supabase secrets set SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
supabase secrets set SENDGRID_FROM_NAME="MLM System"
```

### 3. Executar SQL Setup
Execute o arquivo `database_complete_setup.sql` no SQL Editor do Supabase para criar toda a estrutura do banco.

### 4. Deploy Edge Functions
```bash
supabase functions deploy process-payment
supabase functions deploy asaas-webhook  
supabase functions deploy create-pix-payment
supabase functions deploy manage-credits
supabase functions deploy mlm-group-manager
supabase functions deploy send-notification-email
```

### 5. Configurar Webhook Asaas
No painel do Asaas:
- **URL**: `https://your-project-ref.supabase.co/functions/v1/asaas-webhook`
- **Eventos selecionados**:
  - PAYMENT_RECEIVED
  - PAYMENT_CONFIRMED  
  - PAYMENT_OVERDUE
  - PAYMENT_DELETED

### 6. Testar Sistema
```bash
# Testar criação de PIX
curl -X POST https://your-project.supabase.co/functions/v1/create-pix-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "amount": 100.00,
    "description": "Teste de pagamento",
    "customerName": "João Silva",
    "customerEmail": "joao@email.com", 
    "customerCpf": "123.456.789-00"
  }'

# Testar gestão de créditos  
curl -X POST https://your-project.supabase.co/functions/v1/manage-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{"action": "balance"}'
```

## 🔧 URLs das APIs

Após deployment, as Edge Functions ficam disponíveis em:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/`

### Endpoints Principais:
- `POST /process-payment` - Processar pagamentos
- `POST /asaas-webhook` - Webhook do Asaas  
- `POST /create-pix-payment` - Criar pagamento PIX
- `POST /manage-credits` - Gerenciar créditos
- `POST /mlm-group-manager` - Gerenciar grupos MLM
- `POST /send-notification-email` - Enviar emails

## 🔍 Monitoramento

### Verificar Logs
```bash
supabase functions logs asaas-webhook --follow
supabase functions logs process-payment --follow
```

### Queries de Monitoramento
```sql
-- Vendas hoje
SELECT COUNT(*), SUM(total_amount) 
FROM marketplace_sales 
WHERE DATE(created_at) = CURRENT_DATE;

-- Grupos ativos
SELECT COUNT(*) FROM plan_groups WHERE status = 'forming';

-- Saques pendentes  
SELECT COUNT(*), SUM(amount) FROM withdrawal_requests WHERE status = 'pending';
```

## 🚨 Troubleshooting

### Webhook não funciona
1. Verificar se ASAAS_API_KEY está configurada
2. Confirmar URL do webhook no Asaas
3. Verificar logs da função: `supabase functions logs asaas-webhook`

### PIX não gera QR Code
1. Verificar credenciais Asaas
2. Confirmar se conta Asaas está ativa
3. Verificar dados do cliente (CPF válido)

### Erro de RLS
1. Verificar se usuário está autenticado
2. Confirmar políticas RLS
3. Para operações do sistema, usar service_role

## 📈 Próximos Passos

1. **Configurar domínio personalizado**
2. **Implementar backup automático**  
3. **Configurar monitoramento de uptime**
4. **Adicionar analytics detalhados**
5. **Configurar alertas por email**

---

**Sistema pronto para produção! 🎉**