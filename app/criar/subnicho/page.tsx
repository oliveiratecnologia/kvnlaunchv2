"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowRight, TrendingUp, Search, DollarSign, Tag, Sparkles, AlertTriangle, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Subnicho } from "@/types/openai"
import { gerarSubnichosAction } from "@/lib/actions/geracao-actions"
import { useAction } from "next-safe-action/hooks"
import { LoadingSteps, LoadingStep } from "@/components/ui/loading-steps"

export default function SubnichoPage() {
  const [subnichos, setSubnichos] = useState<Subnicho[]>([])
  const [selectedSubnicho, setSelectedSubnicho] = useState<string>("")
  const [nicho, setNicho] = useState<string>("")
  const [errorLoading, setErrorLoading] = useState<string | null>(null)
  const [loadingSteps, setLoadingSteps] = useState({
    currentStep: 0,
    steps: [
      { id: 1, title: "Conectando com a IA...", complete: false },
      { id: 2, title: "Analisando tendências do nicho", complete: false },
      { id: 3, title: "Identificando oportunidades de mercado", complete: false },
      { id: 4, title: "Pesquisando subnichos lucrativos", complete: false },
      { id: 5, title: "Analisando volume de buscas", complete: false },
      { id: 6, title: "Verificando potencial de rentabilidade", complete: false },
      { id: 7, title: "Coletando palavras-chave estratégicas", complete: false },
      { id: 8, title: "Estudando concorrência de mercado", complete: false },
      { id: 9, title: "Calculando oportunidades de crescimento", complete: false },
      { id: 10, title: "Aguardando resposta da IA...", complete: false },
    ] as LoadingStep[]
  })
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const { execute: executeGerarSubnichos, status } = useAction(gerarSubnichosAction, {
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

      window.localStorage.setItem('subnichosStepIntervalId', stepInterval.toString())

      return () => clearInterval(stepInterval)
    },
    onSuccess: (result) => {
      const intervalId = window.localStorage.getItem('subnichosStepIntervalId')
      if (intervalId) clearInterval(Number(intervalId))

      setIsWaitingForResponse(false)
      setLoadingSteps(prev => ({
        currentStep: prev.steps.length,
        steps: prev.steps.map(step => ({ ...step, complete: true }))
      }))

      if (result.data?.subnichos && result.data.subnichos.length > 0) {
        setSubnichos(result.data.subnichos);
        setErrorLoading(null);
        toast({
          title: "✅ Sucesso!",
          description: `Encontramos ${result.data.subnichos.length} subnichos promissores para você.`,
          variant: "default"
        });
      } else {
        setErrorLoading("Não conseguimos identificar subnichos específicos para este nicho. Tente um nicho diferente.");
        setSubnichos([]);
        toast({
          title: "Sem resultados",
          description: "Não encontramos subnichos para este nicho. Tente outro termo.",
          variant: "default"
        });
      }
    },
    onError: (error) => {
      const intervalId = window.localStorage.getItem('subnichosStepIntervalId')
      if (intervalId) clearInterval(Number(intervalId))

      setIsWaitingForResponse(false)
      setLoadingSteps(prev => ({
        currentStep: 1,
        steps: prev.steps.map(step => ({ ...step, complete: false }))
      }))

      console.error("Erro ao carregar subnichos (Action):", error);
      const errorMessage = error.error?.serverError || "Ocorreu um erro desconhecido.";

      let friendlyMessage = "Algo deu errado durante a geração.";
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        friendlyMessage = "A geração está demorando mais que o esperado. Isso pode acontecer quando há muita demanda na IA.";
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        friendlyMessage = "Muitas solicitações sendo feitas. Aguarde alguns minutos antes de tentar novamente.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        friendlyMessage = "Problema de conexão. Verifique sua internet e tente novamente.";
      }

      setErrorLoading(friendlyMessage);
      setSubnichos([]);
      toast({
        title: "⏳ Aguarde um momento",
        description: `${friendlyMessage} Você pode tentar novamente clicando no botão abaixo.`,
        variant: "destructive",
        duration: 10000,
      });
    },
  });

  const loadSubnichos = useCallback((nichoParaCarregar: string) => {
    setErrorLoading(null);
    setSubnichos([]);
    setSelectedSubnicho("");
    executeGerarSubnichos({ nicho: nichoParaCarregar });
  }, [executeGerarSubnichos]);

  useEffect(() => {
    const savedNicho = localStorage.getItem("criadorProdutos_nicho");

    if (!savedNicho) {
      toast({
        title: "Nicho não encontrado",
        description: "Por favor, volte e selecione um nicho primeiro.",
        variant: "destructive",
      });
      router.push("/criar/nicho");
      return;
    }

    setNicho(savedNicho);
    loadSubnichos(savedNicho);

  }, [router, toast, loadSubnichos]);

  const handleContinue = () => {
    if (!selectedSubnicho) {
      toast({
        title: "Seleção necessária",
        description: "Por favor, selecione um subnicho para continuar.",
        variant: "destructive",
      });
      return;
    }

    const subnichoSelecionado = subnichos.find((s) => s.id === selectedSubnicho);
    if (subnichoSelecionado) {
        localStorage.setItem("criadorProdutos_subnicho", JSON.stringify(subnichoSelecionado));
        router.push("/criar/produto-principal");
    } else {
        toast({
            title: "Erro",
            description: "Subnicho selecionado não encontrado na lista.",
            variant: "destructive",
        });
    }
  };

  const isLoading = status === 'executing';

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 relative mb-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#4361EE]"></div>
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-[#4361EE] animate-pulse" />
        </div>
      </div>
      <p className="text-gray-500 text-center">
        Analisando os melhores subnichos para
        <br />
        <span className="font-medium text-[#4361EE]">{nicho}</span>
        <br />
        <span className="text-sm text-gray-400 mt-2">Isso pode levar até 30 segundos...</span>
      </p>
    </div>
  )

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center text-center py-12 bg-orange-50 border border-orange-200 rounded-lg p-6">
      <div className="animate-pulse">
        <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
      </div>
      <h3 className="text-xl font-semibold text-orange-800 mb-2">⏳ Aguarde um momento</h3>
      <p className="text-orange-700 mb-4 max-w-md">
        {errorLoading || "A IA está processando sua solicitação. Isso pode levar alguns minutos quando há alta demanda."}
      </p>
      <p className="text-sm text-orange-600 mb-6 max-w-md">
        💡 <strong>Dica:</strong> A geração de subnichos envolve análise complexa de mercado. 
        Geralmente leva entre 30-60 segundos.
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => loadSubnichos(nicho)}
          variant="default"
          className="bg-orange-600 hover:bg-orange-700 text-white"
          disabled={status === 'executing'}
        >
          {status === 'executing' ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </>
          )}
        </Button>
        <Button
          onClick={() => router.push('/criar/nicho')}
          variant="outline"
          className="border-orange-300"
        >
          Voltar para Nicho
        </Button>
      </div>
    </div>
  )

  const EmptyState = () => (
     <div className="flex flex-col items-center justify-center text-center py-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <Search className="h-12 w-12 text-yellow-500 mb-4" />
      <h3 className="text-xl font-semibold text-yellow-800 mb-2">Nenhum subnicho encontrado</h3>
      <p className="text-yellow-700 mb-6 max-w-md">
        Não encontramos subnichos específicos para "{nicho}" no momento. Tente um nicho mais amplo ou diferente.
      </p>
      <Button onClick={() => router.push('/criar/nicho')} variant="outline">
        Voltar para Nicho
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">2. Selecione um subnicho lucrativo</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {isLoading
            ? "Buscando os subnichos mais promissores..."
            : errorLoading
            ? "Ocorreu um erro ao buscar subnichos."
            : subnichos.length > 0
            ? `Identificamos ${subnichos.length} subnichos promissores relacionados a `
            : "Não encontramos subnichos para "}
          {!isLoading && <span className="font-medium text-[#4361EE]">{nicho}</span>}
          {!isLoading && !errorLoading && subnichos.length > 0 && ". Selecione um para criar seu produto digital."}
        </p>
      </div>

      {isLoading ? (
        <LoadingSteps
          steps={loadingSteps.steps}
          currentStep={loadingSteps.currentStep}
          context="pesquisa de subnichos"
          estimatedTime="30-60 segundos"
          isWaitingForResponse={isWaitingForResponse}
        />
      ) : errorLoading ? (
        <ErrorState />
      ) : subnichos.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <RadioGroup value={selectedSubnicho} onValueChange={setSelectedSubnicho} className="space-y-4">
            {subnichos.map((subnicho) => (
              <Card
                key={subnicho.id}
                className={`p-4 cursor-pointer transition-all hover:border-[#4361EE]/30 hover:shadow-md ${
                  selectedSubnicho === subnicho.id ? "border-[#4361EE] ring-2 ring-[#4361EE]/20 shadow-md" : "border-gray-200"
                }`}
                onClick={() => setSelectedSubnicho(subnicho.id)}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value={subnicho.id} id={`subnicho-${subnicho.id}`} className="mt-1 shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <Label htmlFor={`subnicho-${subnicho.id}`} className="text-lg font-medium cursor-pointer break-words">
                        {subnicho.nome}
                      </Label>
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 px-3 py-1 rounded-full border border-green-100 flex items-center space-x-1 shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs font-medium text-green-700">
                          {subnicho.potencialRentabilidade}% potencial
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
                        <div className="flex items-center space-x-2">
                            <div className="bg-blue-100 p-1.5 rounded-full">
                            <Search className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm text-gray-700">
                            <span className="font-medium">{subnicho.pesquisasMensais.toLocaleString()}</span> pesquisas/mês
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="bg-green-100 p-1.5 rounded-full">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700">
                            CPC médio: <span className="font-medium">R$ {subnicho.cpc.toFixed(2)}</span>
                            </span>
                        </div>
                    </div>
                     <div className="mt-3 space-y-3">
                        <div>
                            <div className="flex items-center space-x-2 mb-1.5">
                                <div className="bg-purple-100 p-1.5 rounded-full">
                                <Tag className="h-4 w-4 text-purple-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Palavras-chave:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {subnicho.palavrasChave.map((palavra, index) => (
                                <span
                                    key={index}
                                    className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100"
                                >
                                    {palavra}
                                </span>
                                ))}
                            </div>
                        </div>
                         <div>
                            <div className="flex items-center space-x-2 mb-1.5">
                                <div className="bg-orange-100 p-1.5 rounded-full">
                                <TrendingUp className="h-4 w-4 text-orange-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Termos populares:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {subnicho.termosPesquisa.map((termo, index) => (
                                <span
                                    key={index}
                                    className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100"
                                >
                                    {termo}
                                </span>
                                ))}
                            </div>
                        </div>
                    </div>

                  </div>
                </div>
              </Card>
            ))}
          </RadioGroup>

          <div className="pt-4">
            <Button
              onClick={handleContinue}
              className="w-full py-6 bg-[#4361EE] hover:bg-[#4361EE]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
              disabled={!selectedSubnicho || isLoading}
            >
              Continuar para produto principal
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
