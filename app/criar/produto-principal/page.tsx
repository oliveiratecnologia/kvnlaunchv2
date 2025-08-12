"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
// Importe os ícones no topo do arquivo
import {
  ArrowRight,
  RefreshCw,
  Package,
  Copy,
  UserRound,
  Calendar,
  Users,
  MapPin,
  GraduationCap,
  DollarSign,
  Briefcase,
  Smartphone,
  Clock,
  Download,
  Share2,
  Lightbulb,
  XCircle,
  Target,
  AlertCircle,
  ChevronRight,
  MessageCircle,
  Route,
  Instagram,
  FileText,
  Mail,
  Check,
  Gift,
  Star,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Lock,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  TrendingUp,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Importar a Server Action e o hook
import { gerarProdutoPrincipalAction, gerarCopyPaginaVendasAction, gerarEbookPDFAction } from "@/lib/actions/geracao-actions"
import { useAction } from "next-safe-action/hooks"
// Importar o tipo ProdutoPrincipal de @/types/openai
import type { ProdutoPrincipal, Subnicho } from "@/types/openai"
// Importar os componentes de loading compartilhados
import { LoadingSteps, CopyProgressBar, LoadingStep } from "@/components/ui/loading-steps"

// Helper para renderizar item de lista da Persona
const PersonaListItem = ({ icon: Icon, text }: { icon: React.ElementType, text?: string | null }) => {
    // Exibe 'N/A' se o texto for null, undefined ou vazio
    const displayText = text?.trim() ? text : "N/A";
    return (
        <li className="flex items-start">
        <Icon className="h-4 w-4 text-gray-500 mr-2 mt-0.5 shrink-0" />
        <span className="text-sm text-gray-700">{displayText}</span>
        </li>
    );
};

const PersonaSectionCard = ({ title, icon: Icon, colorClass, children }: {
    title: string;
    icon: React.ElementType;
    colorClass: string; // ex: 'blue'
    children: React.ReactNode;
}) => (
     <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className={`bg-${colorClass}-50 border-b border-${colorClass}-100 px-4 py-2 flex items-center`}>
            <div className={`bg-${colorClass}-100 p-1.5 rounded-full mr-2`}>
                <Icon className={`h-4 w-4 text-${colorClass}-600`} />
            </div>
            <h4 className={`font-medium text-${colorClass}-700`}>{title}</h4>
        </div>
        <div className="p-4">
            {children}
        </div>
    </div>
);

// Tipo para o estado da copy
type CopyState = {
    isLoading: boolean;
    text: string | null;
    error: string | null;
}

export default function ProdutoPrincipalPage() {
  const [nicho, setNicho] = useState("")
  const [subnicho, setSubnicho] = useState<Subnicho | null>(null)
  // Estado do produto principal (sem a copy inicialmente)
  const [produto, setProduto] = useState<Omit<ProdutoPrincipal, 'copyPaginaVendas'> | null>(null)
  // Estado separado para a copy
  const [copyState, setCopyState] = useState<CopyState>({ isLoading: false, text: null, error: null })
  const [errorLoadingProduto, setErrorLoadingProduto] = useState<string | null>(null)
  // Novo estado para rastrear as etapas de geração
  const [loadingSteps, setLoadingSteps] = useState({
    currentStep: 0,
    steps: [
      { id: 1, title: "Analisando nicho e mercado", complete: false },
      { id: 2, title: "Pesquisando tendências atuais", complete: false },
      { id: 3, title: "Criando perfil da persona", complete: false },
      { id: 4, title: "Definindo dores e motivações", complete: false },
      { id: 5, title: "Desenvolvendo estrutura do produto", complete: false },
      { id: 6, title: "Criando módulos e conteúdo", complete: false },
      { id: 7, title: "Definindo preço e estratégia", complete: false },
      { id: 8, title: "Preparando página de vendas", complete: false },
      { id: 9, title: "Otimizando copy persuasiva", complete: false },
      { id: 10, title: "Aguardando resposta da IA...", complete: false },
    ] as LoadingStep[]
  })
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  // Estado para controlar a barra de progresso da copy
  const [copyProgress, setCopyProgress] = useState(0)
  // Estado para armazenar o resultado da geração de PDF
  const [pdfResult, setPdfResult] = useState<{ downloadUrl: string; fileName: string } | null>(null)
  
  const router = useRouter()
  const { toast } = useToast()

  // --- Action para gerar APENAS a copy --- //
  const { execute: executeGerarCopy, status: statusGerarCopy } = useAction(gerarCopyPaginaVendasAction, {
    onExecute: () => {
      setCopyState({ isLoading: true, text: null, error: null });
      
      // Inicia progresso específico para copy
      const copyInterval = setInterval(() => {
        // Atualiza progresso da copy se necessário
      }, 2000)
      
      window.localStorage.setItem('copyIntervalId', copyInterval.toString())
    },
    
    onSuccess: (result) => {
      // Limpa intervalo da copy
      const intervalId = window.localStorage.getItem('copyIntervalId')
      if (intervalId) {
        clearInterval(Number(intervalId))
        window.localStorage.removeItem('copyIntervalId')
      }
      
      if (result.data?.copyPaginaVendas) {
        console.log("Copy gerada com sucesso pela Action.");
        setCopyState({ isLoading: false, text: result.data.copyPaginaVendas, error: null });
        // Atualiza o produto no localStorage com a copy
        if (produto) {
          const produtoCompleto = { ...produto, copyPaginaVendas: result.data.copyPaginaVendas };
          localStorage.setItem("criadorProdutos_produtoPrincipal", JSON.stringify(produtoCompleto));
        }
      } else {
        console.error("Action gerarCopyPaginaVendas teve sucesso mas não retornou dados.");
        setCopyState({ isLoading: false, text: null, error: "Falha ao obter a copy gerada." });
      }
    },
    
    onError: (error) => {
      // Limpa intervalo da copy
      const intervalId = window.localStorage.getItem('copyIntervalId')
      if (intervalId) {
        clearInterval(Number(intervalId))
        window.localStorage.removeItem('copyIntervalId')
      }
      
      console.error("Erro ao gerar copy (Action):", error);
      const errorMessage = error.error?.serverError || "Não foi possível gerar a copy de vendas.";
      setCopyState({ isLoading: false, text: null, error: errorMessage });
      
      // Marca as etapas como incompletas ao dar erro
      setLoadingSteps(prev => ({
        currentStep: prev.currentStep,
        steps: prev.steps
      }))
    },
  });

  // Efeito para mostrar toasts relacionados à copy
  useEffect(() => {
    if (copyState.isLoading) {
      toast({ title: "Gerando página de vendas", description: "Estamos criando a copy que vai vender seu produto..." })
    } else if (copyState.text && !copyState.error) {
      toast({ title: "Página de vendas pronta!", description: "A copy foi gerada com sucesso" })
    } else if (copyState.error) {
      toast({ title: "Erro ao Gerar Copy", description: copyState.error, variant: "destructive" })
    }
  }, [copyState, toast])

  // --- Action para gerar os DETALHES do produto (nome, desc, persona, valor) --- //
  const { execute: executeGerarDetalhes, status: statusGerarDetalhes } = useAction(gerarProdutoPrincipalAction, {
    onExecute: () => {
      setIsWaitingForResponse(false)
      // Reseta o estado de carregamento e inicia o progresso
      setLoadingSteps(prev => ({
        currentStep: 1,
        steps: prev.steps.map(step => ({ ...step, complete: false }))
      }))

      // Inicia o progresso dos steps
      const stepInterval = setInterval(() => {
        setLoadingSteps(prev => {
          // Para no penúltimo step e aguarda a resposta da API
          const maxStep = prev.steps.length - 1
          if (prev.currentStep >= maxStep) {
            setIsWaitingForResponse(true)
            return prev
          }

          return {
            ...prev,
            currentStep: prev.currentStep + 1,
            steps: prev.steps.map((step, index) => ({
              ...step,
              complete: index < prev.currentStep
            }))
          }
        })
      }, 4000) // Reduzido para 4 segundos por step

      // Salva o ID do intervalo
      window.localStorage.setItem('stepIntervalId', stepInterval.toString())
    },
    
    onSuccess: (result) => {
      // Limpa o intervalo quando terminar
      const intervalId = window.localStorage.getItem('stepIntervalId')
      if (intervalId) {
        clearInterval(Number(intervalId))
        window.localStorage.removeItem('stepIntervalId')
      }

      setIsWaitingForResponse(false)
      // Completa todos os steps
      setLoadingSteps(prev => ({
        currentStep: prev.steps.length,
        steps: prev.steps.map(step => ({ ...step, complete: true }))
      }))
      
      if (result.data?.produtoPrincipal) {
        const produtoDetalhes = result.data.produtoPrincipal;
        setProduto(produtoDetalhes);
        setErrorLoadingProduto(null);
        
        // Inicia geração da copy automaticamente
        const { copyPaginaVendas, ...detalhesParaCopy } = produtoDetalhes;
        if (detalhesParaCopy?.nome && detalhesParaCopy?.descricao && detalhesParaCopy?.persona) {
          executeGerarCopy(produtoDetalhes);
        } else {
          console.error("Dados insuficientes para gerar copy:", detalhesParaCopy);
          setCopyState({ isLoading: false, text: null, error: "Dados básicos do produto ausentes." });
        }
      } else {
        setErrorLoadingProduto("Resposta inválida ao gerar detalhes do produto.");
        setProduto(null);
      }
    },
    
    onError: (error) => {
      // Limpa o intervalo quando ocorrer erro
      const intervalId = window.localStorage.getItem('stepIntervalId')
      if (intervalId) {
        clearInterval(Number(intervalId))
        window.localStorage.removeItem('stepIntervalId')
      }

      setIsWaitingForResponse(false)
      console.error("Erro ao gerar detalhes do produto (Action):", error);
      const errorMessage = error.error?.serverError || "Ocorreu um erro desconhecido ao gerar detalhes.";
      setErrorLoadingProduto(errorMessage);
      setProduto(null);

      // Reseta os steps em caso de erro
      setLoadingSteps(prev => ({
        currentStep: 1,
        steps: prev.steps.map(step => ({ ...step, complete: false }))
      }))
    },
  });

  // --- Action para gerar PDF do ebook --- //
  const { execute: executeGerarPDF, status: statusGerarPDF } = useAction(gerarEbookPDFAction, {
    onExecute: () => {
      console.log("Iniciando geração de PDF do ebook...");
    },
    onSuccess: (result) => {
      console.log("PDF gerado com sucesso:", result.data);
      if (result.data) {
        setPdfResult({
          downloadUrl: result.data.downloadUrl,
          fileName: result.data.fileName
        });
      }
      toast({
        title: "✅ Ebook PDF Gerado!",
        description: "Seu ebook de 30 páginas foi criado com sucesso. Clique no link para baixar.",
        variant: "default",
        duration: 10000,
      });
    },
    onError: (error) => {
      console.error("Erro ao gerar PDF:", error);
      console.error("Detalhes completos do erro:", JSON.stringify(error, null, 2));

      // Extrair mensagem de erro mais específica
      let errorMessage = "Não foi possível gerar o ebook PDF. Tente novamente.";

      if (error.error?.serverError) {
        errorMessage = `Erro no servidor: ${error.error.serverError}`;
      } else if (error.error?.message) {
        errorMessage = `Erro: ${error.error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Erro na Geração do PDF",
        description: errorMessage,
        variant: "destructive",
        duration: 10000,
      });
    },
  });

  // Função para gerar PDF do ebook
  const gerarEbookPDF = useCallback(() => {
    if (!produto) {
      toast({
        title: "⚠️ Produto Necessário",
        description: "É necessário gerar o produto primeiro antes de criar o ebook PDF.",
        variant: "destructive",
      });
      return;
    }

    console.log("Iniciando geração de ebook PDF...");
    executeGerarPDF({
      nome: produto.nome,
      descricao: produto.descricao,
      nicho: nicho || "",
      subnicho: subnicho?.nome || "",
      persona: produto.persona
    });
  }, [produto, nicho, subnicho, executeGerarPDF, toast]);

  // Função para gerar detalhes do produto
  const gerarDetalhesProduto = useCallback((nicho: string, subnicho: Subnicho) => {
    console.log("Iniciando geração de detalhes do produto...");
    setErrorLoadingProduto(null);
    setProduto(null);
    setCopyState({ isLoading: false, text: null, error: null });

    // Remove produto do localStorage para evitar conflitos
    localStorage.removeItem("criadorProdutos_produtoPrincipal");

    executeGerarDetalhes({ nicho, subnicho });
  }, [executeGerarDetalhes]);

  // Inicia geração automaticamente quando nicho e subnicho estão disponíveis
  useEffect(() => {
    if (nicho && subnicho && !produto && statusGerarDetalhes !== 'executing' && statusGerarDetalhes !== 'hasSucceeded') {
      gerarDetalhesProduto(nicho, subnicho);
    }
  }, [nicho, subnicho, gerarDetalhesProduto]); // Remove produto e statusGerarDetalhes das dependências

  useEffect(() => {
    // Carrega nicho/subnicho
    const savedNicho = localStorage.getItem("criadorProdutos_nicho");
    const savedSubnichoString = localStorage.getItem("criadorProdutos_subnicho");
    const savedProduto = localStorage.getItem("criadorProdutos_produtoPrincipal");

    if (!savedNicho || !savedSubnichoString) {
      router.push("/criar/nicho");
      return;
    }
    
    try {
      const parsedSubnicho = JSON.parse(savedSubnichoString) as Subnicho;
      setNicho(savedNicho);
      setSubnicho(parsedSubnicho);
      
      // Se já existe produto salvo, carrega ele
      if (savedProduto) {
        try {
          const parsedProduto = JSON.parse(savedProduto) as ProdutoPrincipal;
          setProduto(parsedProduto);
          setCopyState({ 
            isLoading: false, 
            text: parsedProduto.copyPaginaVendas || null, 
            error: null 
          });
        } catch (e) {
          console.error("Erro ao carregar produto salvo:", e);
          // Se não conseguir carregar, vai gerar um novo
        }
      }
    } catch (e) {
      router.push("/criar/subnicho");
    }
  }, [router]);

  // Efeito único para lidar com toasts com dependências estáveis
  useEffect(() => {
    // Este efeito monitora mudanças no status e nas etapas
    // e mostra toasts apropriados
    
    // Verificar se o carregamento começou
    if (statusGerarDetalhes === 'executing') {
      // Baseado na etapa atual, mostrar toast apropriado
      const currentStep = loadingSteps.currentStep;
      
      if (currentStep === 1) {
        toast({ 
          title: "Iniciando criação do produto", 
          description: "Estamos analisando o mercado do seu nicho..." 
        });
      } else if (currentStep === 2) {
        toast({ 
          title: "Definindo persona", 
          description: "Criando o perfil ideal do seu cliente..." 
        });
      } else if (currentStep === 4) {
        toast({ 
          title: "Estruturando produto", 
          description: "Elaborando os módulos e conteúdo..." 
        });
      }
    }
  }, [statusGerarDetalhes, loadingSteps.currentStep, toast]);

  // Copiar Texto (modificar para copiar a copy do estado)
  const copiarTexto = (texto: string | null) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência.", duration: 2000 });
  };

  // handleContinue agora verifica se a copy foi gerada (pode ser opcional?)
  const handleContinue = () => {
    if (!produto) {
      toast({ title: "Erro", description: "Detalhes do produto não gerados.", variant: "destructive" });
      return;
    }
     if (copyState.isLoading) {
        toast({ title: "Aguarde", description: "A copy de vendas ainda está sendo gerada.", variant: "default" });
        return;
    }
    if (!copyState.text || copyState.error) {
        // Permitir continuar mesmo sem copy ou com erro?
         toast({ title: "Aviso", description: "A copy de vendas não foi gerada com sucesso, mas você pode continuar.", variant: "default" });
        // Ou impedir: return;
    }
    // Garante que produto completo (com copy) está no localStorage antes de avançar
     const produtoCompleto = { ...produto, copyPaginaVendas: copyState.text ?? "" };
     localStorage.setItem("criadorProdutos_produtoPrincipal", JSON.stringify(produtoCompleto));

    router.push("/criar/order-bumps");
  };

  const isLoadingDetalhes = statusGerarDetalhes === 'executing';
  const isLoadingCopy = copyState.isLoading;
  const isOverallLoading = isLoadingDetalhes || isLoadingCopy;

  function ErrorState() {
     return (
      <div className="flex flex-col items-center justify-center text-center py-12 bg-red-50 border border-red-200 rounded-lg p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-800 mb-2">Falha ao Gerar Produto</h3>
        <p className="text-red-700 mb-6 max-w-md">
          {errorLoadingProduto || "Não foi possível gerar os detalhes do produto."}
        </p>
        <Button
          onClick={() => { if(nicho && subnicho) gerarDetalhesProduto(nicho, subnicho) }} // Tenta gerar DETALHES novamente
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white"
          disabled={!nicho || !subnicho || isLoadingDetalhes}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar Gerar Detalhes Novamente
        </Button>
         <Button onClick={() => router.push('/criar/subnicho')} variant="outline" className="mt-3">
          Voltar para Subnicho
        </Button>
      </div>
     );
    }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">3. Produto Principal</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {isLoadingDetalhes
            ? "Gerando os detalhes do produto..."
            : errorLoadingProduto
            ? "Ocorreu um erro ao gerar o produto."
            : produto
            ? `Criamos um produto digital no valor de R$ ${produto.valorVenda.toFixed(2)} para o subnicho `
            : "Produto não disponível."}
          {!isLoadingDetalhes && <span className="font-medium text-[#4361EE]">{subnicho?.nome || nicho}</span>}
          {!isLoadingDetalhes && !errorLoadingProduto && produto && "."}
        </p>
      </div>

      {!isLoadingDetalhes && !errorLoadingProduto && produto && (
        <div className="flex justify-center gap-3">
            <Button
                onClick={() => { if (nicho && subnicho) gerarDetalhesProduto(nicho, subnicho) }}
                variant="outline" className="text-sm"
                disabled={!nicho || !subnicho || isOverallLoading}
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                Gerar Novamente (Detalhes + Copy)
            </Button>

            <Button
                onClick={gerarEbookPDF}
                variant="default"
                className="text-sm bg-green-600 hover:bg-green-700"
                disabled={!produto || statusGerarPDF === 'executing'}
            >
                {statusGerarPDF === 'executing' ? (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Gerando PDF...
                    </>
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" />
                        Gerar Ebook PDF (30 páginas)
                    </>
                )}
            </Button>
        </div>
      )}

      {/* Seção de resultado da geração de PDF */}
      {statusGerarPDF === 'hasSucceeded' && pdfResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Download className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <h3 className="font-semibold text-green-800">Ebook PDF Gerado com Sucesso!</h3>
                <p className="text-sm text-green-600">Seu ebook de 30 páginas está pronto para download.</p>
                <p className="text-xs text-green-500 mt-1">Arquivo: {pdfResult.fileName}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                if (pdfResult?.downloadUrl) {
                  window.open(pdfResult.downloadUrl, '_blank');
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </div>
      )}

      {isLoadingDetalhes ? (
        <LoadingSteps
          steps={loadingSteps.steps}
          currentStep={loadingSteps.currentStep}
          context="produto"
          estimatedTime="40-60 segundos"
          isWaitingForResponse={isWaitingForResponse}
        />
      ) : errorLoadingProduto ? (
        <ErrorState />
      ) : produto ? (
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
            <Card className="p-6 border-[#4361EE]/10">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#f0f0ff] to-white p-4 rounded-lg border border-[#4361EE]/10">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Nome do Produto:</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-[#4361EE]"
                      onClick={() => copiarTexto(produto.nome)}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-lg font-semibold">{produto.nome}</p>
                </div>

                <div className="bg-gradient-to-r from-[#f0f0ff] to-white p-4 rounded-lg border border-[#4361EE]/10">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Descrição:</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-[#4361EE]"
                      onClick={() => copiarTexto(produto.descricao)}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copiar
                    </Button>
                  </div>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                       {produto.descricao}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-[#f0f0ff] to-white p-4 rounded-lg border border-[#4361EE]/10">
                    <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-500">Persona:</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-[#4361EE]"
                        onClick={() => copiarTexto(JSON.stringify(produto.persona, null, 2))}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                        Copiar JSON
                    </Button>
                    </div>

                    <div className="space-y-4">
                       <PersonaSectionCard title="Perfil Demográfico" icon={UserRound} colorClass="blue">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                               <PersonaListItem icon={Calendar} text={`Idade: ${produto.persona?.perfilDemografico?.idade}`} />
                               <PersonaListItem icon={Users} text={`Gênero: ${produto.persona?.perfilDemografico?.genero}`} />
                               <PersonaListItem icon={MapPin} text={`Localização: ${produto.persona?.perfilDemografico?.localizacao}`} />
                               <PersonaListItem icon={GraduationCap} text={`Escolaridade: ${produto.persona?.perfilDemografico?.escolaridade}`} />
                               <PersonaListItem icon={DollarSign} text={`Renda: ${produto.persona?.perfilDemografico?.renda}`} />
                               <PersonaListItem icon={Briefcase} text={`Ocupação: ${produto.persona?.perfilDemografico?.ocupacao}`} />
                        </div>
                       </PersonaSectionCard>

                        <PersonaSectionCard title="Comportamento Online" icon={Smartphone} colorClass="purple">
                           <ul className="space-y-1">
                                <PersonaListItem icon={Clock} text={`Tempo online: ${produto.persona?.comportamentoOnline?.tempoOnline}`} />
                                <PersonaListItem icon={Smartphone} text={`Dispositivos: ${produto.persona?.comportamentoOnline?.dispositivos}`} />
                                <PersonaListItem icon={Share2} text={`Redes Sociais: ${produto.persona?.comportamentoOnline?.redesSociais}`} />
                           </ul>
                       </PersonaSectionCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <PersonaSectionCard title="Motivações" icon={Lightbulb} colorClass="green">
                          <ul className="space-y-1">
                                   {produto.persona?.motivacoes?.map((item, index) => (
                                       <li key={index} className="flex items-start">
                                           <ChevronRight className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 shrink-0" />
                                           <span className="text-sm">{item}</span>
                            </li>
                                   )) ?? <li>N/A</li>}
                          </ul>
                           </PersonaSectionCard>

                           <PersonaSectionCard title="Pontos de Dor" icon={XCircle} colorClass="red">
                          <ul className="space-y-1">
                                   {produto.persona?.pontosDeDor?.map((item, index) => (
                                       <li key={index} className="flex items-start">
                                           <ChevronRight className="h-3.5 w-3.5 text-red-500 mr-1.5 mt-0.5 shrink-0" />
                                           <span className="text-sm">{item}</span>
                            </li>
                                   )) ?? <li>N/A</li>}
                          </ul>
                           </PersonaSectionCard>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <PersonaSectionCard title="Objetivos" icon={Target} colorClass="orange">
                          <ul className="space-y-1">
                                   {produto.persona?.objetivos?.map((item, index) => (
                                       <li key={index} className="flex items-start">
                                           <ChevronRight className="h-3.5 w-3.5 text-orange-500 mr-1.5 mt-0.5 shrink-0" />
                                           <span className="text-sm">{item}</span>
                            </li>
                                   )) ?? <li>N/A</li>}
                          </ul>
                           </PersonaSectionCard>

                           <PersonaSectionCard title="Objeções Comuns" icon={AlertCircle} colorClass="yellow">
                          <ul className="space-y-1">
                                   {produto.persona?.objecoesComuns?.map((item, index) => (
                                       <li key={index} className="flex items-start">
                                            <MessageCircle className="h-3.5 w-3.5 text-yellow-500 mr-1.5 mt-0.5 shrink-0" />
                                           <span className="text-sm italic">"{item}"</span>
                            </li>
                                   )) ?? <li>N/A</li>}
                          </ul>
                           </PersonaSectionCard>
                    </div>

                        <PersonaSectionCard title="Canais de Aquisição" icon={Route} colorClass="indigo">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                {produto.persona?.canaisDeAquisicao?.map((item, index) => {
                                    let IconComponent = FileText;
                                    if (item.toLowerCase().includes("redes sociais") || item.toLowerCase().includes("instagram")) IconComponent = Instagram;
                                    if (item.toLowerCase().includes("email")) IconComponent = Mail;
                                    if (item.toLowerCase().includes("influenciadores")) IconComponent = Users;
                                    if (item.toLowerCase().includes("conteúdo")) IconComponent = FileText;

                                    return (
                                        <li key={index} className="flex items-center list-none">
                                            <IconComponent className="h-4 w-4 text-gray-500 mr-2 shrink-0" />
                                            <span className="text-sm">{item}</span>
                                        </li>
                                    );
                                }) ?? <li>N/A</li>}
                        </div>
                        </PersonaSectionCard>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#f0f0ff] to-white p-4 rounded-lg border border-[#4361EE]/10">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Valor de Venda:</h3>
                  <p className="text-2xl font-bold text-[#4361EE]">R$ {produto.valorVenda.toFixed(2)}</p>
                </div>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="copy">
            <Card className="p-6 border-[#4361EE]/10">
              {copyState.isLoading ? (
                <div className="py-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-pulse mb-4">
                      <FileText className="h-16 w-16 text-[#4361EE]/50" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Gerando texto persuasivo...</h3>
                    <p className="text-gray-500 text-center max-w-md mb-6">
                      Estamos criando uma página de vendas de alta conversão baseada nos dados do seu produto
                    </p>
                    
                    {/* Barra de progresso simulada */}
                    <CopyProgressBar />
                    
                    {/* Dicas rotativas */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-md">
                      <div className="flex items-start">
                        <Lightbulb className="h-5 w-5 text-[#4361EE] mr-2 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-[#4361EE] block mb-1">Dica do especialista:</span>
                          Uma boa página de vendas segue a estrutura AIDA: Atenção, Interesse, Desejo e Ação.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : copyState.error ? (
                <div className="text-center text-red-600">
                  <AlertTriangle className="h-6 w-6 inline-block mr-2" />
                  Erro ao gerar copy: {copyState.error}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="ml-4"
                    onClick={() => { 
                        if (produto) { 
                            executeGerarCopy(produto); 
                        }
                    }}
                    disabled={!produto || isLoadingCopy}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              ) : copyState.text ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Copy para Página de Vendas:</h3>
                    <Button
                      variant="outline" size="sm"
                      className="text-[#4361EE] border-[#4361EE]/20"
                      onClick={() => copiarTexto(copyState.text)}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      <span className="text-xs">Copiar Texto</span>
                    </Button>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line p-4 bg-gradient-to-r from-[#f0f0ff] to-white rounded-lg border border-[#4361EE]/10">
                    {copyState.text}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-400 italic">Copy de vendas não gerada ou vazia.</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>

          <div className="pt-6">
        <Button
          onClick={handleContinue}
              className="w-full py-6 bg-[#4361EE] hover:bg-[#4361EE]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
              disabled={isLoadingDetalhes || copyState.isLoading}
        >
          {copyState.isLoading ? "Gerando Copy..." : "Continuar para Order Bumps"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
            <p className="text-gray-500">Não foi possível carregar os detalhes do produto.</p>
            <Button
                onClick={() => { if(nicho && subnicho) gerarDetalhesProduto(nicho, subnicho) }}
                variant="outline"
                className="mt-4"
                disabled={!nicho || !subnicho || isLoadingDetalhes}
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Gerar Novamente
        </Button>
      </div>
      )}
    </div>
  )
}
