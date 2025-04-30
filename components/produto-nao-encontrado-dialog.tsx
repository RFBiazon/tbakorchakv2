import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProdutoNaoEncontradoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produtoNome: string
}

export function ProdutoNaoEncontradoDialog({
  open,
  onOpenChange,
  produtoNome,
}: ProdutoNaoEncontradoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Produto Não Encontrado</DialogTitle>
          <DialogDescription>
            O produto &quot;{produtoNome}&quot; não foi encontrado nas tabelas de estoque.
            Por favor, verifique se o nome está correto ou se o produto precisa ser adicionado ao estoque.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 