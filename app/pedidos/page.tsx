import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ListaPedidos } from "@/components/lista-pedidos"
import Link from "next/link"
import { Home } from "lucide-react"

export default function PedidosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Controle de Pedidos</h1>
          <Link href="/" className="text-foreground hover:text-primary text-xl md:text-2xl" title="Voltar para home">
            <Home />
          </Link>
        </div>
        <ListaPedidos />
      </div>
    </DashboardLayout>
  )
} 