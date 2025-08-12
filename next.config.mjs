let userConfig = undefined
try {
  // try to import ESM first
  userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
  try {
    // fallback to CJS import
    userConfig = await import("./v0-user-next.config");
  } catch (innerError) {
    // ignore error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },

  async headers() {
    const baseHeaders = [
      // Você pode adicionar outros cabeçalhos padrão aqui se necessário
    ];

    // Tenta obter headers do v0-user-config, se houver
    let userHeadersConfig = [];
    const config = userConfig?.default || userConfig;
    if (config?.headers) {
      try {
        userHeadersConfig = await config.headers();
      } catch (error) {
        console.error("Erro ao carregar headers da configuração do usuário:", error);
      }
    }

    // Encontra ou cria a configuração para Content-Security-Policy
    let cspHeaderFound = false;
    const processedHeaders = userHeadersConfig.map(entry => {
      if (entry.headers) {
        entry.headers = entry.headers.map(header => {
          if (header.key.toLowerCase() === 'content-security-policy') {
            // Modifica as diretivas CSP existentes ou adiciona
            let policy = header.value;
            
            // Atualiza connect-src
            let connectSrc = "connect-src 'self' https://cxkcyipyohfheolelmnb.supabase.co https://njqennpxwkrzwpneogwl.supabase.co https://api.openai.com";
            if (policy.includes('https://cdn.jsdelivr.net/pyodide/')) {
              connectSrc += ' https://cdn.jsdelivr.net/pyodide/';
            }
            
            // Atualiza img-src para permitir Vercel Storage e Supabase
            let imgSrc = "img-src 'self' data: https://*.vercel-storage.com https://*.supabase.co https://*.supabase.com";
            
            // Aplica as mudanças
            if (policy.includes('connect-src')) {
                policy = policy.replace(/connect-src[^;]+;?/, connectSrc + ';');
            } else {
                policy += ` ${connectSrc};`;
            }
            
            if (policy.includes('img-src')) {
                policy = policy.replace(/img-src[^;]+;?/, imgSrc + ';');
            } else {
                policy += ` ${imgSrc};`;
            }
            header.value = policy;
            cspHeaderFound = true;
          }
          return header;
        });
      }
      return entry;
    });

    // Se a CSP não foi encontrada em nenhuma configuração de usuário, adiciona uma nova
    if (!cspHeaderFound) {
      processedHeaders.push({
        source: '/:path*', // Aplica a todas as rotas
        headers: [
          ...baseHeaders, // Inclui outros cabeçalhos base se definidos
          {
            key: 'Content-Security-Policy',
            // Define uma política base razoável. Ajuste conforme necessário.
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.vercel-storage.com https://*.supabase.co https://*.supabase.com; connect-src 'self' https://cxkcyipyohfheolelmnb.supabase.co https://njqennpxwkrzwpneogwl.supabase.co https://cdn.jsdelivr.net/pyodide/ https://api.openai.com;",
          }
        ]
      });
    }

    return processedHeaders;
  },
}

if (userConfig) {
  const config = userConfig.default || userConfig;
  for (const key in config) {
    // Evita sobrescrever a função headers que acabamos de definir/modificar
    if (key === 'headers') continue;

    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key]) &&
      nextConfig[key] !== null
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      };
    } else {
      nextConfig[key] = config[key];
    }
  }
}

export default nextConfig;
