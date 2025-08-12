import { Card } from "@/components/ui/card"

export default function QualityAssurance() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">qualityAssurance.md</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Garantia de Qualidade: Criador de Produtos

## Estratégia de Testes
[Descrição da abordagem geral de testes, incluindo tipos de testes utilizados e responsabilidades]

## Casos de Teste Críticos
### [Funcionalidade 1]
| ID | Descrição | Pré-condições | Passos | Resultado Esperado | Status |
|----|-----------|---------------|--------|-------------------|--------|
| TC001 | [Descrição do caso] | [Condições] | 1. [Passo 1]<br>2. [Passo 2] | [Resultado] | 🟢/🟡/🔴 |
| TC002 | [Descrição do caso] | [Condições] | 1. [Passo 1]<br>2. [Passo 2] | [Resultado] | 🟢/🟡/🔴 |

### [Funcionalidade 2]
| ID | Descrição | Pré-condições | Passos | Resultado Esperado | Status |
|----|-----------|---------------|--------|-------------------|--------|
| TC003 | [Descrição do caso] | [Condições] | 1. [Passo 1]<br>2. [Passo 2] | [Resultado] | 🟢/🟡/🔴 |
| TC004 | [Descrição do caso] | [Condições] | 1. [Passo 1]<br>2. [Passo 2] | [Resultado] | 🟢/🟡/🔴 |

## Cenários de Erro
### [Categoria de Erro 1]
| ID | Cenário | Comportamento Esperado | Mitigação | Verificado |
|----|---------|------------------------|-----------|------------|
| E001 | [Descrição do cenário] | [Como o sistema deve reagir] | [Estratégia de mitigação] | ✅/❌ |
| E002 | [Descrição do cenário] | [Como o sistema deve reagir] | [Estratégia de mitigação] | ✅/❌ |

### [Categoria de Erro 2]
| ID | Cenário | Comportamento Esperado | Mitigação | Verificado |
|----|---------|------------------------|-----------|------------|
| E003 | [Descrição do cenário] | [Como o sistema deve reagir] | [Estratégia de mitigação] | ✅/❌ |
| E004 | [Descrição do cenário] | [Como o sistema deve reagir] | [Estratégia de mitigação] | ✅/❌ |

## Procedimentos de Verificação
### Revisão de Código
- [Critério 1]
- [Critério 2]
- [Critério 3]

### Testes de Segurança
- [Procedimento 1]
- [Procedimento 2]
- [Procedimento 3]

### Testes de Desempenho
- [Procedimento 1]
- [Procedimento 2]
- [Procedimento 3]

## Critérios de Aceitação
### [Feature 1]
- [ ] [Critério 1]
- [ ] [Critério 2]
- [ ] [Critério 3]

### [Feature 2]
- [ ] [Critério 1]
- [ ] [Critério 2]
- [ ] [Critério 3]

## Ferramentas de QA
| Ferramenta | Propósito | Configuração |
|------------|-----------|--------------|
| [Ferramenta 1] | [Propósito] | [Link para configuração] |
| [Ferramenta 2] | [Propósito] | [Link para configuração] |

## Relatórios de Teste
| Data | Escopo | Resultados | Problemas Identificados | Link |
|------|--------|------------|-------------------------|------|
| [Data 1] | [Escopo] | [Resumo] | [Problemas] | [Link] |
| [Data 2] | [Escopo] | [Resumo] | [Problemas] | [Link] |`}
        </pre>
      </Card>
    </div>
  )
}
