"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowRight, RefreshCw, ArrowDownRight, Copy, AlertTriangle, ArrowUpRight, Lightbulb, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Importar tipos necessários
import type { Downsell, Upsell, ProdutoPrincipal, Subnicho, OrderBump } from "@/types/openai"
// Importar as Server Actions e o hook
import { gerarDownsellAction, salvarProdutoCompletoAction } from "@/lib/actions/geracao-actions"
import { useAction } from "next-safe-action/hooks"
// Importar os componentes de loading compartilhados
import { LoadingSteps, LoadingStep, CopyProgressBar } from "@/components/ui/loading-steps"

// REMOVIDA: interface Downsell

export default function DownsellPage() {
  const [nicho, setNicho] = useState("")
  const [subnicho, setSubnicho] = useState<Subnicho | null>(null)
  const [produtoPrincipal, setProdutoPrincipal] = useState<ProdutoPrincipal | null>(null)
  const [orderBumps, setOrderBumps] = useState<OrderBump[] | null>(null)
  const [upsell, setUpsell] = useState<Upsell | null>(null)
  const [downsell, setDownsell] = useState<Downsell | null>(null)
  const [errorLoading, setErrorLoading] = useState<string | null>(null)
  // Estado para controlar o loading com etapas
  const [loadingSteps, setLoadingSteps] = useState({
    currentStep: 0,
    steps: [
      { id: 1, title: "Analisando upsell recusado", complete: false },
      { id: 2, title: "Estudando objeções do cliente", complete: false },
      { id: 3, title: "Criando oferta alternativa", complete: false },
      { id: 4, title: "Ajustando proposta de valor", complete: false },
      { id: 5, title: "Simplificando benefícios", complete: false },
      { id: 6, title: "Reduzindo barreiras de entrada", complete: false },
      { id: 7, title: "Desenvolvendo copy persuasiva", complete: false },
      { id: 8, title: "Aplicando desconto estratégico", complete: false },
      { id: 9, title: "Ajustando preço acessível", complete: false },
      { id: 10, title: "Aguardando resposta da IA...", complete: false },
    ] as LoadingStep[]
  })
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // --- Hook useAction para gerar downsell --- //
  const { execute: executeGerarDownsell, status: statusGerar } = useAction(gerarDownsellAction, {
    onExecute: () => {
      setIsWaitingForResponse(false)
      // Reseta o estado de carregamento
      setLoadingSteps(prev => ({
        currentStep: 1,
        steps: prev.steps.map(step => ({ ...step, complete: false }))
      }))

      // Configura um timer para avançar as etapas automaticamente
      const advanceSteps = () => {
        setLoadingSteps(prev => {
          // Para no penúltimo step e aguarda a resposta da API
          const maxStep = prev.steps.length - 1
          if (prev.currentStep >= maxStep) {
            setIsWaitingForResponse(true)
            return prev
          }

          // Marca a etapa atual como completa e avança para a próxima
          const newSteps = [...prev.steps]
          if (prev.currentStep > 0) {
            newSteps[prev.currentStep - 1].complete = true
          }

          return {
            currentStep: prev.currentStep + 1,
            steps: newSteps
          }
        })
      }

      // Avança as etapas a cada 3 segundos
      const stepInterval = setInterval(advanceSteps, 3000)

      // Armazena o intervalo para limpar quando a action completar
      window.localStorage.setItem('downsellStepIntervalId', stepInterval.toString())
      
      return () => clearInterval(stepInterval)
    },
    onSuccess: (result) => {
      // Limpa o intervalo quando a action completar
      const intervalId = window.localStorage.getItem('downsellStepIntervalId')
      if (intervalId) clearInterval(Number(intervalId))

      setIsWaitingForResponse(false)
      // Completa todas as etapas restantes
      setLoadingSteps(prev => ({
        currentStep: prev.steps.length,
        steps: prev.steps.map(step => ({ ...step, complete: true }))
      }))
      
      if (result.data?.downsell) {
        const downsellGerado = result.data.downsell;
        setDownsell(downsellGerado);
        setErrorLoading(null);
        localStorage.setItem("criadorProdutos_downsell", JSON.stringify(downsellGerado));
        console.log("Downsell gerado e salvo via Action.");
        toast({ title: "Sucesso!", description: "Downsell gerado."})
      } else {
        setErrorLoading("Resposta inválida ao gerar downsell.");
        setDownsell(null);
        toast({ title: "Erro", description: "Resposta inválida da API.", variant: "destructive" });
      }
    },
    onError: (error) => {
      // Limpa o intervalo quando ocorrer erro
      const intervalId = window.localStorage.getItem('downsellStepIntervalId')
      if (intervalId) clearInterval(Number(intervalId))

      setIsWaitingForResponse(false)
      setLoadingSteps(prev => ({
        currentStep: 1,
        steps: prev.steps.map(step => ({ ...step, complete: false }))
      }))

      console.error("Erro ao gerar downsell (Action):", error);

      // Log mais detalhado do erro para diagnóstico
      console.error("Detalhes do erro:", JSON.stringify(error, null, 2));

      // Tenta extrair mensagens específicas do erro
      let errorMessage = "Ocorreu um erro desconhecido.";
      if (error.error?.serverError) {
        errorMessage = error.error.serverError;
      } else if (error.error?.validationErrors) {
        // Erro de validação do schema Zod
        const validationErrors = error.error.validationErrors;
        console.error("Erros de validação:", validationErrors);
        errorMessage = "Dados inválidos: " + JSON.stringify(validationErrors);
      }

      setErrorLoading(errorMessage);
      setDownsell(null);
      toast({
        title: "Erro ao gerar downsell",
        description: `Não foi possível gerar o downsell. ${errorMessage}`,
        variant: "destructive",
        duration: 7000,
      });
    },
  });

  // --- Hook useAction para salvar o produto completo --- //
  const { execute: executeSalvarProduto, status: statusSalvar } = useAction(salvarProdutoCompletoAction, {
    onSuccess: (result) => {
      console.log("Produto salvo com sucesso no Supabase. ID:", result.data?.productId);
      toast({ title: "Sucesso!", description: "Produto completo salvo no banco de dados." });
      
      // Verifica se o ID foi retornado antes de navegar
      const productId = result.data?.productId;
      if (productId) {
        router.push(`/criar/resumo?productId=${productId}`); // Navega para o resumo APÓS salvar, incluindo o ID
      } else {
        console.error("Erro: ID do produto não retornado após salvar. Navegando sem ID.");
        toast({ title: "Alerta", description: "Produto salvo, mas houve um problema ao obter o ID para a próxima etapa.", variant: "destructive"});
        router.push("/criar/resumo"); // Fallback: Navega sem ID se houver erro
      }
    },
    onError: (error) => {
      console.error("Erro ao salvar produto no Supabase:", error);
      toast({
        title: "Erro ao Salvar",
        description: `Não foi possível salvar o produto completo. ${error.error?.serverError || 'Erro desconhecido.'} Tente novamente ou entre em contato com o suporte.`,
        variant: "destructive",
        duration: 9000, // Maior duração para erro crítico
      });
      // Considerar não navegar ou permitir nova tentativa
    },
  });

  // Função para iniciar a geração
  const gerarDownsellCallback = useCallback((nichoParaGerar: string, subnichoParaGerar: Subnicho, produtoPrincipalParaGerar: ProdutoPrincipal, upsellParaGerar: Upsell) => {
      if (!subnichoParaGerar || !produtoPrincipalParaGerar || !upsellParaGerar) {
          setErrorLoading("Dados das etapas anteriores não encontrados para gerar Downsell.")
          toast({ title: "Erro", description: "Não foi possível carregar dados essenciais das etapas anteriores.", variant: "destructive" })
          return
      }
      setErrorLoading(null);
      setDownsell(null);
      executeGerarDownsell({ nicho: nichoParaGerar, subnicho: subnichoParaGerar, produtoPrincipal: produtoPrincipalParaGerar, upsell: upsellParaGerar });
    }, [executeGerarDownsell, toast]);

  useEffect(() => {
    const savedNicho = localStorage.getItem("criadorProdutos_nicho")
    const savedSubnichoString = localStorage.getItem("criadorProdutos_subnicho")
    const savedProdutoPrincipalString = localStorage.getItem("criadorProdutos_produtoPrincipal")
    const savedOrderBumpsString = localStorage.getItem("criadorProdutos_orderBumps")
    const savedUpsellString = localStorage.getItem("criadorProdutos_upsell")

    if (!savedNicho || !savedSubnichoString || !savedProdutoPrincipalString || !savedUpsellString) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, complete as etapas anteriores primeiro.",
        variant: "destructive",
      })
      router.push("/criar/nicho")
      return
    }

    try {
      const parsedSubnicho = JSON.parse(savedSubnichoString) as Subnicho
      const parsedProdutoPrincipal = JSON.parse(savedProdutoPrincipalString) as ProdutoPrincipal
      const parsedOrderBumps = savedOrderBumpsString ? JSON.parse(savedOrderBumpsString) as OrderBump[] : null;
      const parsedUpsell = JSON.parse(savedUpsellString) as Upsell

      // Adicionar logs para diagnóstico
      console.log("Dados carregados para geração de downsell:");
      console.log("- Nicho:", savedNicho);
      console.log("- Produto Principal:", parsedProdutoPrincipal.nome);
      console.log("- Upsell:", parsedUpsell.nome);
      
      // Verificar se o upsell tem todos os campos necessários
      if (!parsedUpsell.nome || !parsedUpsell.descricao || !parsedUpsell.copyPaginaVendas) {
        console.warn("Dados do upsell estão incompletos:", {
          temNome: !!parsedUpsell.nome,
          temDescricao: !!parsedUpsell.descricao,
          temCopy: !!parsedUpsell.copyPaginaVendas
        });
      }
      
      setNicho(savedNicho)
      setSubnicho(parsedSubnicho)
      setProdutoPrincipal(parsedProdutoPrincipal)
      setOrderBumps(parsedOrderBumps)
      setUpsell(parsedUpsell)
      gerarDownsellCallback(savedNicho, parsedSubnicho, parsedProdutoPrincipal, parsedUpsell)
    } catch(e) {
      console.error("Erro ao parsear dados do localStorage para downsell", e)
      toast({
          title: "Erro ao carregar dados",
          description: "Houve um problema ao carregar os dados das etapas anteriores.",
          variant: "destructive",
      })
      router.push("/criar/upsell") // Volta para etapa anterior
    }

  }, [router, toast, gerarDownsellCallback])

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto)

    toast({
      title: "Copiado para a área de transferência",
      description: "O texto foi copiado com sucesso.",
    })
  }

  const handleContinue = () => {
    if (!nicho || !subnicho || !produtoPrincipal || !upsell || !downsell) {
      toast({
        title: "Dados incompletos",
        description: "Algumas informações do produto ainda não foram geradas ou carregadas. Verifique as etapas anteriores ou tente gerar o downsell novamente.",
        variant: "destructive",
      })
      return
    }

    // Montar o objeto completo para a action
    const produtoCompleto = {
      nicho,
      subnicho,
      produtoPrincipal,
      orderBumps: orderBumps || [],
      upsell,
      downsell,
    };

    console.log("Enviando para salvar: ", produtoCompleto);
    executeSalvarProduto(produtoCompleto);
  }

  // Componente de Estado de Erro
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center text-center py-12 bg-red-50 border border-red-200 rounded-lg p-6">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-xl font-semibold text-red-800 mb-2">Falha ao Gerar Downsell</h3>
      <p className="text-red-700 mb-6 max-w-md">
        {errorLoading || "Não foi possível gerar o downsell."}
      </p>
      <Button
        onClick={() => { if (nicho && subnicho && produtoPrincipal && upsell) gerarDownsellCallback(nicho, subnicho, produtoPrincipal, upsell) }}
        variant="destructive"
        className="bg-red-600 hover:bg-red-700 text-white"
        disabled={statusGerar === 'executing'}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar Gerar Novamente
      </Button>
       <Button
        onClick={() => router.push('/criar/upsell')} // Voltar para etapa anterior
        variant="outline"
        className="mt-3"
        disabled={statusGerar === 'executing' || statusSalvar === 'executing'}
      >
        Voltar para Upsell
      </Button>
    </div>
  )

  const isLoadingGerando = statusGerar === 'executing';
  const isSaving = statusSalvar === 'executing';

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">6. Downsell</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
           {isLoadingGerando
            ? "Gerando a oferta alternativa..."
            : errorLoading
            ? "Ocorreu um erro ao gerar o downsell."
            : downsell
            ? `Criamos um downsell no valor de R$ ${downsell.valorVenda.toFixed(2)} para oferecer caso o cliente recuse o upsell.`
            : "Downsell não disponível."}
        </p>
      </div>

       {/* Botão Gerar Novamente (se sucesso) */}
       {!isLoadingGerando && !errorLoading && downsell && (
        <div className="flex justify-center">
            <Button
                 onClick={() => { if (nicho && subnicho && produtoPrincipal && upsell) gerarDownsellCallback(nicho, subnicho, produtoPrincipal, upsell) }}
                variant="outline"
                className="text-sm"
                disabled={isSaving || !nicho || !subnicho || !produtoPrincipal || !upsell}
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                Gerar outra versão
            </Button>
        </div>
      )}

      {isLoadingGerando ? (
        <LoadingSteps
          steps={loadingSteps.steps}
          currentStep={loadingSteps.currentStep}
          context="downsell"
          estimatedTime="40-50 segundos"
          isWaitingForResponse={isWaitingForResponse}
        />
      ) : errorLoading ? (
        <ErrorState />
      ) : downsell ? (
        <>
          <Tabs defaultValue="detalhes" className="w-full">
            {/* ... (TabsList e TabsTrigger iguais) ... */}
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                 <TabsTrigger
                 value="detalhes"
                 className="text-sm data-[state=active]:bg-[#4361EE] data-[state=active]:text-white"
                 >
                 Detalhes do Produto
                 </TabsTrigger>
                 <TabsTrigger
                 value="copy"
                 className="text-sm data-[state=active]:bg-[#4361EE] data-[state=active]:text-white"
                 >
                 Copy de Vendas
                 </TabsTrigger>
            </TabsList>
            <TabsContent value="detalhes">
              <Card className="p-6 border-[#4361EE]/10 bg-gradient-to-b from-white to-orange-50">
                <div className="space-y-4">
                  {/* Detalhes do Downsell (Nome, Descrição, Valor) */}
                   <div className="bg-white p-4 rounded-lg border border-[#4361EE]/20 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-sm font-medium text-gray-500">Nome do Downsell:</h3>
                            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[#4361EE]" onClick={() => copiarTexto(downsell.nome)}>
                            <Copy className="h-3 w-3 mr-1" /> <span className="text-xs">Copiar</span>
                            </Button>
                        </div>
                        <p className="text-base font-semibold text-gray-800">{downsell.nome}</p>
                    </div>
                     <div className="bg-white p-4 rounded-lg border border-[#4361EE]/20 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-sm font-medium text-gray-500">Descrição:</h3>
                             <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[#4361EE]" onClick={() => copiarTexto(downsell.descricao)}>
                            <Copy className="h-3 w-3 mr-1" /> <span className="text-xs">Copiar</span>
                            </Button>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{downsell.descricao}</p>
                    </div>
                     <div className="bg-white p-4 rounded-lg border border-[#4361EE]/20 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Valor de Venda:</h3>
                        <p className="text-xl font-bold text-[#4361EE]">R$ {downsell.valorVenda.toFixed(2)}</p>
                    </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="copy">
              <Card className="p-6 border-[#4361EE]/10 bg-gradient-to-b from-white to-orange-50">
                {isLoadingGerando ? (
                  <div className="py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-pulse mb-4">
                        <FileText className="h-16 w-16 text-[#4361EE]/50" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-700 mb-2">Gerando texto persuasivo...</h3>
                      <p className="text-gray-500 text-center max-w-md mb-6">
                        Estamos criando uma página de vendas alternativa para quando o cliente recusar o upsell
                      </p>
                      
                      {/* Barra de progresso simulada */}
                      <CopyProgressBar />
                      
                      {/* Dicas rotativas */}
                      <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 max-w-md">
                        <div className="flex items-start">
                          <Lightbulb className="h-5 w-5 text-[#FF8A65] mr-2 shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-[#FF8A65] block mb-1">Dica do especialista:</span>
                            Um downsell eficaz oferece uma versão mais acessível do upsell, mantendo valor suficiente para capturar vendas que seriam perdidas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : errorLoading ? (
                  <div className="text-center text-red-600 py-8">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-lg font-medium mb-2">Erro ao gerar a copy do downsell</p>
                    <p className="mb-4">{errorLoading}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mx-auto border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => { if (nicho && subnicho && produtoPrincipal && upsell) gerarDownsellCallback(nicho, subnicho, produtoPrincipal, upsell) }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar Novamente
                    </Button>
                  </div>
                ) : downsell?.copyPaginaVendas ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-medium text-gray-800">Copy para Página de Vendas do Downsell:</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#4361EE] border-[#4361EE]/20"
                      onClick={() => copiarTexto(downsell.copyPaginaVendas)}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      <span className="text-xs">Copiar Copy</span>
                    </Button>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-[#4361EE]/20 shadow-sm overflow-auto max-h-[450px]">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                      {downsell.copyPaginaVendas}
                    </div>
                  </div>
                </>
                ) : (
                  <div className="py-10 text-center text-gray-400 italic">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Copy de vendas do downsell não gerada ou vazia.</p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          <div className="pt-6">
            <Button
              onClick={handleContinue}
              className="w-full py-6 bg-[#4361EE] hover:bg-[#4361EE]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
              disabled={isSaving || !downsell}
            >
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                <><ArrowRight className="mr-2 h-4 w-4" /> Salvar e Ver Resumo</>
              )}
            </Button>
          </div>
        </>
      ) : (
         <div className="text-center py-12">
            <p className="text-gray-500">Não foi possível carregar o downsell.</p>
             <Button
                onClick={() => { if (nicho && subnicho && produtoPrincipal && upsell) gerarDownsellCallback(nicho, subnicho, produtoPrincipal, upsell) }}
                variant="outline"
                className="mt-4"
                 disabled={isSaving || !nicho || !subnicho || !produtoPrincipal || !upsell}
            >
                 <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Gerar Novamente
            </Button>
        </div>
      )}
    </div>
  )
}
