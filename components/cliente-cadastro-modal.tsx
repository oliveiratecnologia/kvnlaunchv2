"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { X, User, Mail, Phone, Instagram, DollarSign } from "lucide-react"

interface ClienteCadastroData {
  nomeCompleto: string
  email: string
  telefone: string
  instagram: string
  monetizacao: string
}

interface ClienteCadastroModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (clienteId: string) => void
}

export function ClienteCadastroModal({ isOpen, onClose, onSuccess }: ClienteCadastroModalProps) {
  const [formData, setFormData] = useState<ClienteCadastroData>({
    nomeCompleto: "",
    email: "",
    telefone: "",
    instagram: "",
    monetizacao: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: keyof ClienteCadastroData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.nomeCompleto.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, insira seu nome completo",
        variant: "destructive"
      })
      return false
    }

    if (!formData.email.trim()) {
      toast({
        title: "Campo obrigatório", 
        description: "Por favor, insira seu e-mail",
        variant: "destructive"
      })
      return false
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, insira um e-mail válido",
        variant: "destructive"
      })
      return false
    }

    if (!formData.telefone.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, insira seu telefone",
        variant: "destructive"
      })
      return false
    }

    if (!formData.instagram.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, insira seu Instagram",
        variant: "destructive"
      })
      return false
    }

    if (!formData.monetizacao.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva como você monetiza sua audiência",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Tratamento específico para erro 409 (email duplicado)
        if (response.status === 409) {
          toast({
            title: "Email já cadastrado",
            description: errorData.message || "Este e-mail já está cadastrado. Use outro e-mail ou faça login.",
            variant: "destructive"
          })
          return
        }
        
        throw new Error(errorData.message || 'Erro ao cadastrar cliente')
      }

      const { clienteId } = await response.json()

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Agora você pode criar seu funil de vendas",
      })

      // Limpar formulário
      setFormData({
        nomeCompleto: "",
        email: "",
        telefone: "",
        instagram: "",
        monetizacao: ""
      })

      onSuccess(clienteId)
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error)
      const errorMessage = error instanceof Error ? error.message : "Tente novamente em alguns momentos"
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="h-6 w-6 text-[#4361EE]" />
            Vamos começar sua jornada!
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Para criar um funil personalizado e eficaz, precisamos conhecer você melhor. 
            Preencha os dados abaixo para continuar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="nomeCompleto" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome completo *
            </Label>
            <Input
              id="nomeCompleto"
              type="text"
              placeholder="Digite seu nome completo"
              value={formData.nomeCompleto}
              onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
              className="h-12"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mail *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="h-12"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone *
            </Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => handleInputChange("telefone", e.target.value)}
              className="h-12"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Qual seu Instagram? *
            </Label>
            <Input
              id="instagram"
              type="text"
              placeholder="@seuperfil ou https://instagram.com/seuperfil"
              value={formData.instagram}
              onChange={(e) => handleInputChange("instagram", e.target.value)}
              className="h-12"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monetizacao" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Atualmente, como você monetiza a sua audiência? *
            </Label>
            <Textarea
              id="monetizacao"
              placeholder="Descreva como você ganha dinheiro com seu público atual (ex: vendas de produtos, afiliados, serviços, ainda não monetizo, etc.)"
              value={formData.monetizacao}
              onChange={(e) => handleInputChange("monetizacao", e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 bg-[#4361EE] hover:bg-[#3a56d4]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </>
              ) : (
                "Começar criação do funil"
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>🔒 Seus dados estão seguros:</strong> Utilizamos suas informações apenas para personalizar seu funil de vendas e fornecer uma melhor experiência.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
