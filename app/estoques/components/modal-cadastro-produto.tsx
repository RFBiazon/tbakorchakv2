import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseClient } from "@/lib/supabase"
import { Plus } from "lucide-react"

interface ModalCadastroProdutoProps {
  onSuccess: () => void
}

export function ModalCadastroProduto({ onSuccess }: ModalCadastroProdutoProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    item: "",
    categoria: "",
    estoque: "0"
  })

  const categorias = [
    { nome: "Sorvetes", valor: "sorvetes", icone: "🍦" },
    { nome: "Açaí", valor: "acai", icone: "🥣" },
    { nome: "Acompanhamentos", valor: "acompanhamentos", icone: "🍫" },
    { nome: "Congelados", valor: "congelados", icone: "❄️" },
    { nome: "Utensilhos", valor: "utensilhos", icone: "🍴" },
    { nome: "Colecionáveis", valor: "colecionaveis", icone: "🎁" },
    { nome: "Potes", valor: "potes", icone: "🥤" },
    { nome: "Sazonais", valor: "sazonais", icone: "🎯" },
    { nome: "Campanhas", valor: "campanhas", icone: "📢" }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseClient()
      
      const { error } = await supabase
        .from(formData.categoria)
        .insert([
          {
            item: formData.item,
            estoque: parseInt(formData.estoque)
          }
        ])

      if (error) throw error

      setOpen(false)
      setFormData({ item: "", categoria: "", estoque: "0" })
      onSuccess()
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error)
      alert("Erro ao cadastrar produto. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Incluir Produto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">Nome do Produto</Label>
            <Input
              id="item"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              placeholder="Digite o nome do produto"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.valor} value={categoria.valor}>
                    {categoria.icone} {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estoque">Estoque Inicial</Label>
            <Input
              id="estoque"
              type="number"
              min="0"
              value={formData.estoque}
              onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 