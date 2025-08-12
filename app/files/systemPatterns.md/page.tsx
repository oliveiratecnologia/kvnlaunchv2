import { Card } from "@/components/ui/card"

export default function SystemPatterns() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">systemPatterns.md</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Padrões de Sistema: Criador de Produtos

## Arquitetura Geral
[Descrição da arquitetura geral do sistema]

## Padrões de Design
- [Padrão 1]: [Descrição e aplicação]
- [Padrão 2]: [Descrição e aplicação]
- [Padrão 3]: [Descrição e aplicação]

## Estrutura do Sistema
\`\`\`mermaid
flowchart TD
    A[Componente A] --> B[Componente B]
    A --> C[Componente C]
    B --> D[Componente D]
    C --> D
\`\`\`

## Fluxos de Dados
\`\`\`mermaid
flowchart LR
    User[Usuário] --> FE[Frontend]
    FE --> API[API]
    API --> DB[Banco de Dados]
    API --> S3[Armazenamento]
\`\`\`

## Decisões Arquitetônicas
### [Decisão 1]
- **Contexto**: [Descrição do contexto]
- **Decisão**: [Descrição da decisão]
- **Status**: [Proposto/Aceito/Rejeitado/Substituído]
- **Consequências**: [Impactos positivos e negativos]

### [Decisão 2]
- **Contexto**: [Descrição do contexto]
- **Decisão**: [Descrição da decisão]
- **Status**: [Proposto/Aceito/Rejeitado/Substituído]
- **Consequências**: [Impactos positivos e negativos]

## Componentes Principais
### [Componente 1]
- **Responsabilidade**: [Descrição]
- **Interfaces**: [APIs/Interfaces expostas]
- **Dependências**: [Outros componentes/serviços]

### [Componente 2]
- **Responsabilidade**: [Descrição]
- **Interfaces**: [APIs/Interfaces expostas]
- **Dependências**: [Outros componentes/serviços]`}
        </pre>
      </Card>
    </div>
  )
}
