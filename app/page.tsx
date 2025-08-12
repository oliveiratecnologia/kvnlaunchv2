"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Sparkles, BarChart3, Zap } from "lucide-react"
import { KriptoLogo } from "@/components/kripto-logo"
import { ClienteCadastroModal } from "@/components/cliente-cadastro-modal"

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleCadastroSuccess = (clienteId: string) => {
    // Armazenar o ID do cliente no sessionStorage para uso durante a criação
    sessionStorage.setItem('clienteId', clienteId)
    
    // Fechar modal
    setIsModalOpen(false)
    
    // Redirecionar para a criação do funil
    router.push('/criar/nicho')
  }

  const handleIniciarCriacao = () => {
    setIsModalOpen(true);
  }

  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* Header minimalista */}
      <header className="container mx-auto py-4 sm:py-6 px-4">
        <div className="flex justify-center">
          <KriptoLogo className="h-8 sm:h-10 w-auto" />
        </div>
      </header>

      {/* Hero section simplificada */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Crie seu funil de vendas
              <br className="hidden sm:inline" /> em minutos
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              Gere um funil completo de produto digital em apenas 7 passos
            </p>
            <div className="pt-4 sm:pt-6">
              <button
                onClick={handleIniciarCriacao}
                className="inline-flex items-center justify-center bg-[#4361EE] hover:bg-[#3a56d4] text-white px-6 sm:px-8 py-4 sm:py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-base sm:text-lg font-medium"
                id="criar-funil-hero"
              >
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de benefícios com design minimalista */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Por que usar nosso criador de funis?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="bg-blue-50 p-3 rounded-full mb-4 sm:mb-5">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-[#4361EE]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Rápido e eficiente</h3>
              <p className="text-gray-600 text-sm sm:text-base">Crie um funil completo em minutos, não em semanas ou meses</p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="bg-blue-50 p-3 rounded-full mb-4 sm:mb-5">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-[#4361EE]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Maximize vendas</h3>
              <p className="text-gray-600 text-sm sm:text-base">Estrutura otimizada para aumentar o valor médio de cada cliente</p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center sm:col-span-2 md:col-span-1 sm:max-w-md sm:mx-auto md:max-w-none">
              <div className="bg-blue-50 p-3 rounded-full mb-4 sm:mb-5">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[#4361EE]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Ideias prontas</h3>
              <p className="text-gray-600 text-sm sm:text-base">Supere o bloqueio criativo com sugestões geradas automaticamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de como funciona - visual clean */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Como funciona</h2>
            <p className="text-gray-600 mt-2 sm:mt-4 max-w-2xl mx-auto px-2 text-sm sm:text-base">
              Nosso processo de 7 passos torna a criação de funis de vendas simples e eficiente
            </p>
          </div>

          <div className="relative">
            {/* Linha de conexão */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-100 -translate-x-1/2 hidden md:block"></div>

            <div className="space-y-8 sm:space-y-12 relative">
              {/* Passo 1 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="md:text-right order-1 mb-4 md:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-[#4361EE] tracking-wider">PASSO 1</span>
                  <h3 className="text-lg sm:text-xl font-semibold mt-1 mb-1 sm:mb-2">Escolha seu nicho</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Digite o nicho de mercado que você deseja explorar</p>
                </div>
                <div className="order-2 relative">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 shadow-sm relative md:ml-8">
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4361EE] text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-semibold hidden md:flex">
                      1
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-md border border-gray-100">
                      <p className="text-gray-800 font-medium text-sm sm:text-base">Marketing Digital</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="order-2 md:text-left mb-4 md:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-[#4361EE] tracking-wider">PASSO 2</span>
                  <h3 className="text-lg sm:text-xl font-semibold mt-1 mb-1 sm:mb-2">Selecione um subnicho</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Escolha entre os subnichos mais lucrativos para seu mercado</p>
                </div>
                <div className="order-1 relative">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 shadow-sm relative md:mr-8">
                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-[#4361EE] text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-semibold hidden md:flex">
                      2
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-md border border-gray-100">
                      <p className="text-gray-800 font-medium text-sm sm:text-base">Marketing Digital para Afiliados</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="md:text-right order-1 mb-4 md:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-[#4361EE] tracking-wider">PASSO 3</span>
                  <h3 className="text-lg sm:text-xl font-semibold mt-1 mb-1 sm:mb-2">Produto principal</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Criamos seu produto principal de R$ 47</p>
                </div>
                <div className="order-2 relative">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 shadow-sm relative md:ml-8">
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4361EE] text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-semibold hidden md:flex">
                      3
                    </div>
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-md border border-blue-100">
                      <p className="text-gray-800 font-medium text-sm sm:text-base">Método Completo de Marketing Digital para Afiliados</p>
                      <p className="text-[#4361EE] font-semibold mt-1 sm:mt-2 text-sm sm:text-base">R$ 47,00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 4 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="order-2 md:text-left mb-4 md:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-[#4361EE] tracking-wider">PASSO 4</span>
                  <h3 className="text-lg sm:text-xl font-semibold mt-1 mb-1 sm:mb-2">Order Bumps</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Adicione 5 ofertas complementares de R$ 9,90 cada</p>
                </div>
                <div className="order-1 relative">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 shadow-sm relative md:mr-8">
                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-[#4361EE] text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-semibold hidden md:flex">
                      4
                    </div>
                    <div className="bg-green-50 p-3 sm:p-4 rounded-md border border-green-100">
                      <p className="text-gray-800 font-medium text-sm sm:text-base">5 Order Bumps complementares</p>
                      <p className="text-green-600 font-semibold mt-1 sm:mt-2 text-sm sm:text-base">5x R$ 9,90</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 5 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="md:text-right order-1 mb-4 md:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-[#4361EE] tracking-wider">PASSO 5</span>
                  <h3 className="text-lg sm:text-xl font-semibold mt-1 mb-1 sm:mb-2">Upsell</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Ofereça um upgrade premium após a compra principal</p>
                </div>
                <div className="order-2 relative">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 shadow-sm relative md:ml-8">
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4361EE] text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-semibold hidden md:flex">
                      5
                    </div>
                    <div className="bg-purple-50 p-3 sm:p-4 rounded-md border border-purple-100">
                      <p className="text-gray-800 font-medium text-sm sm:text-base">Programa Avançado de Marketing Digital para Afiliados</p>
                      <p className="text-purple-600 font-semibold mt-1 sm:mt-2 text-sm sm:text-base">R$ 97,00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 6 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="order-2 md:text-left mb-4 md:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-[#4361EE] tracking-wider">PASSO 6</span>
                  <h3 className="text-lg sm:text-xl font-semibold mt-1 mb-1 sm:mb-2">Downsell</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Ofereça uma alternativa mais acessível caso o cliente recuse o upsell</p>
                </div>
                <div className="order-1 relative">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 shadow-sm relative md:mr-8">
                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-[#4361EE] text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-semibold hidden md:flex">
                      6
                    </div>
                    <div className="bg-orange-50 p-3 sm:p-4 rounded-md border border-orange-100">
                      <p className="text-gray-800 font-medium text-sm sm:text-base">Guia Essencial de Marketing Digital para Afiliados</p>
                      <p className="text-orange-600 font-semibold mt-1 sm:mt-2 text-sm sm:text-base">R$ 27,00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 7 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="md:text-right order-1 mb-4 md:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-[#4361EE] tracking-wider">PASSO 7</span>
                  <h3 className="text-lg sm:text-xl font-semibold mt-1 mb-1 sm:mb-2">Resumo</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Visualize e baixe seu funil de vendas completo</p>
                </div>
                <div className="order-2 relative">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 shadow-sm relative md:ml-8">
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4361EE] text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-semibold hidden md:flex">
                      7
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-md border border-gray-100">
                      <p className="text-gray-800 font-medium text-sm sm:text-base">Funil de vendas completo</p>
                      <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                        Valor potencial: <span className="text-[#4361EE] font-semibold">R$ 193,50</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final minimalista */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-6">Pronto para criar seu funil?</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-2">
            Comece agora e tenha seu funil de vendas completo em 3 minutos
          </p>
          <button
            onClick={handleIniciarCriacao}
            className="inline-flex items-center justify-center bg-[#4361EE] hover:bg-[#3a56d4] text-white px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-base sm:text-lg font-medium"
            id="criar-funil-cta"
          >
            Criar meu funil agora
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </section>

      {/* Modal de cadastro do cliente */}
      <ClienteCadastroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCadastroSuccess}
      />
    </main>
  )
}
