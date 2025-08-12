"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit2Icon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

// Tipos
interface Produto {
  id: string
  nome: string
  preco: number
  categoria: string
  dataCriacao: string
}

// Dados de exemplo
const produtosExemplo: Produto[] = [
  {
    id: "1",
    nome: "Smartphone XYZ",
    preco: 1299.99,
    categoria: "Eletrônicos",
    dataCriacao: "2023-05-15",
  },
  {
    id: "2",
    nome: "Notebook Ultra",
    preco: 3499.99,
    categoria: "Computadores",
    dataCriacao: "2023-06-22",
  },
  {
    id: "3",
    nome: "Fone de Ouvido Bluetooth",
    preco: 199.99,
    categoria: "Acessórios",
    dataCriacao: "2023-07-10",
  },
]

export function ProdutosList() {
  const [produtos, setProdutos] = useState<Produto[]>(produtosExemplo)

  const handleDelete = (id: string) => {
    setProdutos(produtos.filter((produto) => produto.id !== id))
  }

  if (produtos.length === 0) {
    return (
      <Card className="p-4 sm:p-6 text-center">
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">Você ainda não tem produtos cadastrados.</p>
        <Button asChild className="text-sm sm:text-base">
          <Link href="/produtos/novo">Criar Primeiro Produto</Link>
        </Button>
      </Card>
    )
  }

  // Versão da tabela para telas maiores
  const tableView = (
    <div className="rounded-md border hidden sm:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((produto) => (
            <TableRow key={produto.id}>
              <TableCell className="font-medium">{produto.nome}</TableCell>
              <TableCell>{produto.categoria}</TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.preco)}
              </TableCell>
              <TableCell>{new Date(produto.dataCriacao).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/produtos/${produto.id}/editar`}>
                      <Edit2Icon className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(produto.id)}>
                    <Trash2Icon className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  // Versão de cards para telas menores
  const cardView = (
    <div className="space-y-4 sm:hidden">
      {produtos.map((produto) => (
        <Card key={produto.id} className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-base">{produto.nome}</h3>
            <div className="text-right text-sm font-semibold text-primary">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.preco)}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-3">
            <div>Categoria: <span className="text-foreground">{produto.categoria}</span></div>
            <div>Data: <span className="text-foreground">{new Date(produto.dataCriacao).toLocaleDateString("pt-BR")}</span></div>
          </div>
          
          <div className="flex justify-end gap-2 border-t pt-3 mt-2">
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" asChild>
              <Link href={`/produtos/${produto.id}/editar`}>
                <Edit2Icon className="h-3 w-3 mr-1" />
                Editar
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => handleDelete(produto.id)}>
              <Trash2Icon className="h-3 w-3 mr-1" />
              Excluir
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  return (
    <>
      {tableView}
      {cardView}
    </>
  )
}
