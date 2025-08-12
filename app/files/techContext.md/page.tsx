import { Card } from "@/components/ui/card"

export default function TechContext() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">techContext.md</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Contexto Técnico: Criador de Produtos

## Stack Tecnológico
### Frontend
- [Tecnologia 1]: [Versão e propósito]
- [Tecnologia 2]: [Versão e propósito]

### Backend
- [Tecnologia 1]: [Versão e propósito]
- [Tecnologia 2]: [Versão e propósito]

### Banco de Dados
- [Tecnologia]: [Versão e propósito]

### Infraestrutura
- [Tecnologia/Serviço]: [Propósito]

## Configurações de Ambiente
### Desenvolvimento
- [Requisito 1]
- [Requisito 2]

### Produção
- [Requisito 1]
- [Requisito 2]

## Dependências Críticas
- [Dependência 1]: [Versão e propósito]
- [Dependência 2]: [Versão e propósito]

## Limitações Técnicas
- [Limitação 1]: [Descrição e impacto]
- [Limitação 2]: [Descrição e impacto]

## Segurança
- [Prática de segurança 1]: [Descrição]
- [Prática de segurança 2]: [Descrição]

## Monitoramento e Logging
- [Ferramenta/Abordagem 1]: [Descrição]
- [Ferramenta/Abordagem 2]: [Descrição]`}
        </pre>
      </Card>
    </div>
  )
}
