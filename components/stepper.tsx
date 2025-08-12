"use client"

import React from "react"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckIcon, PlusCircle, Boxes, Package, ListPlus, ArrowUpRight, ArrowDownRight, FileCheck } from "lucide-react"

const steps = [
  { id: 1, name: "Nicho", href: "/criar/nicho", icon: PlusCircle },
  { id: 2, name: "Subnicho", href: "/criar/subnicho", icon: Boxes },
  { id: 3, name: "Produto Principal", href: "/criar/produto-principal", icon: Package },
  { id: 4, name: "Order Bumps", href: "/criar/order-bumps", icon: ListPlus },
  { id: 5, name: "Upsell", href: "/criar/upsell", icon: ArrowUpRight },
  { id: 6, name: "Downsell", href: "/criar/downsell", icon: ArrowDownRight },
  { id: 7, name: "Resumo", href: "/criar/resumo", icon: FileCheck },
]

export function Stepper() {
  const pathname = usePathname()

  // Determinar o passo atual baseado no pathname
  const currentStepIndex = steps.findIndex((step) => step.href === pathname)
  const currentStep = currentStepIndex !== -1 ? currentStepIndex + 1 : 1

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="hidden md:flex items-center">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const Icon = step.icon

          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div
                  className={cn(
                    "h-1 flex-1 mx-2",
                    index < currentStep ? "bg-gradient-to-r from-[#4361EE] to-[#4361EE]" : "bg-gray-200",
                  )}
                />
              )}
              <div className="relative group">
                <Link
                  href={isCompleted ? step.href : "#"}
                  className={cn(
                    "flex flex-col items-center justify-center relative z-10",
                    isCompleted && "cursor-pointer",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-200",
                      isCompleted
                        ? "bg-[#4361EE] text-white shadow-md shadow-[#4361EE]/20"
                        : isCurrent
                          ? "bg-white ring-2 ring-[#4361EE] text-[#4361EE] shadow-md"
                          : "bg-white ring-2 ring-gray-200 text-gray-400",
                    )}
                  >
                    {isCompleted ? <CheckIcon className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center",
                      isCompleted ? "text-[#4361EE]" : isCurrent ? "text-[#4361EE]" : "text-gray-400",
                    )}
                  >
                    {step.name}
                  </span>
                </Link>
                {isCompleted && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#4361EE] text-white text-xs rounded px-2 py-1 pointer-events-none">
                    Editar
                  </div>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {/* Versão mobile do stepper */}
      <div className="md:hidden flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", "bg-[#4361EE] text-white")}>
            {currentStep}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Passo {currentStep} de 7</p>
            <p className="text-xs text-gray-500">{steps[currentStepIndex]?.name || "Início"}</p>
          </div>
        </div>
        <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-[#4361EE] to-[#4361EE] h-2.5 rounded-full"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
