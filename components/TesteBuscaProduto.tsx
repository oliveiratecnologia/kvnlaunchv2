"use client"; // Necessário para usar hooks como useState e useEffect

import { useState } from 'react';
import { Input } from "@/components/ui/input"; // Ajuste o caminho se necessário
import { Button } from "@/components/ui/button"; // Ajuste o caminho se necessário
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Ajuste o caminho se necessário

// Interface para tipar os dados do produto (baseado na sua API)
interface Produto {
  id: string;
  created_at: string;
  niche: string | null;
  sub_niche: string | null;
  product_name: string | null;
  description: string | null;
  // Adicione outras propriedades conforme necessário...
  sale_value: number | null;
  sales_copy: string | null;
  // ... etc
}

const TesteBuscaProduto = () => {
  // --- Estados do Componente ---
  const [produtoId, setProdutoId] = useState<string>(''); // Guarda o ID digitado pelo usuário
  const [produtoEncontrado, setProdutoEncontrado] = useState<Produto | null>(null); // Guarda os dados do produto encontrado
  const [loading, setLoading] = useState<boolean>(false); // Indica se a requisição está em andamento
  const [erro, setErro] = useState<string | null>(null); // Guarda mensagens de erro

  // --- Função para Buscar o Produto ---
  const buscarProduto = async () => {
    // 1. Validação básica do ID (UUID) - pode ser mais robusta
    if (!produtoId.trim() || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(produtoId)) {
        setErro('Por favor, insira um UUID de produto válido.');
        setProdutoEncontrado(null);
        return;
    }

    // 2. Resetar estados e iniciar carregamento
    setLoading(true);
    setErro(null);
    setProdutoEncontrado(null);

    try {
        // 3. Construir a URL da API
        // Usando caminho relativo pois o fetch é feito do frontend para o backend no mesmo domínio
        const apiUrl = `/api/produtos/${produtoId}`;
        console.log(`Fazendo fetch para: ${apiUrl}`); // Log para debug

        // 4. Fazer a requisição GET usando fetch
        const response = await fetch(apiUrl);

        // 5. Verificar se a resposta foi bem-sucedida (status 2xx)
        if (!response.ok) {
            // Se não foi OK, tenta ler a mensagem de erro do corpo da resposta
            const errorData = await response.json().catch(() => ({})); // Tenta pegar o JSON, se falhar, objeto vazio
            const errorMessage = errorData?.message || `Erro: ${response.status} ${response.statusText}`;
            console.error('Erro na resposta da API:', response.status, response.statusText, errorData);
            throw new Error(errorMessage); // Lança um erro para o catch
        }

        // 6. Se a resposta foi OK, converter para JSON
        const data: Produto = await response.json();
        console.log('Produto encontrado:', data);

        // 7. Atualizar o estado com os dados do produto
        setProdutoEncontrado(data);

    } catch (error: any) {
        // 8. Capturar erros (da rede ou lançados acima)
        console.error('Erro ao buscar produto:', error);
        setErro(`Falha ao buscar produto: ${error.message || 'Erro desconhecido'}`);
        setProdutoEncontrado(null); // Limpa resultado em caso de erro
    } finally {
        // 9. Finalizar o carregamento, independentemente de sucesso ou erro
        setLoading(false);
    }
  };

  // --- Renderização do Componente (JSX) ---
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Buscar Produto por ID (UUID)</CardTitle>
        <CardDescription>
          Insira o UUID de um produto existente no Supabase para buscar seus dados via API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            placeholder="Cole o UUID do produto aqui"
            disabled={loading}
            className="flex-grow"
          />
          <Button onClick={buscarProduto} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {/* Exibição do Erro */}
        {erro && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
            {erro}
          </div>
        )}

        {/* Exibição do Resultado */}
        {produtoEncontrado && !erro && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Produto Encontrado:</h3>
            <pre className="p-3 bg-gray-100 rounded text-sm overflow-x-auto">
              {JSON.stringify(produtoEncontrado, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TesteBuscaProduto; 