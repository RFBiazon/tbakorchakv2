import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Relatorios } from "@/components/relatorios"

export default function RelatoriosPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-4 md:py-8">
        <Relatorios />
      </div>
    </DashboardLayout>
  )
}
