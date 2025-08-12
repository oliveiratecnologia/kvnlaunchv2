import { Card } from "@/components/ui/card"

export default function ActiveContext() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">activeContext.md</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Contexto Ativo: Criador de Produtos

## Última Atualização
[Data da última atualização]

## Alterações Recentes
- 🟢 [Alteração 1 concluída]
- 🟡 [Alteração 2 em andamento]
- 🔴 [Alteração 3 bloqueada]

## Próximas Etapas
- ⚡ [Etapa prioritária 1]
- [Etapa 2]
- [Etapa 3]

## Decisões em Andamento
### [Decisão 1]
- **Contexto**: [Descrição]
- **Opções**: 
  - [Opção 1]: [Prós e contras]
  - [Opção 2]: [Prós e contras]
- **Status**: [Em discussão/Pendente aprovação]

### [Decisão 2]
- **Contexto**: [Descrição]
- **Opções**: 
  - [Opção 1]: [Prós e contras]
  - [Opção 2]: [Prós e contras]
- **Status**: [Em discussão/Pendente aprovação]

## Bloqueios e Soluções
### [Bloqueio 1]
- **Descrição**: [Detalhes do bloqueio]
- **Impacto**: [Áreas afetadas]
- **Solução proposta**: [Abordagem para resolver]
- **Status**: 🔍 Em investigação

### [Bloqueio 2]
- **Descrição**: [Detalhes do bloqueio]
- **Impacto**: [Áreas afetadas]
- **Solução proposta**: [Abordagem para resolver]
- **Status**: 🟡 Em progresso

## Notas da Última Sessão
[Resumo dos principais pontos discutidos e decisões tomadas na última sessão]`}
        </pre>
      </Card>
    </div>
  )
}
