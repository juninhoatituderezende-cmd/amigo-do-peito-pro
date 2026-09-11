# Segurança — ações imediatas

Arquivos `.env` e chaves SSH estavam versionados neste repositório público.

## Você precisa fazer agora (mesmo depois deste PR)

1. Rotacionar chaves do Supabase (anon e service role).
2. Rotacionar chave Asaas e secret do webhook.
3. Rotacionar SendGrid, se usada.
4. Revogar a chave SSH que estava em `.ssh/id_ed25519` e gerar outra.
5. Considerar tornar o repositório privado.

Este PR remove os arquivos do *tip* da branch. O histórico antigo ainda pode conter os secrets — por isso a rotação é obrigatória.
