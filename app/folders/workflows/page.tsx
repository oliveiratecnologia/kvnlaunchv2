import { Card } from "@/components/ui/card"

export default function Workflows() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Diretório: /workflows/</h1>

      <Card className="p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {`# Fluxos de Trabalho do Criador de Produtos

Este diretório documenta os principais fluxos de trabalho do sistema.

## Fluxos de Usuário
- [Registro de Usuário](/workflows/user-registration/overview.md)
- [Login e Autenticação](/workflows/login-authentication/overview.md)
- [Recuperação de Senha](/workflows/password-recovery/overview.md)

## Fluxos de Negócio
- [Criação de Produto](/workflows/product-creation/overview.md)
- [Processamento de Pagamento](/workflows/payment-processing/overview.md)
- [Geração de Relatório](/workflows/report-generation/overview.md)

## Fluxos de Sistema
- [Backup e Recuperação](/workflows/backup-recovery/overview.md)
- [Sincronização de Dados](/workflows/data-sync/overview.md)
- [Processamento em Lote](/workflows/batch-processing/overview.md)`}
        </pre>
      </Card>
    </div>
  )
}
