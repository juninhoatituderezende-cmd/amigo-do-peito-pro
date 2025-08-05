# 🚀 Guia de Configuração - MLM System

## 📋 Pré-requisitos

- Node.js 18+ 
- NPM ou Yarn
- Conta no Supabase
- Conta no Stripe (opcional, para pagamentos)
- Conta no SendGrid (opcional, para emails)

## ⚡ Configuração Rápida

### 1. Clone e Instale
```bash
git clone [repository-url]
cd mlm-system
npm install
```

### 2. Configure o Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com seus valores reais
nano .env  # ou use seu editor preferido
```

### 3. Configure o Supabase

#### 3.1 Crie um novo projeto no Supabase:
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova organização e projeto
3. Anote a URL e chave pública do projeto

#### 3.2 Configure as variáveis:
```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui
```

#### 3.3 Execute as migrações SQL:
```bash
# Execute cada arquivo .sql na ordem:
# 1. database_setup.sql
# 2. database_mlm_setup.sql  
# 3. database_payment_integration.sql
# 4. database_monitoring_setup.sql
# 5. database_performance_optimization.sql
```

### 4. Configure Stripe (Opcional)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 5. Inicie o Servidor
```bash
npm run dev
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais:
- `profiles` - Perfis de usuários
- `custom_plans` - Planos de contemplação
- `plan_participants` - Participantes dos planos
- `payments` - Histórico de pagamentos
- `commissions` - Comissões de influenciadores
- `activity_logs` - Logs de atividade
- `error_logs` - Logs de erro

### RLS (Row Level Security):
✅ Todas as tabelas têm RLS habilitado
✅ Policies configuradas por role (admin, professional, influencer, user)

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build

# Banco de dados
npm run db:reset     # Reseta banco (desenvolvimento)
npm run db:seed      # Adiciona dados de teste
npm run db:backup    # Backup do banco

# Qualidade
npm run lint         # Verifica código
npm run type-check   # Verifica tipos TypeScript
npm run test         # Executa testes
```

## 🧪 Dados de Teste

Para facilitar o desenvolvimento, execute:
```bash
npm run db:seed
```

Isso criará:
- 3 usuários de cada tipo (admin, professional, influencer, user)
- 5 planos de exemplo
- Dados de comissão e pagamentos simulados

### Usuários de Teste:
- **Admin**: admin@test.com / senha: 123456
- **Professional**: pro@test.com / senha: 123456  
- **Influencer**: influencer@test.com / senha: 123456
- **User**: user@test.com / senha: 123456

## 🔒 Configuração de Segurança

### Supabase RLS:
- Habilite RLS em todas as tabelas
- Configure policies por role
- Use service_role key apenas em Edge Functions

### Stripe:
- Use chaves de teste durante desenvolvimento
- Configure webhooks para produção
- Valide todos os pagamentos server-side

### SendGrid:
- Configure sender authentication
- Use templates para emails transacionais
- Implemente rate limiting

## 🚀 Deploy em Produção

### Variáveis de Produção:
```bash
NODE_ENV=production
VITE_SUPABASE_URL=https://seu-projeto-prod.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_prod
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG.sua_chave_prod...
```

### Checklist de Deploy:
- [ ] Banco configurado com dados reais
- [ ] RLS policies testadas
- [ ] Stripe em modo live
- [ ] SendGrid configurado
- [ ] Domínio personalizado
- [ ] SSL configurado
- [ ] Monitoring ativo

## 🛠️ Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo .env existe
- Confirme que as variáveis estão corretas
- Reinicie o servidor após mudanças

### Erro: "Authentication failed"
- Verifique se o projeto Supabase está ativo
- Confirme que a chave pública está correta
- Verifique se RLS está configurado

### Erro: "Database connection failed"
- Verifique se as migrações foram executadas
- Confirme que as tabelas foram criadas
- Verifique as policies RLS

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console do navegador
2. Consulte a documentação do Supabase
3. Verifique os Edge Functions logs
4. Abra uma issue no repositório

---

**Última atualização:** Dezembro 2024
**Versão:** 1.0.0