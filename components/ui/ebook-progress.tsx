'use client';

import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Download, 
  FileText, 
  Upload, 
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface JobStatus {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  queue: string;
  progress: number;
  data: any;
  result?: any;
  error?: string;
  createdAt: number;
  processedAt?: number;
  finishedAt?: number;
}

interface EbookProgressProps {
  jobId: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

const STAGE_INFO = {
  'content-generation': {
    name: 'Gerando Conteúdo',
    icon: FileText,
    description: 'Criando estrutura e capítulos do ebook',
    color: 'bg-blue-500'
  },
  'pdf-generation': {
    name: 'Criando PDF',
    icon: FileText,
    description: 'Convertendo conteúdo em PDF',
    color: 'bg-purple-500'
  },
  'file-upload': {
    name: 'Fazendo Upload',
    icon: Upload,
    description: 'Salvando ebook no armazenamento',
    color: 'bg-green-500'
  }
};

export function EbookProgress({ jobId, onComplete, onError }: EbookProgressProps) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [currentStage, setCurrentStage] = useState<string>('content-generation');
  const [overallProgress, setOverallProgress] = useState(0);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');

  // Função para buscar status do job
  const fetchJobStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ebook-generator-backend-hzepb.ondigitalocean.app';
      const response = await fetch(`${apiUrl}/api/ebooks/status/${jobId}`, {
        headers: {
          'X-API-Key': 'ebook-api-secret-2025-digitalocean'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setJobStatus(result.data);
        setCurrentStage(result.data.queue);
        
        // Calcular progresso geral baseado na fila atual
        let progress = 0;
        if (result.data.queue === 'content-generation') {
          progress = Math.min(result.data.progress || 0, 33);
        } else if (result.data.queue === 'pdf-generation') {
          progress = 33 + Math.min(result.data.progress || 0, 33);
        } else if (result.data.queue === 'file-upload') {
          progress = 66 + Math.min(result.data.progress || 0, 34);
        }
        
        setOverallProgress(progress);
        
        // Calcular tempo estimado
        if (result.data.createdAt) {
          const elapsed = Date.now() - result.data.createdAt;
          const estimatedTotal = elapsed / (progress / 100);
          const remaining = estimatedTotal - elapsed;
          
          if (remaining > 0 && progress > 0) {
            const minutes = Math.ceil(remaining / 60000);
            setEstimatedTimeRemaining(`~${minutes} min restantes`);
          }
        }
        
        // Verificar se completou
        if (result.data.status === 'completed' && result.data.result) {
          setOverallProgress(100);
          setIsPolling(false);
          onComplete?.(result.data.result);
        }
        
        // Verificar se falhou
        if (result.data.status === 'failed') {
          setIsPolling(false);
          const errorMsg = result.data.error || 'Erro desconhecido na geração do ebook';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar status:', err);
      setError(err instanceof Error ? err.message : 'Erro de conexão');
      setIsPolling(false);
    }
  };

  // Polling para atualizar status
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(fetchJobStatus, 2000); // A cada 2 segundos
    fetchJobStatus(); // Buscar imediatamente

    return () => clearInterval(interval);
  }, [jobId, isPolling]);

  // Função para retry
  const handleRetry = () => {
    setError(null);
    setIsPolling(true);
    setOverallProgress(0);
  };

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Erro na Geração do Ebook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{error}</p>
          <Button onClick={handleRetry} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Gerando seu Ebook
        </CardTitle>
        <p className="text-sm text-gray-600">
          Job ID: {jobId}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progresso Geral */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm text-gray-600">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          {estimatedTimeRemaining && (
            <p className="text-xs text-gray-500">{estimatedTimeRemaining}</p>
          )}
        </div>

        {/* Etapas */}
        <div className="space-y-3">
          {Object.entries(STAGE_INFO).map(([stageKey, stage]) => {
            const isActive = currentStage === stageKey;
            const isCompleted = 
              (stageKey === 'content-generation' && overallProgress > 33) ||
              (stageKey === 'pdf-generation' && overallProgress > 66) ||
              (stageKey === 'file-upload' && overallProgress === 100);
            
            const Icon = stage.icon;
            
            return (
              <div key={stageKey} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`p-2 rounded-full ${
                  isCompleted ? 'bg-green-100' : 
                  isActive ? stage.color : 'bg-gray-100'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Icon className={`h-4 w-4 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      isActive ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {stage.name}
                    </span>
                    {isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Em andamento
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        Concluído
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Detalhado */}
        {jobStatus && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>Status: {jobStatus.status}</p>
            <p>Fila: {jobStatus.queue}</p>
            {jobStatus.processedAt && (
              <p>Iniciado: {new Date(jobStatus.processedAt).toLocaleTimeString()}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
