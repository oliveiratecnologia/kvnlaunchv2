"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMetrics = exports.puppeteerPool = exports.rateLimiter = void 0;
const limiter_1 = require("limiter");
class OpenAIRateLimiter {
    constructor() {
        this.requestLimiter = new limiter_1.RateLimiter({
            tokensPerInterval: 160,
            interval: 'minute'
        });
        this.tokenLimiter = new limiter_1.RateLimiter({
            tokensPerInterval: 1600000,
            interval: 'minute'
        });
    }
    static getInstance() {
        if (!OpenAIRateLimiter.instance) {
            OpenAIRateLimiter.instance = new OpenAIRateLimiter();
        }
        return OpenAIRateLimiter.instance;
    }
    async waitForAvailability(estimatedTokens = 10000) {
        console.log(`[Rate Limiter] Aguardando disponibilidade para ${estimatedTokens} tokens...`);
        await this.requestLimiter.removeTokens(1);
        await this.tokenLimiter.removeTokens(estimatedTokens);
        console.log(`[Rate Limiter] Disponibilidade confirmada`);
    }
    isAvailable(estimatedTokens = 10000) {
        return this.requestLimiter.tryRemoveTokens(1) &&
            this.tokenLimiter.tryRemoveTokens(estimatedTokens);
    }
    getStatus() {
        return {
            requestsAvailable: this.requestLimiter.getTokensRemaining(),
            tokensAvailable: this.tokenLimiter.getTokensRemaining(),
            requestsPerMinute: 160,
            tokensPerMinute: 1600000
        };
    }
}
class PuppeteerPool {
    constructor() {
        this.pool = [];
        this.maxSize = 3;
        this.currentSize = 0;
    }
    static getInstance() {
        if (!PuppeteerPool.instance) {
            PuppeteerPool.instance = new PuppeteerPool();
        }
        return PuppeteerPool.instance;
    }
    async getBrowser() {
        console.log(`[Puppeteer Pool] Solicitando browser. Pool size: ${this.pool.length}, Total: ${this.currentSize}`);
        if (this.pool.length > 0) {
            const browser = this.pool.pop();
            console.log(`[Puppeteer Pool] Browser reutilizado do pool`);
            return browser;
        }
        if (this.currentSize < this.maxSize) {
            console.log(`[Puppeteer Pool] Criando novo browser`);
            const puppeteer = (await Promise.resolve().then(() => __importStar(require('puppeteer')))).default;
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
                    '--memory-pressure-off'
                ]
            });
            this.currentSize++;
            return browser;
        }
        console.log(`[Puppeteer Pool] Limite atingido, aguardando browser disponível...`);
        return new Promise((resolve) => {
            const checkPool = () => {
                if (this.pool.length > 0) {
                    resolve(this.pool.pop());
                }
                else {
                    setTimeout(checkPool, 100);
                }
            };
            checkPool();
        });
    }
    async releaseBrowser(browser) {
        try {
            if (browser && !browser.isConnected || !browser.isConnected()) {
                console.log(`[Puppeteer Pool] Browser desconectado, não retornando ao pool`);
                this.currentSize--;
                return;
            }
            if (this.pool.length < this.maxSize) {
                this.pool.push(browser);
                console.log(`[Puppeteer Pool] Browser retornado ao pool. Pool size: ${this.pool.length}`);
            }
            else {
                await browser.close();
                this.currentSize--;
                console.log(`[Puppeteer Pool] Browser fechado (pool cheio)`);
            }
        }
        catch (error) {
            console.error(`[Puppeteer Pool] Erro ao liberar browser:`, error);
            this.currentSize--;
        }
    }
    async cleanup() {
        console.log(`[Puppeteer Pool] Limpando pool...`);
        for (const browser of this.pool) {
            try {
                await browser.close();
            }
            catch (error) {
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
class PerformanceMetrics {
    constructor() {
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
    static getInstance() {
        if (!PerformanceMetrics.instance) {
            PerformanceMetrics.instance = new PerformanceMetrics();
        }
        return PerformanceMetrics.instance;
    }
    startJob() {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.metrics.concurrentJobs++;
        console.log(`[Metrics] Job iniciado: ${jobId}. Jobs concorrentes: ${this.metrics.concurrentJobs}`);
        return jobId;
    }
    endJob(jobId, timings) {
        this.metrics.concurrentJobs--;
        this.metrics.totalGenerations++;
        const alpha = 0.1;
        this.metrics.averageOpenAITime = this.metrics.averageOpenAITime * (1 - alpha) + timings.openaiTime * alpha;
        this.metrics.averagePuppeteerTime = this.metrics.averagePuppeteerTime * (1 - alpha) + timings.puppeteerTime * alpha;
        this.metrics.averageUploadTime = this.metrics.averageUploadTime * (1 - alpha) + timings.uploadTime * alpha;
        this.metrics.averageTotalTime = this.metrics.averageTotalTime * (1 - alpha) + timings.totalTime * alpha;
        this.metrics.lastUpdated = new Date();
        console.log(`[Metrics] Job finalizado: ${jobId}. Total: ${this.metrics.totalGenerations}`);
    }
    recordError(jobId, error) {
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
exports.rateLimiter = OpenAIRateLimiter.getInstance();
exports.puppeteerPool = PuppeteerPool.getInstance();
exports.performanceMetrics = PerformanceMetrics.getInstance();
process.on('SIGTERM', async () => {
    console.log('[Rate Limiter] Limpando recursos...');
    await exports.puppeteerPool.cleanup();
});
process.on('SIGINT', async () => {
    console.log('[Rate Limiter] Limpando recursos...');
    await exports.puppeteerPool.cleanup();
});
