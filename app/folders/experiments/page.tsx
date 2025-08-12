import { Card } from "@/components/ui/card"

export default function Experiments() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Diretório: /experiments/</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Experimentos do Criador de Produtos

Este diretório documenta experimentos realizados durante o desenvolvimento do projeto.

## Experimentos Ativos
- [Experimento 1](/experiments/experiment-1/hypothesis.md) - [Status] - [Breve descrição]
- [Experimento 2](/experiments/experiment-2/hypothesis.md) - [Status] - [Breve descrição]

## Experimentos Concluídos
- [Experimento 3](/experiments/experiment-3/conclusion.md) - [Resultado] - [Breve descrição]
- [Experimento 4](/experiments/experiment-4/conclusion.md) - [Resultado] - [Breve descrição]

## Metodologia de Experimentação
[Descrição da abordagem para conduzir experimentos]

## Métricas de Avaliação
- [Métrica 1]
- [Métrica 2]
- [Métrica 3]`}
        </pre>
      </Card>
    </div>
  )
}
