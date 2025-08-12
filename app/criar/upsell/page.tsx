"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowRight, RefreshCw, ArrowUpRight, Copy, AlertTriangle, ListPlus, Lightbulb, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Upsell, ProdutoPrincipal, Subnicho } from "@/types/openai"
import { gerarUpsellAction } from "@/lib/actions/geracao-actions"
import { useAction } from "next-safe-action/hooks"
import { LoadingSteps, CopyProgressBar, LoadingStep } from "@/components/ui/loading-steps"

export default function UpsellPage() {
  const [nicho, setNicho] = useState("")
  const [subnicho, setSubnicho] = useState<Subnicho | null>(null)
  const [produtoPrincipal, setProdutoPrincipal] = useState<ProdutoPrincipal | null>(null)
  const [upsell, setUpsell] = useState<Upsell | null>(null)
  const [errorLoading, setErrorLoading] = useState<string | null>(null)
  const [loadingSteps, setLoadingSteps] = useState({
    currentStep: 0,
    steps: [
      { id: 1, title: "Analisando produto principal", complete: false },
      { id: 2, title: "Estudando perfil do cliente", complete: false },
      { id: 3, title: "Identificando oportunidades premium", complete: false },
      { id: 4, title: "Criando oferta de maior valor", complete: false },
      { id: 5, title: "Desenvolvendo benefícios exclusivos", complete: false },
      { id: 6, title: "Estruturando módulos avançados", complete: false },
      { id: 7, title: "Desenvolvendo copy de vendas", complete: false },
      { id: 8, title: "Aplicando gatilhos de urgência", complete: false },
      { id: 9, title: "Ajustando preço premium", complete: false },
      { id: 10, title: "Aguardando resposta da IA...", complete: false },
    ] as LoadingStep[]
  })
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const { execute: executeGerarUpsell, status } = useAction(gerarUpsellAction, {
    onExecute: () => {
      setIsWaitingForResponse(false)
      setLoadingSteps(prev => ({
        currentStep: 1,
        steps: prev.steps.map(step => ({ ...step, complete: false }))
      }))

      const advanceSteps = () => {
        setLoadingSteps(prev => {
          // Para no penúltimo step e aguarda a resposta da API
          const maxStep = prev.steps.length - 1
          if (prev.currentStep >= maxStep) {
            setIsWaitingForResponse(true)
            return prev
          }

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

      const stepInterval = setInterval(advanceSteps, 3000) // Reduzido para 3s

      window.localStorage.setItem('upsellStepIntervalId', stepInterval.toString())

      return () => clearInterval(stepInterval)
    },
    onSuccess: (result) => {
      const intervalId = window.localStorage.getItem('upsellStepIntervalId')
      if (intervalId) clearInterval(Number(intervalId))

      setIsWaitingForResponse(false)
      setLoadingSteps(prev => ({
        currentStep: prev.steps.length,
        steps: prev.steps.map(step => ({ ...step, complete: true }))
      }))
      
      if (result.data?.upsell) {
        const upsellGerado = result.data.upsell;
        setUpsell(upsellGerado);
        setErrorLoading(null);
        localStorage.setItem("criadorProdutos_upsell", JSON.stringify(upsellGerado));
        console.log("Upsell gerado e salvo via Action.");
        toast({ title: "Sucesso!", description: "Upsell gerado."})
      } else {
        setErrorLoading("Resposta inválida ao gerar upsell.");
        setUpsell(null);
        toast({ title: "Erro", description: "Resposta inválida da API.", variant: "destructive" });
      }
    },
    onError: (error) => {
      const intervalId = window.localStorage.getItem('upsellStepIntervalId')
      if (intervalId) clearInterval(Number(intervalId))

      setIsWaitingForResponse(false)
      setLoadingSteps(prev => ({
        currentStep: 1,
        steps: prev.steps.map(step => ({ ...step, complete: false }))
      }))

      console.error("Erro ao gerar upsell (Action):", error);
      const errorMessage = error.error?.serverError || "Ocorreu um erro desconhecido.";
      setErrorLoading(errorMessage);
      setUpsell(null);
      toast({
        title: "Erro ao gerar upsell",
        description: `Não foi possível gerar o upsell. ${errorMessage}`,
        variant: "destructive",
        duration: 7000,
      });
    },
  });

  const gerarUpsellCallback = useCallback((nichoParaGerar: string, subnichoParaGerar: Subnicho, produtoPrincipalParaGerar: ProdutoPrincipal) => {
    if (!subnichoParaGerar || !produtoPrincipalParaGerar) {
        setErrorLoading("Dados das etapas anteriores não encontrados para gerar Upsell.")
        toast({ title: "Erro", description: "Não foi possível carregar dados essenciais.", variant: "destructive" })
        return
    }
    setErrorLoading(null);
    setUpsell(null);
    executeGerarUpsell({ nicho: nichoParaGerar, subnicho: subnichoParaGerar, produtoPrincipal: produtoPrincipalParaGerar });
  }, [executeGerarUpsell, toast]);

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
        setNicho(savedNicho)
        setSubnicho(parsedSubnicho)
        setProdutoPrincipal(parsedProdutoPrincipal)
        gerarUpsellCallback(savedNicho, parsedSubnicho, parsedProdutoPrincipal)
    } catch (e) {
        console.error("Erro ao parsear dados do localStorage", e)
        toast({
            title: "Erro ao carregar dados",
            description: "Houve um problema ao carregar os dados das etapas anteriores.",
            variant: "destructive",
        })
        router.push("/criar/order-bumps")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, toast])

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto)

    toast({
      title: "Copiado para a área de transferência",
      description: "O texto foi copiado com sucesso.",
    })
  }

  const handleContinue = () => {
    if (!upsell) {
      toast({
        title: "Upsell não encontrado",
        description: "O upsell não foi gerado ou carregado corretamente. Tente gerar novamente.",
        variant: "destructive",
      })
      return
    }
    router.push("/criar/downsell")
  }

  const isLoading = status === 'executing';

  const LoadingState = () => (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 relative mb-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#4361EE]"></div>
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
            <ArrowUpRight className="h-6 w-6 text-[#4361EE] animate-pulse" />
          </div>
        </div>
        <p className="text-gray-500 text-center">
          Criando a oferta premium (Upsell) para
          <br />
          <span className="font-medium text-[#4361EE]">{produtoPrincipal?.nome || "seu produto"}</span>...
        </p>
      </div>
    )

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center text-center py-12 bg-red-50 border border-red-200 rounded-lg p-6">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-xl font-semibold text-red-800 mb-2">Falha ao Gerar Upsell</h3>
      <p className="text-red-700 mb-6 max-w-md">
        {errorLoading || "Não foi possível gerar o upsell."}
      </p>
      <Button
        onClick={() => { if (nicho && subnicho && produtoPrincipal) gerarUpsellCallback(nicho, subnicho, produtoPrincipal) }}
        variant="destructive"
        className="bg-red-600 hover:bg-red-700 text-white"
        disabled={!nicho || !subnicho || !produtoPrincipal || isLoading}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar Gerar Novamente
      </Button>
       <Button
        onClick={() => router.push('/criar/order-bumps')}
        variant="outline"
        className="mt-3"
      >
        Voltar para Order Bumps
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">5. Upsell</h2>
         <p className="text-gray-600 max-w-2xl mx-auto">
           {isLoading
            ? "Gerando a oferta premium..."
            : errorLoading
            ? "Ocorreu um erro ao gerar o upsell."
            : upsell
            ? `Criamos um upsell premium no valor de R$ ${upsell.valorVenda.toFixed(2)} para oferecer após a compra principal.`
            : "Upsell não disponível."}
        </p>
      </div>

      {!isLoading && !errorLoading && upsell && (
        <div className="flex justify-center">
            <Button
                onClick={() => { if (nicho && subnicho && produtoPrincipal) gerarUpsellCallback(nicho, subnicho, produtoPrincipal) }}
                variant="outline"
                className="text-sm"
                disabled={!nicho || !subnicho || !produtoPrincipal || isLoading}
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                Gerar outra versão
            </Button>
        </div>
      )}

      {isLoading ? (
        <LoadingSteps
          steps={loadingSteps.steps}
          currentStep={loadingSteps.currentStep}
          context="upsell"
          estimatedTime="40-50 segundos"
          isWaitingForResponse={isWaitingForResponse}
        />
      ) : errorLoading ? (
        <ErrorState />
      ) : upsell ? (
        <>
          <Tabs defaultValue="detalhes" className="w-full">
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
              <Card className="p-6 border-[#4361EE]/10 bg-gradient-to-b from-white to-blue-50">
                <div className="space-y-4">
                   <div className="bg-white p-4 rounded-lg border border-[#4361EE]/20 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-sm font-medium text-gray-500">Nome do Upsell:</h3>
                            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[#4361EE]" onClick={() => copiarTexto(upsell.nome)}>
                            <Copy className="h-3 w-3 mr-1" /> <span className="text-xs">Copiar</span>
                            </Button>
                        </div>
                        <p className="text-base font-semibold text-gray-800">{upsell.nome}</p>
                    </div>
                     <div className="bg-white p-4 rounded-lg border border-[#4361EE]/20 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-sm font-medium text-gray-500">Descrição:</h3>
                             <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[#4361EE]" onClick={() => copiarTexto(upsell.descricao)}>
                            <Copy className="h-3 w-3 mr-1" /> <span className="text-xs">Copiar</span>
                            </Button>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{upsell.descricao}</p>
                    </div>
                     <div className="bg-white p-4 rounded-lg border border-[#4361EE]/20 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Valor de Venda:</h3>
                        <p className="text-xl font-bold text-[#4361EE]">R$ {upsell.valorVenda.toFixed(2)}</p>
                    </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="copy">
              <Card className="p-6 border-[#4361EE]/10 bg-gradient-to-b from-white to-blue-50">
                {isLoading ? (
                  <div className="py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-pulse mb-4">
                        <FileText className="h-16 w-16 text-[#4361EE]/50" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-700 mb-2">Gerando texto persuasivo...</h3>
                      <p className="text-gray-500 text-center max-w-md mb-6">
                        Estamos criando uma página de vendas de alta conversão para o seu upsell premium
                      </p>
                      
                      {/* Barra de progresso simulada */}
                      <CopyProgressBar />
                      
                      {/* Dicas rotativas */}
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-md">
                        <div className="flex items-start">
                          <Lightbulb className="h-5 w-5 text-[#4361EE] mr-2 shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-[#4361EE] block mb-1">Dica do especialista:</span>
                            Um bom upsell deve complementar o produto principal e oferecer ainda mais valor para o cliente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : errorLoading ? (
                  <div className="text-center text-red-600 py-8">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-lg font-medium mb-2">Erro ao gerar a copy do upsell</p>
                    <p className="mb-4">{errorLoading}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mx-auto border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => { if (nicho && subnicho && produtoPrincipal) gerarUpsellCallback(nicho, subnicho, produtoPrincipal) }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar Novamente
                    </Button>
                  </div>
                ) : upsell?.copyPaginaVendas ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-medium text-gray-800">Copy para Página de Vendas do Upsell:</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#4361EE] border-[#4361EE]/20"
                      onClick={() => copiarTexto(upsell.copyPaginaVendas)}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      <span className="text-xs">Copiar Copy</span>
                    </Button>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-[#4361EE]/20 shadow-sm overflow-auto max-h-[450px]">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                      {upsell.copyPaginaVendas}
                    </div>
                  </div>
                </>
                ) : (
                  <div className="py-10 text-center text-gray-400 italic">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Copy de vendas do upsell não gerada ou vazia.</p>
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
              disabled={isLoading}
            >
              Continuar para Downsell
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
         <div className="text-center py-12">
            <p className="text-gray-500">Não foi possível carregar o upsell.</p>
             <Button
                onClick={() => { if (nicho && subnicho && produtoPrincipal) gerarUpsellCallback(nicho, subnicho, produtoPrincipal) }}
                variant="outline"
                className="mt-4"
                disabled={!nicho || !subnicho || !produtoPrincipal || isLoading}
            >
                 <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Gerar Novamente
            </Button>
        </div>
      )}
    </div>
  )
}
