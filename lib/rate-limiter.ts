import { RateLimiter } from 'limiter';

/**
 * Rate Limiter para OpenAI API
 * Baseado nos limites do gpt-4o-mini:
 * - 200 requests/minute
 * - 2M tokens/minute
 */
class OpenAIRateLimiter {
  private requestLimiter: RateLimiter;
  private tokenLimiter: RateLimiter;
  private static instance: OpenAIRateLimiter;

  private constructor() {
    // Configurar com margem de segurança (80% dos limites)
    this.requestLimiter = new RateLimiter({
      tokensPerInterval: 160, // 80% de 200 requests/minute
      interval: 'minute'
    });

    this.tokenLimiter = new RateLimiter({
      tokensPerInterval: 1600000, // 80% de 2M tokens/minute
      interval: 'minute'
    });
  }

  public static getInstance(): OpenAIRateLimiter {
    if (!OpenAIRateLimiter.instance) {
      OpenAIRateLimiter.instance = new OpenAIRateLimiter();
    }
    return OpenAIRateLimiter.instance;
  }

  /**
   * Aguarda disponibilidade para fazer uma requisição
   * @param estimatedTokens Número estimado de tokens que serão usados
   */
  async waitForAvailability(estimatedTokens: number = 10000): Promise<void> {
    console.log(`[Rate Limiter] Aguardando disponibilidade para ${estimatedTokens} tokens...`);
    
    // Aguardar disponibilidade de request
    await this.requestLimiter.removeTokens(1);
    
    // Aguardar disponibilidade de tokens
    await this.tokenLimiter.removeTokens(estimatedTokens);
    
    console.log(`[Rate Limiter] Disponibilidade confirmada`);
  }

  /**
   * Verifica se há disponibilidade imediata
   * @param estimatedTokens Número estimado de tokens
   */
  isAvailable(estimatedTokens: number = 10000): boolean {
    return this.requestLimiter.tryRemoveTokens(1) && 
           this.tokenLimiter.tryRemoveTokens(estimatedTokens);
  }

  /**
   * Obtém informações sobre o estado atual do rate limiter
   */
  getStatus() {
    return {
      requestsAvailable: this.requestLimiter.getTokensRemaining(),
      tokensAvailable: this.tokenLimiter.getTokensRemaining(),
      requestsPerMinute: 160,
      tokensPerMinute: 1600000
    };
  }
}

/**
 * Pool de instâncias Puppeteer para otimizar performance
 */
class PuppeteerPool {
  private pool: any[] = [];
  private maxSize: number = 3;
  private currentSize: number = 0;
  private static instance: PuppeteerPool;

  private constructor() {}

  public static getInstance(): PuppeteerPool {
    if (!PuppeteerPool.instance) {
      PuppeteerPool.instance = new PuppeteerPool();
    }
    return PuppeteerPool.instance;
  }

  async getBrowser() {
    console.log(`[Puppeteer Pool] Solicitando browser. Pool size: ${this.pool.length}, Total: ${this.currentSize}`);

    try {
      // Se há browser disponível no pool, usar
      if (this.pool.length > 0) {
        const browser = this.pool.pop();
        console.log(`[Puppeteer Pool] Browser reutilizado do pool`);

        // Verificar se o browser ainda está conectado
        if (browser && browser.isConnected()) {
          return browser;
        } else {
          console.log(`[Puppeteer Pool] Browser desconectado, removendo do pool`);
          this.currentSize = Math.max(0, this.currentSize - 1);
        }
      }

      // Se não atingiu o limite, criar novo
      if (this.currentSize < this.maxSize) {
        console.log(`[Puppeteer Pool] Criando novo browser`);
        const puppeteer = (await import('puppeteer')).default;

        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--memory-pressure-off',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
          timeout: 30000 // 30 segundos timeout
        });

        console.log(`[Puppeteer Pool] Browser criado com sucesso. Conectado: ${browser.isConnected()}`);
        this.currentSize++;
        return browser;
      }
    } catch (error) {
      console.error(`[Puppeteer Pool] Erro ao criar/obter browser:`, error);
      throw new Error(`Falha ao inicializar browser: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Se atingiu o limite, aguardar browser disponível
    console.log(`[Puppeteer Pool] Limite atingido, aguardando browser disponível...`);
    return new Promise((resolve) => {
      const checkPool = () => {
        if (this.pool.length > 0) {
          resolve(this.pool.pop());
        } else {
          setTimeout(checkPool, 100);
        }
      };
      checkPool();
    });
  }

  async releaseBrowser(browser: any) {
    try {
      // Verificar se o browser ainda está ativo
      if (browser && !browser.isConnected || !browser.isConnected()) {
        console.log(`[Puppeteer Pool] Browser desconectado, não retornando ao pool`);
        this.currentSize--;
        return;
      }

      // Se o pool não está cheio, retornar ao pool
      if (this.pool.length < this.maxSize) {
        this.pool.push(browser);
        console.log(`[Puppeteer Pool] Browser retornado ao pool. Pool size: ${this.pool.length}`);
      } else {
        // Se o pool está cheio, fechar o browser
        await browser.close();
        this.currentSize--;
        console.log(`[Puppeteer Pool] Browser fechado (pool cheio)`);
      }
    } catch (error) {
      console.error(`[Puppeteer Pool] Erro ao liberar browser:`, error);
      this.currentSize--;
    }
  }

  async cleanup() {
    console.log(`[Puppeteer Pool] Limpando pool...`);
    
    for (const browser of this.pool) {
      try {
        await browser.close();
      } catch (error) {
        console.error(`[Puppeteer Pool] Erro ao fechar browser:`, error);
      }
    }
    
    this.pool = [];
    this.currentSize = 0;
    console.log(`[Puppeteer Pool] Pool limpo`);
  }

  getStatus() {
    return {
      poolSize: this.pool.length,
      totalBrowsers: this.currentSize,
      maxSize: this.maxSize
    };
  }
}

/**
 * Métricas de performance do sistema
 */
class PerformanceMetrics {
  private static instance: PerformanceMetrics;
  private metrics: {
    totalGenerations: number;
    averageOpenAITime: number;
    averagePuppeteerTime: number;
    averageUploadTime: number;
    averageTotalTime: number;
    concurrentJobs: number;
    errors: number;
    lastUpdated: Date;
  };

  private constructor() {
    this.metrics = {
      totalGenerations: 0,
      averageOpenAITime: 0,
      averagePuppeteerTime: 0,
      averageUploadTime: 0,
      averageTotalTime: 0,
      concurrentJobs: 0,
      errors: 0,
      lastUpdated: new Date()
    };
  }

  public static getInstance(): PerformanceMetrics {
    if (!PerformanceMetrics.instance) {
      PerformanceMetrics.instance = new PerformanceMetrics();
    }
    return PerformanceMetrics.instance;
  }

  startJob(): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.concurrentJobs++;
    console.log(`[Metrics] Job iniciado: ${jobId}. Jobs concorrentes: ${this.metrics.concurrentJobs}`);
    return jobId;
  }

  endJob(jobId: string, timings: {
    openaiTime: number;
    puppeteerTime: number;
    uploadTime: number;
    totalTime: number;
  }) {
    this.metrics.concurrentJobs--;
    this.metrics.totalGenerations++;

    // Calcular médias móveis
    const alpha = 0.1; // Fator de suavização
    this.metrics.averageOpenAITime = this.metrics.averageOpenAITime * (1 - alpha) + timings.openaiTime * alpha;
    this.metrics.averagePuppeteerTime = this.metrics.averagePuppeteerTime * (1 - alpha) + timings.puppeteerTime * alpha;
    this.metrics.averageUploadTime = this.metrics.averageUploadTime * (1 - alpha) + timings.uploadTime * alpha;
    this.metrics.averageTotalTime = this.metrics.averageTotalTime * (1 - alpha) + timings.totalTime * alpha;
    
    this.metrics.lastUpdated = new Date();

    console.log(`[Metrics] Job finalizado: ${jobId}. Total: ${this.metrics.totalGenerations}`);
  }

  recordError(jobId: string, error: Error) {
    this.metrics.concurrentJobs--;
    this.metrics.errors++;
    console.error(`[Metrics] Erro no job ${jobId}:`, error.message);
  }

  getMetrics() {
    return {
      ...this.metrics,
      rateLimiter: OpenAIRateLimiter.getInstance().getStatus(),
      puppeteerPool: PuppeteerPool.getInstance().getStatus()
    };
  }
}

// Exportar instâncias singleton
export const rateLimiter = OpenAIRateLimiter.getInstance();
export const puppeteerPool = PuppeteerPool.getInstance();
export const performanceMetrics = PerformanceMetrics.getInstance();

// Cleanup ao encerrar processo
process.on('SIGTERM', async () => {
  console.log('[Rate Limiter] Limpando recursos...');
  await puppeteerPool.cleanup();
});

process.on('SIGINT', async () => {
  console.log('[Rate Limiter] Limpando recursos...');
  await puppeteerPool.cleanup();
});
