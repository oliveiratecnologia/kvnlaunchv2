import { ProdutoForm } from "@/components/produtos/produto-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NovoProdutoPage() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/produtos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Criar Novo Produto</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
          <CardDescription>Preencha os detalhes do seu novo produto</CardDescription>
        </CardHeader>
        <CardContent>
          <ProdutoForm />
        </CardContent>
      </Card>
    </div>
  )
}
