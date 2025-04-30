import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { AtualizarEstoqueDialog } from "./atualizar-estoque-dialog"

interface AtualizarEstoqueButtonProps {
  onSuccess?: () => void
}

export function AtualizarEstoqueButton({ onSuccess }: AtualizarEstoqueButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button 
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Atualizar Estoque
      </Button>

      <AtualizarEstoqueDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  )
} 