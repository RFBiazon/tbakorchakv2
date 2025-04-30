import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { cadastrarProduto } from "@/lib/atualizar-estoque"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const CATEGORIAS = [
  { value: "sorvetes", label: "Sorvetes", emoji: "🍦" },
  { value: "acai", label: "Açaí", emoji: "🫐" },
  { value: "acompanhamentos", label: "Acompanhamentos", emoji: "🍫" },
  { value: "congelados", label: "Congelados", emoji: "❄️" },
  { value: "utensilhos", label: "Utensílios", emoji: "🥄" },
  { value: "colecionaveis", label: "Colecionáveis", emoji: "🎁" },
  { value: "potes", label: "Potes", emoji: "🥡" },
  { value: "sazonais", label: "Sazonais", emoji: "🎯" },
  { value: "campanhas", label: "Campanhas", emoji: "📢" }
]

interface CadastrarProdutoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: {
    nome: string
    quantidade_recebida: number
  }
  onCadastro: (categoria: string) => void
  temMaisProdutos: boolean
}

export function CadastrarProdutoDialog({
  open,
  onOpenChange,
  produto,
  onCadastro,
  temMaisProdutos
}: CadastrarProdutoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [categoria, setCategoria] = useState("")
  const [nome, setNome] = useState(produto.nome)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  async function handleCadastrar() {
    if (!categoria || !nome.trim()) {
      setError("Preencha todos os campos")
      return
    }

    try {
      setLoading(true)
      setError(null)

      await cadastrarProduto({
        nome,
        categoria,
        estoque: produto.quantidade_recebida,
      })

      toast({
        title: "Produto cadastrado com sucesso!",
        description: "Estoque atualizado.",
        duration: 2000,
      })

      if (!temMaisProdutos) {
        onOpenChange(false)
      }
      
      onCadastro(categoria)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao cadastrar produto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Produto</DialogTitle>
          <DialogDescription>
            Cadastre o produto &quot;{produto.nome}&quot; no estoque
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do produto"
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.value}
                  className={`flex items-center gap-2 px-3 py-2 rounded transition-colors text-left ${
                    categoria === cat.value 
                      ? 'bg-[#7C3AED] text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  onClick={() => setCategoria(cat.value)}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="capitalize">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quantidade Inicial</Label>
            <Input
              value={produto.quantidade_recebida}
              disabled
              type="number"
            />
          </div>

          {error && (
            <div className="text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
              onClick={handleCadastrar}
              disabled={loading || !categoria || !nome.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Cadastrando..." : "Cadastrar Produto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 