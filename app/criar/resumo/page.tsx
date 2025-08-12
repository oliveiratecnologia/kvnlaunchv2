'use client'

import { Suspense, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Home, FileCheck, Package, ListPlus, ArrowUpRight, ArrowDownRight, CheckCircle2, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
// Importar todos os tipos necessários
import type { Subnicho, ProdutoPrincipal, OrderBump, Upsell, Downsell } from "@/types/openai"
// Importar os componentes de loading compartilhados
import { LoadingSteps, LoadingStep } from "@/components/ui/loading-steps"

// Componente de Fallback para o Suspense
function LoadingFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
    </div>
  );
}

// Conteúdo principal da página movido para este componente
function ResumoClientContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [nicho, setNicho] = useState("")
  // Aplicar tipos aos estados
  const [subnicho, setSubnicho] = useState<Subnicho | null>(null)
  const [produtoPrincipal, setProdutoPrincipal] = useState<ProdutoPrincipal | null>(null)
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([])
  const [upsell, setUpsell] = useState<Upsell | null>(null)
  const [downsell, setDownsell] = useState<Downsell | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  // Estado para controlar o loading com etapas
  const [loadingSteps, setLoadingSteps] = useState({
    currentStep: 0,
    steps: [
      { id: 1, title: "Carregando seu nicho", complete: false },
      { id: 2, title: "Carregando produto principal", complete: false },
      { id: 3, title: "Carregando ofertas complementares", complete: false },
      { id: 4, title: "Finalizando resumo", complete: false },
    ] as LoadingStep[]
  })
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Tenta pegar o productId da URL
    const idFromUrl = searchParams.get('productId')
    if (idFromUrl) {
        setProductId(idFromUrl)
        console.log("Product ID from URL:", idFromUrl)
    } else {
        console.warn("Product ID not found in URL parameters.")
        // Opcional: Mostrar um toast ou mensagem se o ID não for encontrado
        // toast({ title: "Aviso", description: "ID do produto não encontrado na URL.", variant: "destructive" })
    }
    
    setIsLoading(true)
    let hasError = false

    // Iniciar o progresso de carregamento
    setLoadingSteps(prev => ({
      currentStep: 1,
      steps: prev.steps.map(step => ({ ...step, complete: false }))
    }))
    
    // Configura um timer para avançar as etapas automaticamente
    const advanceSteps = () => {
      setLoadingSteps(prev => {
        // Se já estiver na última etapa, não avança mais
        if (prev.currentStep >= prev.steps.length) return prev
        
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
    
    // Avança as etapas a cada 4 segundos
    const stepInterval = setInterval(advanceSteps, 4000)

    const loadData = <T,>(key: string, setter: (data: T) => void, fallbackRoute: string) => {
      if (hasError) return
      const savedData = localStorage.getItem(key)
      if (!savedData) {
        toast({ title: "Erro", description: `Dados ausentes (${key}). Retornando...`, variant: "destructive" })
        router.push(fallbackRoute)
        hasError = true
        return
      }
      try {
        setter(JSON.parse(savedData) as T)
      } catch (e) {
        console.error(`Erro ao parsear ${key}:`, e)
        toast({ title: "Erro", description: `Dados inválidos (${key}). Retornando...`, variant: "destructive" })
        router.push(fallbackRoute)
        hasError = true
      }
    }

    const savedNicho = localStorage.getItem("criadorProdutos_nicho")
    if (!savedNicho) {
        toast({ title: "Erro", description: "Nicho não encontrado. Retornando...", variant: "destructive" })
        router.push("/criar/nicho")
        hasError = true
    } else {
        setNicho(savedNicho)
    }

    loadData<Subnicho>("criadorProdutos_subnicho", setSubnicho, "/criar/nicho")
    loadData<ProdutoPrincipal>("criadorProdutos_produtoPrincipal", setProdutoPrincipal, "/criar/subnicho")
    loadData<OrderBump[]>("criadorProdutos_orderBumps", setOrderBumps, "/criar/produto-principal")
    loadData<Upsell>("criadorProdutos_upsell", setUpsell, "/criar/order-bumps")
    loadData<Downsell>("criadorProdutos_downsell", setDownsell, "/criar/upsell")

    // Limpar o localStorage AQUI, após carregar os dados com sucesso
    if (!hasError) {
      // console.log("Limpando dados do localStorage após carregar o resumo.");
      // localStorage.removeItem("criadorProdutos_nicho");
      // localStorage.removeItem("criadorProdutos_subnicho");
      // localStorage.removeItem("criadorProdutos_produtoPrincipal");
      // localStorage.removeItem("criadorProdutos_orderBumps");
      // localStorage.removeItem("criadorProdutos_upsell");
      // localStorage.removeItem("criadorProdutos_downsell");
      
      // Completa todas as etapas e finaliza o carregamento
      setTimeout(() => {
        setLoadingSteps(prev => ({
          currentStep: prev.steps.length,
          steps: prev.steps.map(step => ({ ...step, complete: true }))
        }))
        setIsLoading(false)
      }, 500)
    } else {
      // Se houve erro ao carregar, limpar intervalo e parar loading
       clearInterval(stepInterval)
       setIsLoading(false)
    }

    // Limpa o intervalo quando o componente for desmontado ou dados forem carregados
    return () => clearInterval(stepInterval)
  }, [searchParams, router, toast])

  const handleIntegrar = () => {
    if (!productId) {
      toast({
        title: "Erro",
        description: "ID do produto não encontrado para integração. Tente recarregar a página.",
        variant: "destructive",
      })
      return
    }

    setIsRedirecting(true)
    const targetUrl = `https://app.kirvano.com/?ai-product=${productId}`
    console.log("Redirecionando para:", targetUrl)

    try {
      // Adiciona um pequeno delay para o usuário ver o estado de loading
      setTimeout(() => {
        window.location.href = targetUrl
        // O estado de redirecting pode não ser resetado se a navegação for instantânea
        // Não é necessário resetar aqui pois a página será substituída
      }, 500)

    } catch (error) {
      console.error("Erro ao tentar redirecionar:", error)
      toast({
        title: "Erro ao Redirecionar",
        description: "Não foi possível iniciar a integração. Verifique o console para erros.",
        variant: "destructive",
      })
      setIsRedirecting(false) // Reseta o estado se houver erro
    }
  }

  if (isLoading) {
    return (
      <LoadingSteps 
        steps={loadingSteps.steps} 
        currentStep={loadingSteps.currentStep}
        context="resumo do funil"
        estimatedTime="10 segundos"
      />
    )
  }

  // Calcular valor total potencial
  const valorProdutoPrincipal = produtoPrincipal?.valorVenda || 0
  const valorOrderBumps = orderBumps.reduce((total, bump) => total + (bump.valorVenda || 0), 0)
  const valorUpsell = upsell?.valorVenda || 0
  const valorDownsell = downsell?.valorVenda || 0

  const valorTotalMaximo = valorProdutoPrincipal + valorOrderBumps + valorUpsell
  const valorTotalMinimo = valorProdutoPrincipal

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 text-green-600 rounded-full p-3">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-3xl font-bold">Parabéns! Seu Funil Está Pronto</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Você criou um funil de vendas completo para o nicho de{" "}
          <span className="font-medium text-blue-600">{nicho}</span>, focado no subnicho{" "}
          <span className="font-medium text-blue-600">{subnicho?.nome || 'N/A'}</span>.
        </p>
      </div>

      {!isLoading && nicho && subnicho && produtoPrincipal && orderBumps && upsell && downsell ? (
        <>
          <Card className="bg-gradient-to-r from-blue-50 to-white border-blue-100 overflow-hidden">
            <CardHeader className="pb-2 border-b border-blue-100">
              <CardTitle className="text-blue-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                  <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                  <path
                    fillRule="evenodd"
                    d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z"
                    clipRule="evenodd"
                  />
                  <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
                </svg>
                Resumo Financeiro
              </CardTitle>
              <CardDescription>Potencial de faturamento do seu funil</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-100 text-center">
                    <p className="text-sm text-gray-500 mb-1">Valor mínimo por cliente</p>
                    <p className="text-2xl font-bold text-blue-600">R$ {valorTotalMinimo.toFixed(2)}</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-100 text-center">
                    <p className="text-sm text-gray-500 mb-1">Valor máximo por cliente</p>
                    <p className="text-2xl font-bold text-green-600">R$ {valorTotalMaximo.toFixed(2)}</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-100 text-center">
                    <p className="text-sm text-gray-500 mb-1">Aumento potencial</p>
                    <p className="text-2xl font-bold text-purple-600">
                      +{valorTotalMinimo > 0 ? Math.round((valorTotalMaximo / valorTotalMinimo - 1) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center">Estrutura do Funil</h3>

            <Card className="border-blue-200 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 flex flex-row items-center space-x-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>1. Produto Principal</CardTitle>
                  <CardDescription>R$ {produtoPrincipal?.valorVenda.toFixed(2)}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-medium">{produtoPrincipal?.nome}</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{produtoPrincipal?.descricao}</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white border-b border-green-100 flex flex-row items-center space-x-2">
                <div className="bg-green-100 p-2 rounded-full">
                  <ListPlus className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>2. Order Bumps</CardTitle>
                  <CardDescription>5x R$ 9,90 = R$ {(5 * 9.9).toFixed(2)}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {orderBumps.map((bump, index) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <span className="text-xs">{index + 1}</span>
                      </div>
                      <div>
                        <span className="font-medium">{bump.nome}</span>
                        <span className="text-gray-600 text-sm block">{bump.descricao}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white border-b border-purple-100 flex flex-row items-center space-x-2">
                <div className="bg-purple-100 p-2 rounded-full">
                  <ArrowUpRight className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>3. Upsell</CardTitle>
                  <CardDescription>R$ {upsell?.valorVenda.toFixed(2)}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-medium">{upsell?.nome}</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{upsell?.descricao}</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100 flex flex-row items-center space-x-2">
                <div className="bg-orange-100 p-2 rounded-full">
                  <ArrowDownRight className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle>4. Downsell</CardTitle>
                  <CardDescription>R$ {downsell?.valorVenda.toFixed(2)}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-medium">{downsell?.nome}</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{downsell?.descricao}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próximos Passos</CardTitle>
              <CardDescription>Seu funil está pronto para ser utilizado!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/criar/nicho">
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Link>
              </Button>
              <Button
                onClick={handleIntegrar}
                disabled={isRedirecting || !productId}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {isRedirecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Integrar Funil Completo
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Não foi possível carregar todos os dados do funil.</p>
          <Button variant="outline" asChild>
            <Link href="/">
              Voltar ao Início
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

// Componente Wrapper que será o default export da rota
export default function ResumoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResumoClientContent />
    </Suspense>
  );
}
