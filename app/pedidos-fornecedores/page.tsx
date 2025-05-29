import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function PedidosFornecedoresPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white">📦 Pedidos Demais Fornecedores</h1>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="text-6xl">🚧</div>
            <h2 className="text-xl font-semibold text-foreground">Página em Construção</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Esta página está sendo desenvolvida e será implementada em breve para gerenciar pedidos de outros fornecedores.
            </p>
            <div className="pt-4">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg">
                <span className="text-sm font-medium">
                  Em desenvolvimento...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 