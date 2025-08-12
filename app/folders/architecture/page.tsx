import { Card } from "@/components/ui/card"

export default function Architecture() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Diretório: /architecture/</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Arquitetura do Criador de Produtos

Este diretório contém documentação detalhada sobre a arquitetura do sistema.

## Visão Geral
[Breve descrição da arquitetura geral]

## Documentos Principais
- [Visão Geral do Sistema](/architecture/system-overview.md)
- [Diagrama de Componentes](/architecture/component-diagram.md)
- [Modelo de Dados](/architecture/data-model.md)
- [Arquitetura de Segurança](/architecture/security-architecture.md)
- [Estratégias de Escalabilidade](/architecture/scalability.md)

## Componentes
- [Componente 1](/architecture/components/component-1.md)
- [Componente 2](/architecture/components/component-2.md)

## Princípios Arquiteturais
- [Princípio 1]
- [Princípio 2]
- [Princípio 3]

## Evolução da Arquitetura
[Descrição de como a arquitetura evoluiu e planos futuros]`}
        </pre>
      </Card>
    </div>
  )
}
