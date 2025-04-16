import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ListaPedidos } from "@/components/lista-pedidos"

export default function PedidosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ListaPedidos />
      </div>
    </DashboardLayout>
  )
}