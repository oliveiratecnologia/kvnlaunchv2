import { Card } from "@/components/ui/card"

export default function KnowledgeBase() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">knowledgeBase.md</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Base de Conhecimento: Criador de Produtos

## Problemas Resolvidos
### [Problema 1]
- **Descrição**: [Detalhes do problema]
- **Sintomas**: [Como o problema se manifestava]
- **Causa raiz**: [O que causava o problema]
- **Solução**: [Como foi resolvido]
- **Referências**: [Links ou documentos relacionados]

### [Problema 2]
- **Descrição**: [Detalhes do problema]
- **Sintomas**: [Como o problema se manifestava]
- **Causa raiz**: [O que causava o problema]
- **Solução**: [Como foi resolvido]
- **Referências**: [Links ou documentos relacionados]

## Abordagens Descartadas
### [Abordagem 1]
- **Contexto**: [Quando foi considerada]
- **Descrição**: [O que foi proposto]
- **Razões para descarte**: [Por que não foi adotada]
- **Alternativa escolhida**: [O que foi implementado em vez disso]
- **Lições aprendidas**: [O que aprendemos com isso]

### [Abordagem 2]
- **Contexto**: [Quando foi considerada]
- **Descrição**: [O que foi proposto]
- **Razões para descarte**: [Por que não foi adotada]
- **Alternativa escolhida**: [O que foi implementado em vez disso]
- **Lições aprendidas**: [O que aprendemos com isso]

## Referências Técnicas
### [Tecnologia/Framework 1]
- **Documentação oficial**: [Link]
- **Tutoriais úteis**: [Links]
- **Exemplos de código**: [Links ou snippets]
- **Melhores práticas**: [Descrição]

### [Tecnologia/Framework 2]
- **Documentação oficial**: [Link]
- **Tutoriais úteis**: [Links]
- **Exemplos de código**: [Links ou snippets]
- **Melhores práticas**: [Descrição]

## Decisões Históricas Importantes
### [Decisão 1] - [Data]
- **Contexto**: [Situação que levou à decisão]
- **Opções consideradas**: [Alternativas avaliadas]
- **Decisão tomada**: [O que foi decidido]
- **Justificativa**: [Por que essa opção foi escolhida]
- **Impacto**: [Como afetou o projeto]
- **Status atual**: [Se ainda é válida ou foi substituída]

### [Decisão 2] - [Data]
- **Contexto**: [Situação que levou à decisão]
- **Opções consideradas**: [Alternativas avaliadas]
- **Decisão tomada**: [O que foi decidido]
- **Justificativa**: [Por que essa opção foi escolhida]
- **Impacto**: [Como afetou o projeto]
- **Status atual**: [Se ainda é válida ou foi substituída]

## FAQ Técnico
### [Pergunta 1]?
[Resposta detalhada]

### [Pergunta 2]?
[Resposta detalhada]

## Glossário
| Termo | Definição |
|-------|-----------|
| [Termo 1] | [Definição] |
| [Termo 2] | [Definição] |
| [Termo 3] | [Definição] |`}
        </pre>
      </Card>
    </div>
  )
}
