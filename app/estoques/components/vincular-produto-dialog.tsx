import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { vincularProduto } from "@/lib/atualizar-estoque"
import { Loader2 } from "lucide-react"

interface VincularProdutoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: {
    nome: string
    quantidade: number
    sugestoes: Array<{
      id: number
      nome: string
      categoria: string
      similaridade: number
    }>
  }
  onVincular: (vinculo: { produtoId: number, categoria: string }) => void
}

export function VincularProdutoDialog({
  open,
  onOpenChange,
  produto,
  onVincular,
}: VincularProdutoDialogProps) {
  const [selectedId, setSelectedId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  async function handleVincular() {
    if (!selectedId) return

    try {
      setLoading(true)
      const sugestao = produto.sugestoes.find(s => s.id.toString() === selectedId)
      if (!sugestao) return

      await vincularProduto(produto.nome, sugestao.id, sugestao.categoria)
      onVincular({ produtoId: sugestao.id, categoria: sugestao.categoria })
    } catch (error) {
      console.error("Erro ao vincular produto:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Vincular Produto</DialogTitle>
          <DialogDescription>
            Selecione o produto correto para vincular com &quot;{produto.nome}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedId}
            onValueChange={setSelectedId}
            className="space-y-3"
          >
            {produto.sugestoes.map((sugestao) => (
              <div key={sugestao.id} className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value={sugestao.id.toString()} id={`sugestao-${sugestao.id}`} />
                <Label
                  htmlFor={`sugestao-${sugestao.id}`}
                  className="font-normal cursor-pointer"
                >
                  <div className="font-medium">{sugestao.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    Categoria: {sugestao.categoria}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Similaridade: {(sugestao.similaridade * 100).toFixed(0)}%
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleVincular}
            disabled={!selectedId || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Vinculando..." : "Vincular Produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 