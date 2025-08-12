import { Card } from "@/components/ui/card"

export default function UserResearch() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Diretório: /user-research/</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Pesquisa de Usuário do Criador de Produtos

Este diretório contém documentação sobre pesquisas de usuário, entrevistas, testes de usabilidade e insights.

## Pesquisas Recentes
- [Entrevista 1](/user-research/interviews/interview-1.md) - [Data] - [Foco]
- [Pesquisa 1](/user-research/surveys/survey-1.md) - [Data] - [Foco]
- [Teste de Usabilidade 1](/user-research/usability-tests/test-1.md) - [Data] - [Foco]

## Principais Insights
[Resumo dos principais insights obtidos das pesquisas]

## Personas
- [Persona 1] - [Breve descrição]
- [Persona 2] - [Breve descrição]

## Metodologia
[Breve descrição da metodologia de pesquisa]

## Próximas Pesquisas Planejadas
- [Pesquisa planejada 1] - [Data prevista]
- [Pesquisa planejada 2] - [Data prevista]`}
        </pre>
      </Card>
    </div>
  )
}
