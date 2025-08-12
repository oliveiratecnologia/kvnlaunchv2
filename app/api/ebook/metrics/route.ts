import { NextRequest, NextResponse } from 'next/server';
import { performanceMetrics, rateLimiter, puppeteerPool } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

/**
 * API para obter métricas de performance do sistema de geração de ebooks
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = performanceMetrics.getMetrics();
    
    // Calcular estatísticas adicionais
    const currentTime = new Date();
    const uptimeMinutes = process.uptime() / 60;
    
    const response = {
      timestamp: currentTime.toISOString(),
      uptime: {
        minutes: Math.round(uptimeMinutes),
        hours: Math.round(uptimeMinutes / 60 * 100) / 100,
        formatted: formatUptime(uptimeMinutes)
      },
      performance: {
        totalGenerations: metrics.totalGenerations,
        averageTimes: {
          openai: Math.round(metrics.averageOpenAITime),
          puppeteer: Math.round(metrics.averagePuppeteerTime),
          upload: Math.round(metrics.averageUploadTime),
          total: Math.round(metrics.averageTotalTime)
        },
        concurrentJobs: metrics.concurrentJobs,
        errors: metrics.errors,
        successRate: metrics.totalGenerations > 0 
          ? Math.round((1 - metrics.errors / (metrics.totalGenerations + metrics.errors)) * 100)
          : 100,
        lastUpdated: metrics.lastUpdated
      },
      rateLimiter: {
        openai: {
          requestsAvailable: metrics.rateLimiter.requestsAvailable,
          tokensAvailable: metrics.rateLimiter.tokensAvailable,
          requestsPerMinute: metrics.rateLimiter.requestsPerMinute,
          tokensPerMinute: metrics.rateLimiter.tokensPerMinute,
          utilizationPercent: {
            requests: Math.round((1 - metrics.rateLimiter.requestsAvailable / metrics.rateLimiter.requestsPerMinute) * 100),
            tokens: Math.round((1 - metrics.rateLimiter.tokensAvailable / metrics.rateLimiter.tokensPerMinute) * 100)
          }
        }
      },
      puppeteerPool: {
        poolSize: metrics.puppeteerPool.poolSize,
        totalBrowsers: metrics.puppeteerPool.totalBrowsers,
        maxSize: metrics.puppeteerPool.maxSize,
        utilizationPercent: Math.round((metrics.puppeteerPool.totalBrowsers / metrics.puppeteerPool.maxSize) * 100)
      },
      system: {
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      recommendations: generateRecommendations(metrics)
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API /api/ebook/metrics] Erro ao obter métricas:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno ao obter métricas',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Formatar tempo de uptime
 */
function formatUptime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else {
    return `${mins}m`;
  }
}

/**
 * Gerar recomendações baseadas nas métricas
 */
function generateRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];
  
  // Verificar utilização do rate limiter
  const requestUtilization = (1 - metrics.rateLimiter.requestsAvailable / metrics.rateLimiter.requestsPerMinute) * 100;
  const tokenUtilization = (1 - metrics.rateLimiter.tokensAvailable / metrics.rateLimiter.tokensPerMinute) * 100;
  
  if (requestUtilization > 80) {
    recommendations.push('⚠️ Alta utilização de requests da OpenAI (>80%). Considere implementar filas.');
  }
  
  if (tokenUtilization > 80) {
    recommendations.push('⚠️ Alta utilização de tokens da OpenAI (>80%). Considere otimizar prompts.');
  }
  
  // Verificar utilização do pool Puppeteer
  const puppeteerUtilization = (metrics.puppeteerPool.totalBrowsers / metrics.puppeteerPool.maxSize) * 100;
  if (puppeteerUtilization > 80) {
    recommendations.push('⚠️ Alta utilização do pool Puppeteer (>80%). Considere aumentar o pool.');
  }
  
  // Verificar jobs concorrentes
  if (metrics.concurrentJobs > 5) {
    recommendations.push('⚠️ Muitos jobs concorrentes. Performance pode estar degradada.');
  }
  
  // Verificar taxa de erro
  const errorRate = metrics.totalGenerations > 0 
    ? (metrics.errors / (metrics.totalGenerations + metrics.errors)) * 100
    : 0;
    
  if (errorRate > 10) {
    recommendations.push('🚨 Taxa de erro alta (>10%). Investigar causas dos erros.');
  }
  
  // Verificar tempos médios
  if (metrics.averageTotalTime > 120000) { // 2 minutos
    recommendations.push('⏱️ Tempo médio alto (>2min). Considere otimizações.');
  }
  
  // Verificar uso de memória
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
  
  if (memoryUsageMB > 500) {
    recommendations.push('💾 Alto uso de memória (>500MB). Monitorar vazamentos.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Sistema operando dentro dos parâmetros normais.');
  }
  
  return recommendations;
}

/**
 * API para resetar métricas (útil para testes)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Limpar pool Puppeteer
    await puppeteerPool.cleanup();
    
    // Nota: Não há método público para resetar métricas
    // Isso é intencional para preservar dados históricos
    
    return NextResponse.json({
      success: true,
      message: 'Pool Puppeteer limpo. Métricas preservadas para análise histórica.'
    });

  } catch (error) {
    console.error('[API /api/ebook/metrics] Erro ao resetar:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno ao resetar métricas',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
