import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ConferenciaPedido } from "@/components/conferencia-pedido"

export default function PedidoPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        <ConferenciaPedido pedidoId={params.id} />
      </div>
    </DashboardLayout>
  )
}
