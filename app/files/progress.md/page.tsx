import { Card } from "@/components/ui/card"

export default function Progress() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">progress.md</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Progresso do Projeto: Criador de Produtos

## Funcionalidades Completas
- 🟢 [Funcionalidade 1]: [Data de conclusão]
  - [Detalhes relevantes]
- 🟢 [Funcionalidade 2]: [Data de conclusão]
  - [Detalhes relevantes]

## Pendências Prioritárias
- ⚡ [Pendência 1]: [Data prevista]
  - [Detalhes e responsável]
- [Pendência 2]: [Data prevista]
  - [Detalhes e responsável]

## Bugs Conhecidos
- 🔴 [Bug 1]: [Severidade]
  - [Descrição e passos para reproduzir]
  - [Status e responsável]
- 🟡 [Bug 2]: [Severidade]
  - [Descrição e passos para reproduzir]
  - [Status e responsável]

## Marcos Atingidos
- [Marco 1]: [Data]
  - [Descrição e métricas relevantes]
- [Marco 2]: [Data]
  - [Descrição e métricas relevantes]

## Próximos Marcos
- [Marco 3]: [Data prevista]
  - [Critérios de conclusão]
- [Marco 4]: [Data prevista]
  - [Critérios de conclusão]

## Métricas de Progresso
- [Métrica 1]: [Valor atual] / [Valor alvo]
- [Métrica 2]: [Valor atual] / [Valor alvo]

## Retrospectiva
### O que está funcionando bem
- [Item 1]
- [Item 2]

### O que pode ser melhorado
- [Item 1]
- [Item 2]`}
        </pre>
      </Card>
    </div>
  )
}
