"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ControleCaixa } from "@/components/ControleCaixa"

export default function ControleCaixaPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h1 className="text-xl md:text-2xl font-bold">💶 Gerenciamento de Caixa</h1>
        </div>
        <div className="border rounded-xl bg-card p-4 md:p-6 shadow-sm">
          <ControleCaixa />
        </div>
      </div>
    </DashboardLayout>
  )
} 