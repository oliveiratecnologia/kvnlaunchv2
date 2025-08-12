import type React from "react"
import { Stepper } from "@/components/stepper"
import Link from "next/link"
import { Home } from "lucide-react"
import { KriptoLogo } from "@/components/kripto-logo"

export default function CriarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="container mx-auto pt-6 pb-20 px-4">
        <header className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center text-gray-700 hover:text-[#4361EE] transition-colors">
              <Home className="h-5 w-5 mr-2" />
              <span className="font-medium">Início</span>
            </Link>
            <div className="flex items-center">
              <KriptoLogo className="h-8 w-auto" />
              <h1 className="text-2xl md:text-3xl font-bold ml-3 text-gray-800">Criador de Produtos</h1>
            </div>
            <div className="w-24"></div> {/* Espaçador para centralizar o título */}
          </div>
          <Stepper />
        </header>
        <main className="max-w-4xl mx-auto">
          <div className="bg-white text-gray-800 rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
