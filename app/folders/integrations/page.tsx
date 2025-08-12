import { Card } from "@/components/ui/card"

export default function Integrations() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Diretório: /integrations/</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Integrações do Criador de Produtos

Este diretório contém documentação detalhada sobre todas as integrações externas utilizadas no projeto.

## Integrações Ativas
- [API Name 1](/integrations/api-name-1/overview.md) - [Breve descrição]
- [API Name 2](/integrations/api-name-2/overview.md) - [Breve descrição]

## Processo de Integração
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

## Políticas de Segurança para Integrações
- [Política 1]
- [Política 2]
- [Política 3]

## Monitoramento de Integrações
[Descrição da abordagem de monitoramento]`}
        </pre>
      </Card>
    </div>
  )
}
