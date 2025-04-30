import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import type { ProdutoEstoque } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface TabelaEstoqueProps {
  categoria: {
    nome: string
    icone: string
    produtos: ProdutoEstoque[]
    loading: boolean
    error: string | null
  }
  onUpdate: () => void
}

export function TabelaEstoque({ categoria, onUpdate }: TabelaEstoqueProps) {
  const [atualizando, setAtualizando] = useState<{ [key: number]: boolean }>({})
  const [quantidades, setQuantidades] = useState<{ [key: number]: number }>({})
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<ProdutoEstoque | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const capitalizarPalavras = (texto: string) => {
    return texto
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
      .join(' ')
  }

  const getStatusColor = (estoque: number) => {
    if (estoque <= 0) return "text-red-500"
    if (estoque <= 5) return "text-yellow-500"
    return "text-green-500"
  }

  const getStatusIcon = (estoque: number) => {
    if (estoque <= 0) return <XCircle className="h-4 w-4" />
    if (estoque <= 5) return <AlertTriangle className="h-4 w-4" />
    return <CheckCircle2 className="h-4 w-4" />
  }

  const ajustarQuantidade = (produtoId: number, valor: number) => {
    setQuantidades(prev => ({
      ...prev,
      [produtoId]: (prev[produtoId] || 0) + valor
    }))
  }

  const salvarQuantidade = async (produto: ProdutoEstoque) => {
    const diferenca = quantidades[produto.id] || 0
    if (diferenca === 0) return

    try {
      setAtualizando(prev => ({ ...prev, [produto.id]: true }))
      const supabase = getSupabaseClient()
      
      const novoEstoque = (produto.estoque || 0) + diferenca
      
      await supabase
        .from(categoria.nome.toLowerCase())
        .update({ estoque: novoEstoque })
        .eq('id', produto.id)

      setQuantidades(prev => ({ ...prev, [produto.id]: 0 }))
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error)
      alert('Erro ao atualizar estoque. Por favor, tente novamente.')
    } finally {
      setAtualizando(prev => ({ ...prev, [produto.id]: false }))
    }
  }

  const excluirProduto = async () => {
    if (!produtoParaExcluir) return

    try {
      setExcluindo(true)
      const supabase = getSupabaseClient()
      
      const { error } = await supabase
        .from(categoria.nome.toLowerCase())
        .delete()
        .eq('id', produtoParaExcluir.id)

      if (error) throw error

      setProdutoParaExcluir(null)
      onUpdate()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto. Por favor, tente novamente.')
    } finally {
      setExcluindo(false)
    }
  }

  if (categoria.loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (categoria.error) {
    return <p className="text-destructive">{categoria.error}</p>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Item</th>
              <th className="text-center py-2">Estoque</th>
              <th className="text-center py-2">Atualizar</th>
              <th className="text-right py-2">Status</th>
              <th className="text-right py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categoria.produtos.map((produto) => {
              const diferenca = quantidades[produto.id] || 0
              const novoEstoque = (produto.estoque || 0) + diferenca

              return (
                <tr key={produto.id} className="border-b">
                  <td className="py-2">{capitalizarPalavras(produto.item)}</td>
                  <td className="text-center py-2">{produto.estoque}</td>
                  <td className="py-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="inline-flex items-center rounded-md bg-background border border-input">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                          onClick={() => ajustarQuantidade(produto.id, -1)}
                        >
                          -
                        </Button>
                        <span className="h-8 w-8 flex items-center justify-center">
                          {diferenca}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                          onClick={() => ajustarQuantidade(produto.id, 1)}
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => salvarQuantidade(produto)}
                        disabled={diferenca === 0 || atualizando[produto.id]}
                      >
                        {atualizando[produto.id] ? "..." : "Salvar"}
                      </Button>
                    </div>
                  </td>
                  <td className="text-right py-2">
                    <div className={`flex items-center justify-end ${getStatusColor(novoEstoque)}`}>
                      {getStatusIcon(novoEstoque)}
                    </div>
                  </td>
                  <td className="text-right py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive/90"
                      onClick={() => setProdutoParaExcluir(produto)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!produtoParaExcluir} onOpenChange={(open) => !open && setProdutoParaExcluir(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto "{produtoParaExcluir?.item}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setProdutoParaExcluir(null)}
                disabled={excluindo}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={excluirProduto}
                disabled={excluindo}
              >
                {excluindo ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 