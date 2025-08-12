"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useRouter } from "next/navigation"

// Schema de validação com Zod
const produtoFormSchema = z.object({
  nome: z.string().min(3, {
    message: "O nome do produto deve ter pelo menos 3 caracteres.",
  }),
  descricao: z
    .string()
    .min(10, {
      message: "A descrição deve ter pelo menos 10 caracteres.",
    })
    .max(500, {
      message: "A descrição não pode ter mais de 500 caracteres.",
    }),
  preco: z.coerce.number().min(0.01, {
    message: "O preço deve ser maior que zero.",
  }),
  categoria: z.string({
    required_error: "Selecione uma categoria.",
  }),
  estoque: z.coerce.number().int().min(0, {
    message: "O estoque não pode ser negativo.",
  }),
})

type ProdutoFormValues = z.infer<typeof produtoFormSchema>

// Categorias de exemplo
const categorias = [
  { id: "eletronicos", nome: "Eletrônicos" },
  { id: "computadores", nome: "Computadores" },
  { id: "acessorios", nome: "Acessórios" },
  { id: "moveis", nome: "Móveis" },
  { id: "roupas", nome: "Roupas" },
]

export function ProdutoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Valores padrão
  const defaultValues: Partial<ProdutoFormValues> = {
    nome: "",
    descricao: "",
    preco: 0,
    categoria: "",
    estoque: 0,
  }

  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoFormSchema),
    defaultValues,
  })

  async function onSubmit(data: ProdutoFormValues) {
    setIsSubmitting(true)

    try {
      // Aqui seria implementada a lógica para salvar o produto
      console.log("Dados do produto:", data)

      // Simula um atraso de rede
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redireciona para a lista de produtos
      router.push("/produtos")
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Nome do Produto</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome do produto" {...field} className="text-sm sm:text-base" />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">Nome que identifica seu produto.</FormDescription>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id} className="text-sm sm:text-base">
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs sm:text-sm">Categoria em que o produto se enquadra.</FormDescription>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="preco"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Preço (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} className="text-sm sm:text-base" />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">Preço de venda do produto.</FormDescription>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estoque"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Estoque</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="text-sm sm:text-base" />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">Quantidade disponível em estoque.</FormDescription>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base">Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva seu produto em detalhes" 
                  className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base" 
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-xs sm:text-sm">Descrição detalhada do produto.</FormDescription>
              <FormMessage className="text-xs sm:text-sm" />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-2 sm:pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/produtos")}
            className="w-full sm:w-auto text-sm sm:text-base order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full sm:w-auto text-sm sm:text-base order-1 sm:order-2"
          >
            {isSubmitting ? "Salvando..." : "Salvar Produto"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
