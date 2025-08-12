# Criador de Produtos

Uma plataforma web moderna para gerenciamento de catálogos de produtos, desenvolvida com Next.js, TypeScript e Tailwind CSS.

## 📋 Sobre o Projeto

O Criador de Produtos é uma aplicação web que permite aos usuários criar, gerenciar e visualizar produtos de forma organizada e eficiente. Projetada especialmente para pequenas e médias empresas que buscam uma solução simples e intuitiva para gerenciar seus catálogos de produtos.

### 🎯 Principais Problemas Solucionados

- Dificuldade em manter um catálogo organizado de produtos
- Tempo excessivo gasto na criação e atualização manual de informações
- Inconsistência de dados quando gerenciados em planilhas ou sistemas desconectados
- Falta de uma interface amigável para usuários não técnicos

## ✨ Funcionalidades

- Criação e edição de produtos com múltiplos atributos
- Visualização de produtos em lista com opções de filtragem
- Interface responsiva para desktop e dispositivos móveis
- Validação robusta de formulários com feedback visual
- Temas claro/escuro
- Operações CRUD via Server Actions

## 🛠️ Tecnologias

- **Frontend**:
  - Next.js 14 (App Router)
  - React 18
  - TypeScript 5
  - Tailwind CSS 3.3
  - Shadcn UI (componentes baseados em Radix UI)

- **Validação e Formulários**:
  - React Hook Form
  - Zod

- **Backend**:
  - Next.js Server Components
  - Server Actions
  - next-safe-action

## 🚀 Instalação

```bash
# Clone o repositório
git clone https://github.com/nicolasferoli/criador-de-produto.git

# Entre no diretório
cd criador-de-produto

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📊 Status do Projeto

### Funcionalidades Completas
- ✅ Estrutura base do projeto
- ✅ Interface principal
- ✅ Validação de formulários
- ✅ Server Actions para CRUD (com dados simulados)
- ✅ Controle de versão com GitHub

### Em Desenvolvimento
- ⏳ Integração com banco de dados (Supabase)
- ⏳ Autenticação de usuários
- ⏳ Upload de imagens para produtos

## 🗂️ Estrutura do Projeto

```
├── app/
│   ├── api/
│   ├── criar/
│   └── page.tsx
├── components/
│   ├── ui/
│   └── produtos/
├── lib/
│   ├── schemas/
│   ├── actions/
│   └── utils/
└── public/
```

## 📝 Roadmap

- **Fase 1** ✅ Estruturação (Concluído em 12/04/2024)
- **Fase 2** ⏳ Core Features (Em andamento)
- **Fase 3** 🔜 Persistência (Previsto para 15/04/2024)
- **Fase 4** 🔜 Refinamento (Previsto para 16/04/2024)

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE). 
