# Contexto Técnico: Criador de Produtos

## Stack Tecnológico
### Frontend
- **Next.js**: v14.1.3 - Framework React com App Router
- **React**: v18 - Biblioteca para construção de interfaces
- **TypeScript**: v5 - Linguagem tipada para desenvolvimento
- **Tailwind CSS**: v3.3.0 - Framework CSS para estilização
- **Shadcn UI**: Componentes reutilizáveis baseados em Radix UI
- **React Hook Form**: v7.51.0 - Biblioteca para gerenciamento de formulários

### Backend
- **Next.js App Router**: Para roteamento e Server Components
- **Server Actions**: Para operações no lado do servidor
- **next-safe-action**: v6.1.0 - Biblioteca para Server Actions seguras

### Validação
- **Zod**: v3.22.4 - Biblioteca para validação e schemas

### Controle de Versão
- **Git**: Sistema de controle de versão distribuído
- **GitHub**: Plataforma de hospedagem para o repositório
- **Repositório**: https://github.com/nicolasferoli/criador-de-produto

### Utilitários
- **clsx/tailwind-merge**: Para composição de classes CSS
- **next-themes**: v0.2.1 - Para suporte a temas claro/escuro
- **Lucide React**: v0.358.0 - Biblioteca de ícones

## Configurações de Ambiente
### Desenvolvimento
- Node.js v18+ recomendado
- npm/yarn/pnpm para gerenciamento de pacotes
- Ambiente de desenvolvimento local com hot-reloading

### Produção
- Hospedagem Vercel recomendada para deploy
- Variáveis de ambiente para configuração
- Otimizações de build para produção

## Dependências Críticas
- **next-safe-action**: v6.1.0 - Para Server Actions tipadas e seguras
- **@hookform/resolvers**: v3.3.4 - Para integração do Zod com React Hook Form
- **Radix UI components**: Para componentes acessíveis e interativos

## Limitações Técnicas
- **Server Actions**: Ainda em evolução no ecossistema Next.js
- **Persistência de Dados**: Fase atual usa dados simulados, pendente integração com banco de dados
- **SEO**: Otimização limitada sem metadados dinâmicos

## Segurança
- **Validação Cliente/Servidor**: Validação em ambas as camadas
- **Server Actions Seguras**: Proteção contra ataques CSRF
- **Input Sanitization**: Através do Zod

## Monitoramento e Logging
- **Console Logging**: Para desenvolvimento
- **Vercel Analytics**: Quando hospedado na Vercel (pendente implementação)

## Fluxo de Desenvolvimento
- **Branches**: Desenvolvimento em feature branches
- **Commits**: Mensagens de commit seguindo padrão convencional
- **Releases**: Tags para marcar versões estáveis
