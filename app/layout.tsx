import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { KirvanoLogo } from "@/components/kirvano-logo"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kripto - Criador de Produtos",
  description: "Crie um funil de vendas completo para seu produto digital em apenas 7 passos simples",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} bg-white text-gray-800 min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <div className="flex-grow">
            {children}
          </div>
          <footer className="bg-white border-t border-gray-100 py-4 sm:py-6 md:py-8">
            <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-center">
              <KirvanoLogo className="h-6 sm:h-8 w-auto mb-2 sm:mb-4" />
              <p className="text-gray-500 text-xs sm:text-sm text-center">
                © {new Date().getFullYear()} Kirvano. Todos os direitos reservados.
              </p>
            </div>
          </footer>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'