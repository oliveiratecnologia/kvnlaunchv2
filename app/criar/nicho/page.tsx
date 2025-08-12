"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, Lightbulb, Search, AlertTriangle, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { gerarSugestoesNichoAction, validarNichoAction } from "@/lib/actions/geracao-actions"
import { useAction } from "next-safe-action/hooks"

export default function NichoPage() {
  const [nicho, setNicho] = useState("")
  const [localSuggestions, setLocalSuggestions] = useState<string[]>([])
  const [sugestoesIniciais, setSugestoesIniciais] = useState<string[]>([
    "Marketing Digital", "Emagrecimento", "Finanças Pessoais",
    "Desenvolvimento Pessoal", "Relacionamentos", "Investimentos"
  ])
  // Estado para controlar quando selecionar uma sugestão aleatória
  const [shouldSelectRandom, setShouldSelectRandom] = useState(false)
  // Adicionar referência ao input
  const inputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  const { toast } = useToast()

  const { execute: executeGerarSugestoes, status: statusGerarSugestoes } = useAction(gerarSugestoesNichoAction, {
    onSuccess: (result) => {
      if (result.data?.suggestions && result.data.suggestions.length > 0) {
        const cleanedSuggestions = result.data.suggestions.map((s: string) => s.trim()).filter(Boolean);

        if (cleanedSuggestions.length > 0) {
            console.log("(onSuccess Hook) Atualizando sugestões iniciais:", cleanedSuggestions);
            setSugestoesIniciais(cleanedSuggestions);
            
            // Selecionar uma sugestão aleatória quando solicitado
            if (shouldSelectRandom) {
              setShouldSelectRandom(false);
              const randomIndex = Math.floor(Math.random() * cleanedSuggestions.length);
              const randomSuggestion = cleanedSuggestions[randomIndex];
              setNicho(randomSuggestion);
              toast({ title: "Sugestão gerada!", description: `Sugerimos o nicho: ${randomSuggestion}` });
            }
        }
      } else {
          console.log("(onSuccess Hook) Nenhuma sugestão retornada pela Action para atualizar a lista.");
      }
    },
    onError: (error) => {
      console.error("(onError Hook) Erro ao gerar/buscar sugestões:", error);
      toast({
        title: "Erro ao Buscar Sugestões",
        description: error.error?.serverError || "Falha na comunicação ao buscar sugestões.",
        variant: "destructive",
      });
    },
  });

  const { execute: executeValidarNicho, status: statusValidarNicho } = useAction(validarNichoAction, {
    onSuccess: (result) => {
      if (result.data?.success) {
          localStorage.setItem("criadorProdutos_nicho", result.data.nicho)
          router.push("/criar/subnicho")
      } else {
           toast({ title: "Erro", description: "Falha inesperada na validação do nicho.", variant: "destructive" })
      }
    },
    onError: (error) => {
      const validationError = error.error?.validationErrors?.nicho?._errors?.[0]
      toast({
        title: "Erro ao validar nicho",
        description: validationError || error.error?.serverError || "Não foi possível validar este nicho.",
        variant: "destructive",
        duration: 7000,
      })
    },
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNicho(value)
    if (value.trim()) {
      const filtered = sugestoesIniciais.filter((sugestao) =>
        sugestao.toLowerCase().includes(value.toLowerCase())
      )
      setLocalSuggestions(filtered.length > 0 ? filtered.slice(0, 5) : [])
    } else {
      setLocalSuggestions([])
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setNicho(suggestion)
    setLocalSuggestions([])
  }

  const handleRandomSuggestion = useCallback(async () => {
    setLocalSuggestions([]);
    toast({ title: "Gerando sugestão", description: "Aguarde enquanto geramos uma sugestão de nicho..." });
    
    try {
      // Executar a ação para gerar sugestões
      executeGerarSugestoes({});
      
      // Usar um timeout para dar tempo da API retornar e o estado ser atualizado
      setTimeout(() => {
        // Ver se há sugestões disponíveis para selecionar uma aleatoriamente
        if (sugestoesIniciais.length > 0) {
          const randomIndex = Math.floor(Math.random() * sugestoesIniciais.length);
          const randomSuggestion = sugestoesIniciais[randomIndex];
          
          console.log("Sugestão selecionada:", randomSuggestion);
          
          // Atualizar estado React
          setNicho(randomSuggestion);
          
          // Atualizar o input diretamente através da referência
          if (inputRef.current) {
            inputRef.current.value = randomSuggestion;
            
            // Disparar evento para garantir que o React reconheça a mudança
            const event = new Event('input', { bubbles: true });
            inputRef.current.dispatchEvent(event);
            
            console.log("Input atualizado via ref:", inputRef.current.value);
          }
          
          toast({ title: "Sugestão gerada!", description: `Nicho: ${randomSuggestion}` });
        } else {
          toast({ title: "Aviso", description: "Não foram encontradas sugestões.", variant: "default" });
        }
      }, 2000);
    } catch (error) {
      console.error("Erro ao gerar sugestão:", error);
      toast({ title: "Erro", description: "Não foi possível gerar uma sugestão.", variant: "destructive" });
    }
  }, [executeGerarSugestoes, toast, setNicho, sugestoesIniciais]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nichoTrimmed = nicho.trim()
    if (!nichoTrimmed) {
      toast({ title: "Campo obrigatório", description: "Por favor, digite ou selecione um nicho.", variant: "destructive" })
      return
    }
    executeValidarNicho({ nicho: nichoTrimmed })
  }

  const isLoadingSugestoes = statusGerarSugestoes === 'executing'
  const isLoadingValidacao = statusValidarNicho === 'executing'
  const isOverallLoading = isLoadingSugestoes || isLoadingValidacao

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold text-gray-800">1. Escolha um nicho</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Digite o nicho de mercado que você deseja explorar. Vamos usar essa informação para gerar sugestões de subnichos lucrativos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="nicho"
              placeholder="Ex: Marketing, Emagrecimento, Finanças..."
              value={nicho}
              onChange={handleInputChange}
              className="text-lg py-6 pl-10"
              autoComplete="off"
              disabled={isOverallLoading}
              ref={inputRef}
            />
            {localSuggestions.length > 0 && (
              <div className="absolute w-full bg-white mt-1 rounded-md border border-gray-200 shadow-lg z-10">
                {localSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-[#4361EE]/10 hover:text-[#4361EE] cursor-pointer text-gray-700"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center">
            <Lightbulb className="h-3 w-3 mr-1" /> Dica: Seja específico para obter melhores resultados
          </p>
        </div>

        <div className="flex items-center space-x-2 justify-center">
          <div className="h-px bg-gray-200 flex-grow"></div>
          <span className="text-sm text-gray-500">ou</span>
          <div className="h-px bg-gray-200 flex-grow"></div>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleRandomSuggestion}
            className="text-[#4361EE] border-[#4361EE]/20 hover:bg-[#4361EE] hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isOverallLoading}
          >
            {isLoadingSugestoes ? "Gerando..." : <><Lightbulb className="mr-2 h-4 w-4" />Me dê uma sugestão</>}
          </Button>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full py-6 bg-[#4361EE] hover:bg-[#4361EE]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
            disabled={isOverallLoading}
          >
            {isLoadingValidacao ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validando nicho...
              </>
            ) : (
              <>
                Continuar para subnichos
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </form>

      <Card className="max-w-xl mx-auto bg-gray-50 p-6 border-gray-200">
        <div className="flex">
          <div className="mr-4 flex-shrink-0">
            <div className="bg-[#4361EE] p-2 rounded-full">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-medium text-[#4361EE] mb-2">Dicas para escolher um bom nicho:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2 text-[#4361EE]">•</span>
                <span>Escolha um nicho que você conheça ou tenha interesse</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#4361EE]">•</span>
                <span>Nichos com problemas específicos tendem a ser mais lucrativos</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#4361EE]">•</span>
                <span>Considere nichos com público disposto a investir em soluções</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#4361EE]">•</span>
                <span>Evite nichos extremamente competitivos se você está começando</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
