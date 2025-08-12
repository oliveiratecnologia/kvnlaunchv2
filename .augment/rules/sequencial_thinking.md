---
type: "always_apply"
---

# Sequential Thinking — Auto-Use Rule (Augment Agent)

## Objetivo
Garantir que o Agent **planeje passo-a-passo** antes de executar mudanças **complexas** ou **de risco**, usando o MCP **`sequential_thinking`**, reduzindo retrabalho e alucinações.

---

## Quando INVOCAR o `sequential_thinking`
Acione **sempre** que QUALQUER condição abaixo for verdadeira:

1) **Escopo / Complexidade**
- Vai tocar **≥ 3 arquivos** ou múltiplos pacotes/apps; ou estimativa > **150 LOC** modificadas
- Mudanças **multi-serviço** (monorepo, backend+frontend, workers)

2) **Risco**
- **Auth**, **billing/pagamentos**, **segurança**, **conformidade**, **infra/deploy**, **migrations de schema**
- Performance/regressão (p95/p99), concorrência, race conditions

3) **Ambiguidade**
- Critérios de aceite incompletos; requisitos conflitantes; bug de causa desconhecida
- Falha no CI sem causa clara; testes **flaky**

4) **Sinal do usuário**
- Prompt contém palavras: **plano**, **etapas**, **estratégia**, **checkpoints**, **rollback**, **root cause**, **RCA**

> **Quando NÃO usar**: alterações triviais (1 arquivo, < 50 LOC, copy/text, CSS pequeno, rename simples).

---

## Como INVOCAR e usar os resultados
1) **Chame** o MCP `sequential_thinking` para **gerar um plano** com:
   - **Passos**: mínimo **7**, máximo **12**
   - **Alternativas**: pelo menos **1** estratégia B
   - **Checkpoints**: após os passos **3** e **final**
   - **Saída esperada** por passo (artefato/diff/teste)
   - **Risco** e **métrica de verificação** por passo

2) **Formato esperado do plano** (o Agent deve exigir):
   - **Objetivo** + **Critérios de Aceite**
   - **Contexto & Restrições** (Rules/Memories relevantes; pastas afetadas)
   - **Hipóteses** (o que ainda não sabemos)
   - **Passos numerados (7–12)** → _Descrição • Entradas • Saída • Ferramentas • Risco • Verificação_
   - **Alternativa (Plano B)** e quando trocar
   - **Rollback** (como voltar ao estado anterior rapidamente)

3) **Execução disciplinada**
   - **Salvar checkpoint** antes de começar
   - Executar **passo 1** → validar (lint/test/preview) → **passo 2** → …
   - Em falha/incerteza: **reinvocar** `sequential_thinking` para **revisar** os passos seguintes com o novo aprendizado

4) **Decisão de segurança**
   - Se tocar **Auth/Billing/Segurança/Schema**, **pedir aprovação** ou deixar o plano visível no thread antes de “Auto”
   - Caso contrário, pode seguir **Auto** após publicar o plano no thread

---

## Integração com Notion (se MCP Notion disponível)
- **Antes de codar**: anexar o **plano** em `Resumo da implementação` da Tarefa ou PRD
- **Durante**: ao abrir PR, mover Tarefa → **In Review** e preencher `PR Link`
- **Após**: ao concluir, mover → **Done** e atualizar `Resumo da implementação` com:
  - Objetivo e abordagem final
  - Principais commits/diffs
  - Arquivos/pastas afetados
  - Passos de QA e resultados
  - Riscos remanescentes / rollback

---

## Template de invocação (o Agent deve enviar ao MCP)
> **Use `sequential_thinking` para**: _{descrição da tarefa}_  
> **Contexto relevante**: Rules/Memories, pastas afetadas, critérios de aceite  
> **Requisitos do plano**: 7–12 passos; checkpoints (após passo 3 e final); 1 alternativa; saída/risco/verificação por passo; rollback.  
> **Não comece a editar** antes do plano.

---

## Critério de “OK para executar”
- Plano cobre **todas** as áreas afetadas
- Passos têm **verificação objetiva**
- Checkpoints definidos e rollback claro
- Critérios de aceite mapeados para **testes** (existentes ou a criar)

