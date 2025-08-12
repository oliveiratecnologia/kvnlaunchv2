/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para otimizar performance do sistema de ebooks
  serverExternalPackages: ['puppeteer'],

  // Configurações TypeScript para build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configurações ESLint para build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configurações de build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Otimizações para servidor
      config.externals = [...(config.externals || []), 'puppeteer'];
    }
    
    return config;
  },
  
  // Configurações de headers para melhor performance
  async headers() {
    return [
      {
        source: '/api/ebook/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Configurações de redirecionamento
  async redirects() {
    return [];
  },
  
  // Configurações de reescrita
  async rewrites() {
    return [];
  },
  
  // Configurações de imagens (se necessário no futuro)
  images: {
    domains: [],
  },
  
  // Configurações de ambiente
  env: {
    // Variáveis customizadas podem ser adicionadas aqui
  },
  
  // Configurações de output (para deploy)
  output: 'standalone',
  
  // Configurações de compressão
  compress: true,
  
  // Configurações de desenvolvimento
  ...(process.env.NODE_ENV === 'development' && {
    // Configurações específicas para desenvolvimento
    reactStrictMode: true,
    
    // Logging detalhado em desenvolvimento
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }),
  
  // Configurações de produção
  ...(process.env.NODE_ENV === 'production' && {
    // Otimizações para produção já são padrão no Next.js 15

    // Configurações de bundle analyzer (opcional)
    // bundleAnalyzer: {
    //   enabled: process.env.ANALYZE === 'true',
    // },
  }),
};

module.exports = nextConfig;
