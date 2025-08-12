"use client"

import { PerformanceMetrics } from '@/components/performance-metrics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MetricsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold">Painel de Administração</h1>
            </div>
          </div>
          
          <p className="text-gray-600 max-w-2xl">
            Monitore a performance e escalabilidade do sistema de geração de ebooks PDF em tempo real.
            Acompanhe métricas de OpenAI, Puppeteer, e recursos do sistema.
          </p>
        </div>

        {/* Informações do Sistema */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
              <CardDescription>
                Configurações e limites atuais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">OpenAI API</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Modelo: gpt-4o-mini</li>
                    <li>• Rate Limit: 160 req/min (80% do limite)</li>
                    <li>• Token Limit: 1.6M tokens/min</li>
                    <li>• Timeout: 60 segundos</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Puppeteer Pool</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Pool Size: 3 browsers máximo</li>
                    <li>• Timeout: 45 segundos</li>
                    <li>• Qualidade PDF: 85%</li>
                    <li>• Compressão: Habilitada</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Capacidade Estimada</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Baixa concorrência: 1-3 usuários</li>
                    <li>• Média concorrência: 4-8 usuários</li>
                    <li>• Tempo médio: 1-2 minutos</li>
                    <li>• Tamanho PDF: ~2-5 MB</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Performance */}
        <PerformanceMetrics />

        {/* Informações Técnicas */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações Técnicas</CardTitle>
              <CardDescription>
                Detalhes técnicos sobre o processo de geração de ebooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Fluxo de Geração</h4>
                  <ol className="text-sm text-gray-600 space-y-2">
                    <li>1. <strong>Validação de entrada</strong> - Verificar dados obrigatórios</li>
                    <li>2. <strong>Rate limiting</strong> - Aguardar disponibilidade da OpenAI</li>
                    <li>3. <strong>Geração de conteúdo</strong> - IA cria estrutura de 30 páginas</li>
                    <li>4. <strong>Validação de estrutura</strong> - Verificar qualidade do conteúdo</li>
                    <li>5. <strong>Renderização HTML</strong> - Converter para HTML formatado</li>
                    <li>6. <strong>Geração de PDF</strong> - Puppeteer converte para PDF</li>
                    <li>7. <strong>Upload</strong> - Salvar no Supabase Storage</li>
                    <li>8. <strong>Retorno</strong> - URL de download para o usuário</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Otimizações Implementadas</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• <strong>Rate Limiting</strong> - Controle inteligente de API calls</li>
                    <li>• <strong>Browser Pool</strong> - Reutilização de instâncias Puppeteer</li>
                    <li>• <strong>Métricas em tempo real</strong> - Monitoramento contínuo</li>
                    <li>• <strong>Timeouts estendidos</strong> - Suporte a processos longos</li>
                    <li>• <strong>Compressão de PDF</strong> - Arquivos menores</li>
                    <li>• <strong>Validação robusta</strong> - Garantia de qualidade</li>
                    <li>• <strong>Error handling</strong> - Recuperação automática</li>
                    <li>• <strong>Logging detalhado</strong> - Debugging facilitado</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Sistema de Geração de Ebooks PDF v1.0 - Otimizado para alta performance e escalabilidade
          </p>
        </div>
      </div>
    </div>
  );
}
