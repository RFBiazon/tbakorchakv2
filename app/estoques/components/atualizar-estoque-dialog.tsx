import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CadastrarProdutoDialog } from "./cadastrar-produto-dialog"
import { processarAtualizacoesEstoque } from "@/lib/atualizar-estoque"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

// Mapa de emojis para categorias
const CATEGORIA_EMOJIS = {
  sorvetes: "🍦",
  acai: "🫐",
  acompanhamentos: "🍫",
  congelados: "❄️",
  utensilhos: "🥄",
  colecionaveis: "🎁",
  potes: "🥡",
  sazonais: "🎯",
  campanhas: "📢"
}

interface ProdutoNaoEncontrado {
  nome: string
  quantidade_recebida: number
  sugestoes: Array<{
    id: number
    nome: string
    categoria: string
    similaridade: number
  }>
}

interface AtualizarEstoqueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AtualizarEstoqueDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: AtualizarEstoqueDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [produtosNaoEncontrados, setProdutosNaoEncontrados] = useState<ProdutoNaoEncontrado[]>([])
  const [showCadastroDialog, setShowCadastroDialog] = useState(false)
  const [produtoParaVincular, setProdutoParaVincular] = useState<ProdutoNaoEncontrado | null>(null)
  const [produtosAtualizados, setProdutosAtualizados] = useState<string[]>([])
  const [produtosCadastrados, setProdutosCadastrados] = useState<string[]>([])

  // Carrega os produtos não encontrados assim que o diálogo abre
  useEffect(() => {
    if (open) {
      handleAtualizarEstoque()
    }
  }, [open])

  const handleAtualizarEstoque = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const resultado = await processarAtualizacoesEstoque()
      setProdutosNaoEncontrados(resultado.produtosNaoEncontrados)
      setProdutosAtualizados(resultado.produtosAtualizados)

      if (resultado.produtosNaoEncontrados.length === 0) {
        onSuccess?.()
        onOpenChange(false)
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'O estoque já foi atualizado anteriormente') {
        setError('Sem movimentações de pedidos.')
      } else {
        setError('Ocorreu um erro ao verificar o estoque. Por favor, tente novamente.')
      }
      console.error('Erro ao atualizar estoque:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Estoque</DialogTitle>
            <DialogDescription>
              Atualiza o estoque com base nas conferências realizadas.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <div className="ml-2">
                <AlertTitle className="text-base mb-1">Não é possível atualizar o estoque:</AlertTitle>
                <AlertDescription>
                  Sem movimentações de pedidos.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Atualizando estoque...</span>
            </div>
          ) : produtosNaoEncontrados.length > 0 ? (
            <div className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <AlertTitle className="flex items-center gap-2">
                  {produtosNaoEncontrados.length} produtos não encontrados
                </AlertTitle>
                <AlertDescription className="text-amber-700">
                  Os seguintes produtos precisam ser cadastrados:
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {produtosNaoEncontrados.map((produto) => (
                  <div 
                    key={produto.nome} 
                    className="p-4 border border-gray-800 rounded-lg bg-[#030712]"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-lg text-white">{produto.nome}</p>
                        <p className="text-sm text-gray-400">
                          Quantidade recebida: {produto.quantidade_recebida}
                        </p>
                      </div>
                      {!produtosCadastrados.includes(produto.nome) && (
                        <Button 
                          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                          onClick={() => {
                            setProdutoParaVincular(produto)
                            setShowCadastroDialog(true)
                          }}
                        >
                          Cadastrar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : produtosAtualizados.length > 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Sucesso</AlertTitle>
              <AlertDescription>
                {produtosAtualizados.length} produtos foram atualizados com sucesso.
              </AlertDescription>
            </Alert>
          ) : null}
        </DialogContent>
      </Dialog>

      {showCadastroDialog && produtoParaVincular && (
        <CadastrarProdutoDialog
          open={showCadastroDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowCadastroDialog(false)
              setProdutoParaVincular(null)
            }
          }}
          produto={produtoParaVincular}
          temMaisProdutos={produtosNaoEncontrados.length > 1}
          onCadastro={(categoria) => {
            // Adiciona o produto à lista de cadastrados
            setProdutosCadastrados(prev => [...prev, produtoParaVincular.nome])
            
            // Remove o produto da lista de não encontrados apenas se não houver mais produtos
            if (produtosNaoEncontrados.length <= 1) {
              setProdutosNaoEncontrados([])
              onSuccess?.()
              onOpenChange(false)
            } else {
              setShowCadastroDialog(false)
              setProdutoParaVincular(null)
            }
          }}
        />
      )}
    </>
  )
} 