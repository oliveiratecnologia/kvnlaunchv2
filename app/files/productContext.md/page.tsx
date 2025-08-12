import { Card } from "@/components/ui/card"

export default function ProductContext() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">productContext.md</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Contexto do Produto: Criador de Produtos

## Problemas Solucionados
- [Problema 1 que o produto resolve]
- [Problema 2 que o produto resolve]
- [Problema 3 que o produto resolve]

## Comportamento Esperado
[Descrição de como o produto deve funcionar do ponto de vista do usuário]

## Jornada do Usuário
1. [Etapa 1 da jornada]
2. [Etapa 2 da jornada]
3. [Etapa 3 da jornada]
4. [Etapa 4 da jornada]

## Personas
### [Persona 1]
- **Características**: [Descrição]
- **Objetivos**: [Objetivos ao usar o produto]
- **Pontos de dor**: [Dificuldades que enfrenta]

### [Persona 2]
- **Características**: [Descrição]
- **Objetivos**: [Objetivos ao usar o produto]
- **Pontos de dor**: [Dificuldades que enfrenta]

## Análise Competitiva
### [Competidor 1]
- **Pontos fortes**: [Vantagens]
- **Pontos fracos**: [Desvantagens]
- **Diferenciação**: [Como nosso produto se diferencia]

### [Competidor 2]
- **Pontos fortes**: [Vantagens]
- **Pontos fracos**: [Desvantagens]
- **Diferenciação**: [Como nosso produto se diferencia]

## Métricas de Sucesso
- [Métrica 1]: [Descrição e objetivo]
- [Métrica 2]: [Descrição e objetivo]
- [Métrica 3]: [Descrição e objetivo]`}
        </pre>
      </Card>
    </div>
  )
}
