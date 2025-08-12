import { Card } from "@/components/ui/card"

export default function ProjectBrief() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">projectbrief.md</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Projeto: Criador de Produtos

## Visão Geral
[Descrição concisa do propósito e visão do projeto]

## Requisitos Centrais
- [Requisito 1]
- [Requisito 2]
- [Requisito 3]

## Escopo do Projeto
### Incluso
- [Funcionalidade/componente incluso 1]
- [Funcionalidade/componente incluso 2]

### Excluso
- [Funcionalidade/componente fora do escopo 1]
- [Funcionalidade/componente fora do escopo 2]

## Visão Estratégica
[Descrição da visão de longo prazo e objetivos estratégicos]

## Critérios de Sucesso
- [Critério mensurável 1]
- [Critério mensurável 2]
- [Critério mensurável 3]

## Stakeholders
- [Stakeholder 1 e função]
- [Stakeholder 2 e função]

## Cronograma de Alto Nível
- [Fase/Marco 1]: [Data estimada]
- [Fase/Marco 2]: [Data estimada]
- [Fase/Marco 3]: [Data estimada]`}
        </pre>
      </Card>
    </div>
  )
}
