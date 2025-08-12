"use client"

import { Check } from "lucide-react"
import { useState, useEffect } from "react"

export type LoadingStep = {
  id: number
  title: string
  complete: boolean
}

export interface LoadingStepsProps {
  steps: LoadingStep[]
  currentStep: number
  context?: string
  estimatedTime?: string
  isWaitingForResponse?: boolean
}

export function LoadingSteps({
  steps,
  currentStep,
  context = "",
  estimatedTime = "1 minuto",
  isWaitingForResponse = false
}: LoadingStepsProps) {
  const totalSteps = steps.length
  const progress = Math.min(100, Math.round((currentStep / totalSteps) * 100))
  
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {context.includes("pesquisa") 
              ? "Pesquisando " 
              : context.includes("validação") 
                ? "Validando seu " 
                : context === "downsell" || context === "upsell" || context === "order-bumps"
                  ? "Criando "
                  : "Criando seu "} 
            {context.includes("pesquisa") 
              ? "subnichos" 
              : context.includes("validação") 
                ? "nicho" 
                : context || "produto"}
          </h3>
          <span className="text-sm font-medium text-[#4361EE]">{progress}%</span>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className="bg-[#4361EE] h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Lista de etapas */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center 
                ${currentStep > index 
                  ? "bg-[#4361EE] text-white" 
                  : currentStep === index 
                    ? "bg-[#4361EE]/20 border border-[#4361EE]" 
                    : "bg-gray-200"}`}>
                {currentStep > index && (
                  <Check className="h-3 w-3" />
                )}
              </div>
              <div className={`ml-3 ${currentStep === index ? "text-[#4361EE] font-medium" : ""}`}>
                <span className="text-sm">{step.title}</span>
              </div>
              {currentStep === index && (
                <div className="ml-auto">
                  <div className="animate-pulse flex">
                    <div className="h-2 w-2 bg-[#4361EE] rounded-full mx-0.5"></div>
                    <div className="h-2 w-2 bg-[#4361EE] rounded-full mx-0.5 animation-delay-300"></div>
                    <div className="h-2 w-2 bg-[#4361EE] rounded-full mx-0.5 animation-delay-600"></div>
                  </div>
                </div>
              )}
              {/* Indicador especial para quando está aguardando resposta */}
              {isWaitingForResponse && currentStep === index && index === steps.length - 1 && (
                <div className="ml-auto">
                  <div className="flex items-center text-xs text-[#4361EE]">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-[#4361EE] mr-1"></div>
                    Aguardando...
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>Este processo pode levar até {estimatedTime}</p>
          {context && (
            <p className="mt-1 text-xs text-gray-400">
              Estamos usando IA para
              {context.includes("pesquisa")
                ? " pesquisar"
                : context.includes("validação")
                  ? " validar o"
                  : " criar"}
              {context.includes("pesquisa")
                ? " subnichos"
                : context.includes("validação")
                  ? " seu nicho"
                  : context === "downsell"
                    ? " Downsell"
                    : context === "upsell"
                      ? " Upsell"
                      : context === "order-bumps"
                        ? " Order Bumps"
                        : ` ${context}`}
              {context.includes("pesquisa")
                ? " para o seu nicho"
                : context.includes("validação")
                  ? " antes de prosseguir"
                  : " ideal para o seu produto"}
            </p>
          )}
          {isWaitingForResponse && (
            <p className="mt-2 text-xs text-[#4361EE] font-medium">
              🤖 Aguardando resposta da IA...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente de barra de progresso para copy
export function CopyProgressBar() {
  const [localProgress, setLocalProgress] = useState(0)
  
  useEffect(() => {
    // Definir o progresso para 5% inicialmente para mostrar movimento imediato
    setLocalProgress(5)
    
    // Função para avançar o progresso gradualmente
    const advanceProgress = () => {
      setLocalProgress(prev => {
        // Lógica para evitar saltos grandes e parar em 95%
        if (prev >= 95) return 95
        // Cálculo para avançar mais rápido no início e mais lento conforme se aproxima do final
        const increment = Math.max(1, Math.floor((100 - prev) / 10))
        return Math.min(95, prev + increment)
      })
    }
    
    // Criar um intervalo para atualizar o progresso a cada 1.5 segundos
    const interval = setInterval(advanceProgress, 1500)
    
    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="w-full max-w-sm bg-gray-200 rounded-full h-1.5 mb-6 overflow-hidden">
      <div 
        className="h-1.5 rounded-full bg-[#4361EE]" 
        style={{ 
          width: `${localProgress}%`,
          transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      ></div>
    </div>
  )
} 