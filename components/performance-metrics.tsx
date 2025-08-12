"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  Cpu, 
  Database, 
  RefreshCw, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react';

interface MetricsData {
  timestamp: string;
  uptime: {
    minutes: number;
    hours: number;
    formatted: string;
  };
  performance: {
    totalGenerations: number;
    averageTimes: {
      openai: number;
      puppeteer: number;
      upload: number;
      total: number;
    };
    concurrentJobs: number;
    errors: number;
    successRate: number;
    lastUpdated: string;
  };
  rateLimiter: {
    openai: {
      requestsAvailable: number;
      tokensAvailable: number;
      requestsPerMinute: number;
      tokensPerMinute: number;
      utilizationPercent: {
        requests: number;
        tokens: number;
      };
    };
  };
  puppeteerPool: {
    poolSize: number;
    totalBrowsers: number;
    maxSize: number;
    utilizationPercent: number;
  };
  system: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    nodeVersion: string;
    platform: string;
  };
  recommendations: string[];
}

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ebook/metrics');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMetrics, 10000); // Atualizar a cada 10 segundos
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage < 50) return <Badge variant="default" className="bg-green-500">Normal</Badge>;
    if (percentage < 80) return <Badge variant="secondary" className="bg-yellow-500">Moderado</Badge>;
    return <Badge variant="destructive">Alto</Badge>;
  };

  if (loading && !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Carregando métricas...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Erro ao Carregar Métricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Métricas de Performance
          </h2>
          <p className="text-gray-600">
            Última atualização: {new Date(metrics.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pausar' : 'Retomar'} Auto-refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Uptime */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uptime.formatted}</div>
            <p className="text-xs text-gray-600">
              {metrics.uptime.hours.toFixed(1)} horas
            </p>
          </CardContent>
        </Card>

        {/* Total de Gerações */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ebooks Gerados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performance.totalGenerations}</div>
            <p className="text-xs text-gray-600">
              Taxa de sucesso: {metrics.performance.successRate}%
            </p>
          </CardContent>
        </Card>

        {/* Jobs Concorrentes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Jobs Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performance.concurrentJobs}</div>
            <p className="text-xs text-gray-600">
              Processando agora
            </p>
          </CardContent>
        </Card>

        {/* Tempo Médio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(metrics.performance.averageTimes.total)}
            </div>
            <p className="text-xs text-gray-600">
              Por ebook completo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes de Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown de Tempos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Breakdown de Tempos
            </CardTitle>
            <CardDescription>
              Tempo médio por etapa do processo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>OpenAI (Geração de Conteúdo)</span>
                <span>{formatTime(metrics.performance.averageTimes.openai)}</span>
              </div>
              <Progress 
                value={(metrics.performance.averageTimes.openai / metrics.performance.averageTimes.total) * 100} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Puppeteer (Geração de PDF)</span>
                <span>{formatTime(metrics.performance.averageTimes.puppeteer)}</span>
              </div>
              <Progress 
                value={(metrics.performance.averageTimes.puppeteer / metrics.performance.averageTimes.total) * 100} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Upload (Supabase)</span>
                <span>{formatTime(metrics.performance.averageTimes.upload)}</span>
              </div>
              <Progress 
                value={(metrics.performance.averageTimes.upload / metrics.performance.averageTimes.total) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Utilização de Recursos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Utilização de Recursos
            </CardTitle>
            <CardDescription>
              Status atual dos recursos do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Rate Limiter OpenAI (Requests)</span>
                <span>{getStatusBadge(metrics.rateLimiter.openai.utilizationPercent.requests)}</span>
              </div>
              <Progress 
                value={metrics.rateLimiter.openai.utilizationPercent.requests} 
                className="h-2"
              />
              <p className="text-xs text-gray-600 mt-1">
                {metrics.rateLimiter.openai.requestsAvailable} de {metrics.rateLimiter.openai.requestsPerMinute} disponíveis
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Pool Puppeteer</span>
                <span>{getStatusBadge(metrics.puppeteerPool.utilizationPercent)}</span>
              </div>
              <Progress 
                value={metrics.puppeteerPool.utilizationPercent} 
                className="h-2"
              />
              <p className="text-xs text-gray-600 mt-1">
                {metrics.puppeteerPool.totalBrowsers} de {metrics.puppeteerPool.maxSize} browsers em uso
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memória Heap</span>
                <span>{formatBytes(metrics.system.memoryUsage.heapUsed)}</span>
              </div>
              <Progress 
                value={(metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-600 mt-1">
                de {formatBytes(metrics.system.memoryUsage.heapTotal)} total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      {metrics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {metrics.recommendations.some(r => r.includes('⚠️') || r.includes('🚨')) ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Recomendações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
