import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VisualizarPedido } from "@/components/visualizar-pedido"

export default function VisualizarPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        <VisualizarPedido pedidoId={params.id} />
      </div>
    </DashboardLayout>
  )
}
