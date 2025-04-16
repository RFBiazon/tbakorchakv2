"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getPedidoById, deletarPendencias, salvarConferencia, salvarPendencias } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Package, AlertTriangle, Lock, XCircle, HelpCircle } from "lucide-react"

type Produto = {
  nome: string
  quantidade: number
  recebido: number
  motivo: string
}

// Defina os motivos com seus respectivos ícones
const motivos = [
  { value: "Embalagem Danificada", icon: <Package className="mr-2 h-4 w-4 text-orange-500" /> },
  { value: "Produto Vencido", icon: <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" /> },
  { value: "Embalagem Violada", icon: <Lock className="mr-2 h-4 w-4 text-red-500" /> },
  { value: "Produto Ausente", icon: <XCircle className="mr-2 h-4 w-4 text-red-500" /> },
  { value: "Outros", icon: <HelpCircle className="mr-2 h-4 w-4 text-blue-500" /> },
]

type ProdutoConferido = {
  produto: string
  quantidade_pedida: number
  quantidade_recebida: number
  motivo_devolucao: string | null
}

type Pendencia = {
  pedido_id: string
  numero_pedido: string
  produto: string
  quantidade_pedida: number
  quantidade_recebida: number
  quantidade_faltante: number
  motivo_devolucao: string
  responsavel: string
  data: string
}

export function ConferenciaPedido({ pedidoId }: { pedidoId: string }) {
  const router = useRouter()
  const [numeroPedido, setNumeroPedido] = useState<string>("")
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [responsavel, setResponsavel] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [motivosPersonalizados, setMotivosPersonalizados] = useState<{ [key: string]: string }>({})
  const [redirecionar, setRedirecionar] = useState(false)

  useEffect(() => {
    carregarPedido()
  }, [pedidoId])

  async function carregarPedido() {
    try {
      setLoading(true)
      const data = await getPedidoById(pedidoId)

      if (!data) {
        setError("Pedido não encontrado")
        return
      }

      const linhas = data.content.split("\n")
      const produtosExtraidos: Produto[] = []

      // Extrair número do pedido da primeira linha
      const primeiraLinha = linhas[0]
      const numeroPedidoMatch = primeiraLinha.split(",")[1]?.replaceAll('"', "").trim() || "Desconhecido"
      setNumeroPedido(numeroPedidoMatch)

      linhas.forEach((l: string) => {
        const ignorar = /total|peso|valor|Num\. Pedido|OBSERVACAO|PRODUTO/i
        if (!ignorar.test(l)) {
          const col = l.split(",").map((x: string) => x.replaceAll('"', "").trim())
          const produto = col[0]
          const quantidade = Number.parseInt(col[1])
          if (produto && !isNaN(quantidade)) {
            const nomeProduto = produto
              .split(" ")
              .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
              .join(" ")
            produtosExtraidos.push({
              nome: nomeProduto,
              quantidade,
              recebido: 0,
              motivo: "",
            })
          }
        }
      })

      setProdutos(produtosExtraidos)
    } catch (err) {
      console.error("Erro ao carregar pedido:", err)
      setError("Erro ao carregar o pedido. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function ajustarQuantidade(index: number, delta: number) {
    setProdutos((prev) => {
      const novos = [...prev]
      const produto = novos[index]
      const novoValor = Math.min(Math.max(0, produto.recebido + delta), produto.quantidade)
      novos[index] = {
        ...produto,
        recebido: novoValor,
        motivo: novoValor < produto.quantidade ? produto.motivo : "",
      }
      return novos
    })
  }

  function validarQuantidade(index: number, valor: string) {
    const numeroValor = Number.parseInt(valor)

    setProdutos((prev) => {
      const novos = [...prev]
      const produto = novos[index]
      const novoValor = isNaN(numeroValor) ? 0 : Math.min(Math.max(0, numeroValor), produto.quantidade)
      novos[index] = {
        ...produto,
        recebido: novoValor,
        motivo: novoValor < produto.quantidade ? produto.motivo : "",
      }
      return novos
    })
  }

  function abrirModalResponsavel() {
    // Verificar se todos os campos de quantidade recebida estão preenchidos  {
    // Verificar se todos os campos de quantidade recebida estão preenchidos
    const camposVazios = produtos.some((p) => p.recebido === undefined)

    if (camposVazios) {
      setMensagem("Por favor, preencha a quantidade recebida para todos os produtos antes de salvar a conferência.")
      return
    }

    // Verificar se há produtos com quantidade recebida menor que a pedida sem motivo selecionado
    const produtosSemMotivo = produtos.some((p) => p.recebido < p.quantidade && !p.motivo)

    if (produtosSemMotivo) {
      setMensagem("Por favor, selecione o motivo para todos os produtos com quantidade recebida menor que a pedida.")
      return
    }

    // Abrir o modal
    setModalAberto(true)
  }

  function fecharModalResponsavel() {
    setModalAberto(false)
    setResponsavel("")
  }

  function confirmarResponsavel() {
    if (!responsavel.trim()) {
      setMensagem("O nome do responsável é obrigatório para salvar a conferência.")
      return
    }

    fecharModalResponsavel()
    enviarConferencia()
  }

  async function enviarConferencia() {
    try {
      setSalvando(true)
      const produtosArray: ProdutoConferido[] = []
      const pendencias: Pendencia[] = []
      let totalRecebido = 0

      // Primeiro calcula o total recebido
      produtos.forEach((p) => {
        totalRecebido += p.recebido
      })

      // Depois processa os produtos e pendências
      produtos.forEach((p) => {
        const quantidade_pedida = p.quantidade
        const quantidade_recebida = p.recebido
        const quantidade_faltante = quantidade_pedida - quantidade_recebida
        const motivo_devolucao = p.motivo

        produtosArray.push({
          produto: p.nome,
          quantidade_pedida,
          quantidade_recebida,
          motivo_devolucao: quantidade_faltante > 0 ? motivo_devolucao : null,
        })

        if (quantidade_faltante > 0) {
          pendencias.push({
            pedido_id: pedidoId,
            numero_pedido: numeroPedido,
            produto: p.nome,
            quantidade_pedida,
            quantidade_recebida,
            quantidade_faltante,
            motivo_devolucao,
            responsavel,
            data: new Date().toISOString().split('T')[0],
          })
        }
      })

      console.log("Deletando pendências antigas...")
      // Apaga as pendências antigas
      const deleteResult = await deletarPendencias(pedidoId)
      if (deleteResult.error) {
        throw new Error(`Erro ao deletar pendências antigas: ${deleteResult.error}`)
      }

      console.log("Salvando novas pendências...")
      // Salva novas pendências se houver
      if (pendencias.length > 0) {
        const dadosPendencias = {
          pedidoId,
          numeroPedido,
          produtos: pendencias.map(p => ({
            produto: p.produto,
            quantidade_pedida: p.quantidade_pedida,
            quantidade_recebida: p.quantidade_recebida,
            quantidade_faltante: p.quantidade_faltante,
            motivo_devolucao: p.motivo_devolucao
          })),
          responsavel
        }

        const pendenciasResult = await salvarPendencias(dadosPendencias)
        if (pendenciasResult.error) {
          throw new Error(`Erro ao salvar pendências: ${pendenciasResult.error}`)
        }
      }

      console.log("Salvando conferência...")
      // Salva a conferência
      const dadosConferencia = {
        pedido_id: pedidoId,
        quantidade_recebida: totalRecebido,
        total_conferida: totalRecebido,
        produtos: JSON.stringify(produtosArray),
        responsavel,
        data: new Date().toISOString().split('T')[0],
      }

      const conferenciaResult = await salvarConferencia(dadosConferencia)
      if (conferenciaResult.error) {
        throw new Error(`Erro ao salvar conferência: ${conferenciaResult.error}`)
      }

      // Atualiza a mensagem e inicia a transição
      setMensagem(pendencias.length > 0 
        ? "⚠️ Pedido conferido com itens pendentes" 
        : "✅ Pedido conferido sem pendências"
      )
      setRedirecionar(true)
      setTimeout(() => router.push("/pedidos"), 3500)
    } catch (error: any) {
      console.error("Erro na operação:", error)
      console.error("Detalhes completos:", {
        error,
        pedidoId,
        numeroPedido,
        produtos,
        responsavel,
      })
      setMensagem(`❌ ${error.message || 'Erro desconhecido ao processar a conferência'}. Por favor, tente novamente.`)
    } finally {
      setSalvando(false)
    }
  }

  function atualizarMotivo(index: number, motivo: string) {
    setProdutos((prev) => {
      const novos = [...prev]
      novos[index] = { 
        ...novos[index], 
        motivo: motivo 
      }
      return novos
    })
  }

  function atualizarMotivoPersonalizado(index: number, texto: string) {
    setMotivosPersonalizados(prev => ({
      ...prev,
      [index]: texto
    }))
    
    setProdutos((prev) => {
      const novos = [...prev]
      novos[index] = { 
        ...novos[index], 
        motivo: texto || "Outros"
      }
      return novos
    })
  }

  // Função para calcular o status atual do pedido
  const calcularStatusPedido = () => {
    const totalItens = produtos.reduce((acc, p) => acc + p.quantidade, 0)
    const totalRecebido = produtos.reduce((acc, p) => acc + p.recebido, 0)
    const itensFaltantes = totalItens - totalRecebido

    if (totalRecebido === 0) return `📦 Total: ${totalItens} itens`
    if (itensFaltantes === 0) return "✅ Tudo Recebido"
    return `⚠️ ${itensFaltantes} ${itensFaltantes === 1 ? 'Item Pendente' : 'Itens Pendentes'}`
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Carregando pedido...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/20 border border-destructive p-4 rounded-md text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={carregarPedido} variant="outline" className="mt-2">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">📝 Conferência do Pedido</h1>
        <Link href="/pedidos" className="text-foreground hover:text-primary text-xl md:text-2xl" title="Voltar para pedidos">
          <Home />
        </Link>
      </div>

      <p className="mb-4 md:mb-6 text-sm text-muted-foreground">
        Pedido #{numeroPedido} (ID: {pedidoId})
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-[hsl(var(--table-header))] text-[hsl(var(--table-header-foreground))]">
              <th className="p-3 text-left text-xs md:text-sm font-medium">Produto</th>
              <th className="p-3 text-center text-xs md:text-sm font-medium">Qtd. Pedida</th>
              <th className="p-3 text-center text-xs md:text-sm font-medium">Qtd. Recebida</th>
              <th className="p-3 text-center text-xs md:text-sm font-medium">Atualizar Quantidade</th>
              <th className="p-3 text-left text-xs md:text-sm font-medium">Motivo (se necessário)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-[hsl(var(--table-row))] text-[hsl(var(--table-row-foreground))]">
            {produtos.map((produto, index) => (
              <tr key={index} className="hover:bg-[hsl(var(--table-row-hover))]">
                <td className="p-2 text-left text-xs md:text-sm">{produto.nome}</td>
                <td className="p-2 text-center text-xs md:text-sm">{produto.quantidade}</td>
                <td className="p-2 text-center text-xs md:text-sm">{produto.recebido}</td>
                <td className="p-2 text-center">
                  <div className="inline-flex items-center rounded-md bg-background border border-input">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 text-foreground"
                      onClick={() => ajustarQuantidade(index, -1)}
                      disabled={produto.recebido <= 0}
                    >
                      -
                    </Button>
                    <Input
                      type="text"
                      value={produto.recebido}
                      onChange={(e) => validarQuantidade(index, e.target.value)}
                      className="h-8 w-8 border-0 bg-transparent p-0 text-center text-foreground focus:outline-none focus:ring-0"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 text-foreground"
                      onClick={() => ajustarQuantidade(index, 1)}
                      disabled={produto.recebido >= produto.quantidade}
                    >
                      +
                    </Button>
                  </div>
                </td>
                <td className="p-2">
                  {produto.recebido === produto.quantidade ? (
                    <div className="text-green-500 font-medium">✅ Completo</div>
                  ) : produto.recebido < produto.quantidade ? (
                    <div className="space-y-2">
                      <Select 
                        value={produto.motivo === "Outros" || motivosPersonalizados[index] ? "Outros" : produto.motivo}
                        onValueChange={(valor) => atualizarMotivo(index, valor)}
                      >
                        <SelectTrigger className="w-full text-foreground">
                          <SelectValue placeholder="Selecione o motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {motivos.map((motivo) => (
                            <SelectItem 
                              key={motivo.value} 
                              value={motivo.value}
                              className="text-foreground"
                            >
                              <div className="flex items-center">
                                {motivo.icon}
                                {motivo.value}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {(produto.motivo === "Outros" || motivosPersonalizados[index]) && (
                        <Input
                          type="text"
                          placeholder="Digite o motivo"
                          value={motivosPersonalizados[index] || ""}
                          onChange={(e) => atualizarMotivoPersonalizado(index, e.target.value)}
                          className="w-full text-foreground"
                        />
                      )}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-2">
        <div className="text-lg font-medium">
          {calcularStatusPedido()}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-start w-full mb-4 gap-2">
        <Button variant="default" onClick={abrirModalResponsavel} className="w-full md:w-auto" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar Conferência"}
        </Button>
      </div>

      {mensagem && redirecionar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
          <div className="bg-background p-6 rounded-lg shadow-lg text-center transform scale-100 transition-transform duration-300">
            <p className="text-2xl font-medium">{mensagem}</p>
          </div>
        </div>
      )}

      {mensagem && !redirecionar && (
        <p className="mt-4 text-center text-primary">{mensagem}</p>
      )}

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="bg-background [&_*]:text-black dark:[&_*]:text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight">Nome do Responsável</DialogTitle>
            <DialogDescription>Por favor, informe o nome do responsável pela conferência:</DialogDescription>
          </DialogHeader>
          <Input
            id="nomeResponsavel"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            placeholder="Digite o nome completo"
            className="mt-2"
            autoFocus
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={fecharModalResponsavel}
            >
              Cancelar
            </Button>
            <Button onClick={confirmarResponsavel} className="text-white">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
