# 🚀 Sistema de Cadastro de Cliente - Configuração

## 📋 O que foi implementado

Agora, antes de criar um funil, os usuários precisam se cadastrar fornecendo:

1. **Nome completo**
2. **E-mail**
3. **Telefone** 
4. **Instagram**
5. **Como monetizam atualmente a audiência**

## 🛠️ Arquivos criados/modificados

### Novos arquivos:
- `components/cliente-cadastro-modal.tsx` - Modal de cadastro
- `types/cliente.ts` - Tipos TypeScript para cliente
- `app/api/clientes/route.ts` - API para salvar dados do cliente
- `migration/clients-table.sql` - Script para criar tabela no banco

### Arquivos modificados:
- `app/page.tsx` - Landing page agora abre modal ao invés de navegar diretamente

## 🗄️ Configuração do Banco de Dados

### 1. Executar script SQL

No painel do Supabase, vá em **SQL Editor** e execute o arquivo:
```sql
migration/clients-table.sql
```

Este script irá:
- Criar a tabela `clientes`
- Configurar índices para performance
- Configurar políticas de segurança RLS
- Criar triggers para timestamps automáticos

### 2. Verificar criação da tabela

Após executar o script, verifique se apareceu a mensagem:
```
Tabela clientes criada com sucesso!
```

## 📊 Estrutura da Tabela `clientes`

```sql
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    nome_completo TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT NOT NULL,
    instagram TEXT NOT NULL,
    monetizacao TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    funis_criados INTEGER DEFAULT 0,
    ultimo_acesso TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔄 Fluxo do Usuario

1. **Landing Page**: Usuário clica em "Começar agora" ou "Criar meu funil agora"
2. **Modal de Cadastro**: Popup aparece solicitando os dados
3. **Validação**: Sistema valida e-mail, campos obrigatórios, etc.
4. **Salvamento**: Dados são salvos na tabela `clientes`
5. **Redirecionamento**: Usuário é redirecionado para `/criar/nicho`
6. **ID do Cliente**: O ID é armazenado no `sessionStorage` para uso durante a criação

## 🔧 Como funciona tecnicamente

### Modal de Cadastro
- Componente React com validação em tempo real
- Validação de e-mail, campos obrigatórios
- Loading states e feedback de erro
- Design responsivo e acessível

### API de Clientes
- **POST /api/clientes**: Cria novo cliente
- **GET /api/clientes?email=xxx**: Busca cliente por e-mail
- Validação server-side
- Tratamento de e-mails duplicados
- Normalização de dados (trim, lowercase para e-mail)

### Integração com Supabase
- Usa o cliente configurado em `lib/supabaseClient.ts`
- Políticas RLS configuradas para segurança
- Triggers automáticos para timestamps

## 🔒 Segurança

- **RLS habilitado**: Row Level Security ativo na tabela
- **Validação dupla**: Client-side e server-side
- **E-mails únicos**: Constraint de unicidade no banco
- **Sanitização**: Dados são tratados (trim, lowercase)

## 📱 Experiência do Usuário

### Validações no Front-end:
- Todos os campos obrigatórios
- Formato de e-mail válido
- Feedback visual imediato
- Estados de loading

### Tratamento de Erros:
- E-mail duplicado: mensagem amigável
- Erro de conexão: retry automático
- Campos inválidos: highlight nos campos

## 🚀 Próximos Passos (Opcional)

### 1. Conectar dados do cliente com funis
Para conectar os dados do cliente aos funis criados, você pode:

```typescript
// Em qualquer página do processo de criação
const clienteId = sessionStorage.getItem('clienteId')

// Usar o clienteId para associar o funil ao cliente
```

### 2. Dashboard do cliente
Criar uma página onde o cliente pode:
- Ver seus funis criados
- Editar informações pessoais
- Histórico de criações

### 3. Remarketing
Com o e-mail capturado, você pode:
- Enviar e-mails de follow-up
- Criar campanhas de remarketing
- Análise de conversão

## 🐛 Troubleshooting

### Erro: "Tabela não existe"
- Execute o script `migration/clients-table.sql` no Supabase
- Verifique se as credenciais do Supabase estão corretas no `.env.local`

### Erro: "E-mail duplicado"
- É um comportamento esperado
- O sistema mostra mensagem amigável para o usuário

### Modal não abre
- Verifique se os imports estão corretos
- Certifique-se que o componente está sendo renderizado

### Erro de CORS
- Verifique se o domínio está configurado no painel do Supabase
- Para desenvolvimento local: `http://localhost:3000`

## ✅ Teste da Implementação

1. Acesse a landing page
2. Clique em "Começar agora"
3. Preencha o formulário de cadastro
4. Verifique se foi redirecionado para `/criar/nicho`
5. Confira no painel do Supabase se os dados foram salvos

---

🎉 **Sistema implementado com sucesso!** 

O usuário agora precisa se cadastrar antes de criar um funil, permitindo uma experiência mais personalizada e captura de leads qualificados.
