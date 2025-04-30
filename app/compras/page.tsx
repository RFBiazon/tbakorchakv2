import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CentralCompras } from "@/components/central-compras"

export default function ComprasPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <CentralCompras />
      </div>
    </DashboardLayout>
  )
} 