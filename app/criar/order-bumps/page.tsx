"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowRight, RefreshCw, ListPlus, Copy, Check, XCircle, AlertTriangle, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
// Importar tipos necessários
import type { OrderBump, ProdutoPrincipal, Subnicho } from "@/types/openai"
// Importar a Server Action e o hook
import { gerarOrderBumpsAction } from "@/lib/actions/geracao-actions"
import { useAction } from "next-safe-action/hooks"
// Importar os componentes de loading compartilhados
import { LoadingSteps, LoadingStep } from "@/components/ui/loading-steps"

export default function OrderBumpsPage() {
  const [nicho, setNicho] = useState("")
  const [subnicho, setSubnicho] = useState<Subnicho | null>(null)
  const [produtoPrincipal, setProdutoPrincipal] = useState<ProdutoPrincipal | null>(null)
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([])
  const [errorLoading, setErrorLoading] = useState<string | null>(null)
  // Estado para controlar o loading com etapas
  const [loadingSteps, setLoadingSteps] = useState({
    currentStep: 0,
    steps: [
      { id: 1, title: "Analisando produto principal", complete: false },
      { id: 2, title: "Estudando jornada do cliente", complete: false },
      { id: 3, title: "Identificando oportunidades", complete: false },
      { id: 4, title: "Pesquisando complementos ideais", complete: false },
      { id: 5, title: "Criando ofertas complementares", complete: false },
      { id: 6, title: "Desenvolvendo 5 order bumps", complete: false },
      { id: 7, title: "Definindo preços estratégicos", complete: false },
      { id: 8, title: "Otimizando descrições", complete: false },
      { id: 9, title: "Calculando valor agregado", complete: false },
      { id: 10, title: "Aguardando resposta da IA...", complete: false },
    ] as LoadingStep[]
  })
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // --- Hook useAction para gerar order bumps --- //
  const { execute: executeGerarOrderBumps, status } = useAction(gerarOrderBumpsAction, {
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
      window.localStorage.setItem('orderBumpsStepIntervalId', stepInterval.toString())

      return () => clearInterval(stepInterval)
    },
    onSuccess: (result) => {
      // Limpa o intervalo quando a action completar
      const intervalId = window.localStorage.getItem('orderBumpsStepIntervalId')
      if (intervalId) clearInterval(Number(intervalId))

      setIsWaitingForResponse(false)
      // Completa todas as etapas restantes
      setLoadingSteps(prev => ({
        currentStep: prev.steps.length,
        steps: prev.steps.map(step => ({ ...step, complete: true }))
      }))
      
      if (result.data?.orderBumps) {
        const bumpsGerados = result.data.orderBumps;
        setOrderBumps(bumpsGerados);
        setErrorLoading(null);
        localStorage.setItem("criadorProdutos_orderBumps", JSON.stringify(bumpsGerados));
        console.log("Order bumps gerados e salvos via Action.");
        toast({ title: "Sucesso!", description: `${bumpsGerados.length} order bumps gerados.` })
      } else {
        // Caso retorne sucesso mas sem dados
        setErrorLoading("Resposta inválida ao gerar order bumps.");
        setOrderBumps([]);
        toast({ title: "Erro", description: "Resposta inválida da API.", variant: "destructive" });
      }
    },
    onError: (error) => {
      // Limpa o intervalo quando ocorrer erro
      const intervalId = window.localStorage.getItem('orderBumpsStepIntervalId')
      if (intervalId) clearInterval(Number(intervalId))

      setIsWaitingForResponse(false)
      setLoadingSteps(prev => ({
        currentStep: 1,
        steps: prev.steps.map(step => ({ ...step, complete: false }))
      }))

      console.error("Erro ao gerar order bumps (Action):", error);
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
      setOrderBumps([]);
      toast({
        title: "Erro ao gerar order bumps",
        description: `Não foi possível gerar os order bumps. ${errorMessage}`,
        variant: "destructive",
        duration: 7000,
      });
    },
  });

  // Função para iniciar a geração
  const gerarOrderBumpsCallback = useCallback((nichoParaGerar: string, subnichoParaGerar: Subnicho, produtoPrincipalParaGerar: ProdutoPrincipal) => {
    setErrorLoading(null);
    setOrderBumps([]);
    executeGerarOrderBumps({ nicho: nichoParaGerar, subnicho: subnichoParaGerar, produtoPrincipal: produtoPrincipalParaGerar });
  }, [executeGerarOrderBumps]);

  useEffect(() => {
    const savedNicho = localStorage.getItem("criadorProdutos_nicho")
    const savedSubnichoString = localStorage.getItem("criadorProdutos_subnicho")
    const savedProdutoPrincipalString = localStorage.getItem("criadorProdutos_produtoPrincipal")

    if (!savedNicho || !savedSubnichoString || !savedProdutoPrincipalString) {
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

        // Adiciona log para diagnóstico
        console.log("Produto principal recuperado:", JSON.stringify(parsedProdutoPrincipal, null, 2));
        
        // Verifica especificamente a existência da copyPaginaVendas
        if (!parsedProdutoPrincipal.copyPaginaVendas) {
          console.warn("copyPaginaVendas está ausente ou vazia");
          parsedProdutoPrincipal.copyPaginaVendas = ""; // Garante que existe, mesmo que vazia
        }
        
        // Verifica outros campos obrigatórios
        if (!parsedProdutoPrincipal.persona) {
          console.error("Campo 'persona' ausente no produto principal");
          toast({
            title: "Dados inválidos",
            description: "O produto principal está com dados incompletos. Volte e gere novamente.",
            variant: "destructive",
          });
          router.push("/criar/produto-principal");
          return;
        }

        setNicho(savedNicho)
        setSubnicho(parsedSubnicho)
        setProdutoPrincipal(parsedProdutoPrincipal)

        gerarOrderBumpsCallback(savedNicho, parsedSubnicho, parsedProdutoPrincipal)
    } catch (e) {
        console.error("Erro ao parsear dados do localStorage", e)
        toast({
            title: "Erro ao carregar dados",
            description: "Houve um problema ao carregar os dados das etapas anteriores. Por favor, volte e tente novamente.",
            variant: "destructive",
        })
        router.push("/criar/produto-principal")
    }

  }, [router, toast, gerarOrderBumpsCallback])

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto)

    toast({
      title: "Copiado para a área de transferência",
      description: "O texto foi copiado com sucesso.",
    })
  }

  const handleContinue = () => {
    if (!orderBumps || orderBumps.length === 0) {
      toast({
        title: "Order bumps não encontrados",
        description: "Não foi possível encontrar os order bumps. Tente gerar novamente ou continue sem eles.",
        variant: "destructive",
      })
    }
    router.push("/criar/upsell")
  }

  const isLoading = status === 'executing';

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center text-center py-12 bg-red-50 border border-red-200 rounded-lg p-6">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-xl font-semibold text-red-800 mb-2">Falha ao Gerar Order Bumps</h3>
      <p className="text-red-700 mb-6 max-w-md">
        {errorLoading || "Não foi possível gerar os order bumps."}
      </p>
      <Button
        onClick={() => { if (nicho && subnicho && produtoPrincipal) gerarOrderBumpsCallback(nicho, subnicho, produtoPrincipal) }}
        variant="destructive"
        className="bg-red-600 hover:bg-red-700 text-white"
        disabled={!nicho || !subnicho || !produtoPrincipal || isLoading}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar Gerar Novamente
      </Button>
       <Button
        onClick={() => router.push('/criar/produto-principal')}
        variant="outline"
        className="mt-3"
      >
        Voltar para Produto Principal
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">4. Order Bumps</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
           {isLoading
            ? "Gerando ofertas complementares..."
            : errorLoading
            ? "Ocorreu um erro ao gerar os order bumps."
            : orderBumps.length > 0
            ? `Criamos ${orderBumps.length} order bumps que complementam seu produto principal "${produtoPrincipal?.nome}". Cada um custa R$ 9,90.`
            : "Nenhum order bump gerado."}
        </p>
      </div>

      {isLoading ? (
        <LoadingSteps
          steps={loadingSteps.steps}
          currentStep={loadingSteps.currentStep}
          context="order bumps"
          estimatedTime="40-50 segundos"
          isWaitingForResponse={isWaitingForResponse}
        />
        ) : errorLoading ? (
        <ErrorState />
        ) : orderBumps.length === 0 ? (
        <div className="text-center py-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-700">Nenhum order bump foi gerado. Você pode tentar novamente ou continuar sem eles.</p>
             <Button
                onClick={() => { if (nicho && subnicho && produtoPrincipal) gerarOrderBumpsCallback(nicho, subnicho, produtoPrincipal) }}
                variant="outline"
                className="mt-4 mr-2"
                disabled={isLoading}
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Gerar Novamente
            </Button>
            <Button onClick={handleContinue} className="mt-4">
                 Continuar sem Order Bumps
                 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
        ) : (
        <>
          <Card className="p-6 border-green-100 bg-gradient-to-b from-white to-green-50">
            <div className="space-y-4">
              {orderBumps.map((bump, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg border border-green-200 shadow-sm"
                >
                  <div className="flex items-start">
                    <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                      <span className="font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start flex-wrap gap-1">
                        <h3 className="font-medium text-base text-green-800">{bump.nome}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 text-green-600 hover:bg-green-100"
                          onClick={() => copiarTexto(bump.descricao)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          <span className="text-xs">Copiar Descrição</span>
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 mb-2">{bump.descricao}</p>

                      {bump.problemaPrincipal && (
                        <div className="bg-red-50 border border-red-100 rounded p-2 text-xs mb-2">
                          <p className="font-medium text-red-700 flex items-center">
                            <XCircle className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                            Problema que resolve:
                          </p>
                          <p className="text-red-600 pl-5">{bump.problemaPrincipal}</p>
                        </div>
                      )}

                      <p className="text-sm font-semibold text-green-600">R$ {bump.valorVenda.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={() => { if (nicho && subnicho && produtoPrincipal) gerarOrderBumpsCallback(nicho, subnicho, produtoPrincipal) }}
              variant="outline"
              className="flex-1 border-[#4361EE]/20 text-[#4361EE] hover:bg-[#4361EE]/10 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Gerando..." : "Gerar Novamente"}
            </Button>

            <Button
              onClick={handleContinue}
              className="flex-1 py-6 bg-[#4361EE] hover:bg-[#4361EE]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Continuar para Upsell
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
