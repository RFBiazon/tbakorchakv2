"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  getPedidoById,
  getConferenciaById,
  getPendenciasByPedidoId,
  deletarPendencias,
  salvarConferencia,
  salvarPendencias,
} from "@/lib/supabase"
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
import { Home } from "lucide-react"

interface Conferencia {
  id: number;
  pedido_id: number;
  quantidade_faltante: number;
  motivo: string;
  responsavel: string;
  data: string;
}

type Produto = {
  nome: string
  quantidade: number
  recebido: number
  pendencia?: {
    id: number
    quantidade_faltante: number
    motivo: string
  }
}

type Linha = {
  nome: string
  quantidade: number
  recebido: number
  pendencia?: {
    id: number
    quantidade_faltante: number
    motivo: string
  }
}

type Pendencia = {
  id: number
  quantidade_faltante: number
  motivo: string
}

export function VisualizarPedido({ pedidoId }: { pedidoId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const numeroPedido = searchParams.get("numero") || "Desconhecido"
  const modo = searchParams.get("modo") || "conferido"

  const [produtos, setProdutos] = useState<Linha[]>([])
  const [produtosExibidos, setProdutosExibidos] = useState<Linha[]>([])
  const [conferencia, setConferencia] = useState<Conferencia | null>(null)
  const [pendencias, setPendencias] = useState<Pendencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [responsavel, setResponsavel] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [quantidadesAtualizacao, setQuantidadesAtualizacao] = useState<Record<string, number>>({})

  useEffect(() => {
    carregarDados()
  }, [pedidoId, modo])

  // Modifique o useEffect que filtra os produtos para mostrar apenas produtos com pendências ativas
  useEffect(() => {
    if (modo === "pendente") {
      // Mostrar produtos que têm pendência ou que foram parcialmente atualizados
      setProdutosExibidos(produtos.filter((p) => {
        const quantidadeAtualizada = quantidadesAtualizacao[p.nome] || 0;
        const quantidadeTotal = p.recebido + quantidadeAtualizada;
        return p.pendencia || quantidadeTotal < p.quantidade;
      }));
    } else {
      // Mostrar todos os produtos
      setProdutosExibidos(produtos);
    }
  }, [produtos, modo, quantidadesAtualizacao]);

  // Adicione um useEffect para inicializar as quantidades de atualização
  useEffect(() => {
    if (produtos.length > 0) {
      const quantidadesIniciais = produtos.reduce((acc, produto) => {
        acc[produto.nome] = 0;
        return acc;
      }, {} as { [key: string]: number });
      setQuantidadesAtualizacao(quantidadesIniciais);
    }
  }, [produtos]);

  async function carregarDados() {
    try {
      setLoading(true)

      // Busca o pedido original para referência
      const pedido = await getPedidoById(pedidoId)

      if (!pedido) {
        setError("Pedido não encontrado")
        return
      }

      // Busca dados da conferência
      const dadosConferencia = await getConferenciaById(pedidoId)
      setConferencia(dadosConferencia)

      // Busca as pendências
      const dadosPendencias = await getPendenciasByPedidoId(pedidoId)
      setPendencias(dadosPendencias)

      // Cria um Map das pendências para busca rápida
      const mapaQuantidadesPendentes = new Map()
      dadosPendencias?.forEach((p: any) => {
        mapaQuantidadesPendentes.set(p.produto, {
          id: p.id,
          recebida: p.quantidade_recebida,
          faltante: p.quantidade_faltante,
          motivo: p.motivo_devolucao,
        })
      })

      // Extrai produtos do pedido
      const linhas = pedido.content.split("\n")
      const produtosExtraidos: Linha[] = []

      linhas.forEach((l: string) => {
        const ignorar = /total|peso|valor|Num\. Pedido|OBSERVACAO|PRODUTO/i
        if (!ignorar.test(l)) {
          const col = l.split(",").map((x: string) => x.replaceAll('"', "").trim())
          const produto = col[0]
          const quantidade = Number.parseInt(col[1])
          if (produto && !isNaN(quantidade)) {
            const nomeProduto = produto
              .split(" ")
              .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
              .join(" ")

            // Verifica se o produto tem pendências
            const pendencia = mapaQuantidadesPendentes.get(nomeProduto)
            const quantidadeRecebida = pendencia ? pendencia.recebida : quantidade

            produtosExtraidos.push({
              nome: nomeProduto,
              quantidade,
              recebido: quantidadeRecebida,
              pendencia: pendencia
                ? {
                    id: pendencia.id,
                    quantidade_faltante: pendencia.faltante,
                    motivo: pendencia.motivo,
                  }
                : undefined,
            })
          }
        }
      })

      setProdutos(produtosExtraidos)
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
      setError("Erro ao carregar os dados do pedido. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Modifique a função ajustarQuantidade
  function ajustarQuantidade(index: number, delta: number) {
    const produto = produtosExibidos[index];
    const quantidadeAtual = quantidadesAtualizacao[produto.nome] ?? 0;
    const novaQuantidade = quantidadeAtual + delta;
    
    // Não permite quantidade negativa e não pode exceder a quantidade pendente
    if (novaQuantidade >= 0 && (produto.recebido + novaQuantidade) <= produto.quantidade) {
      setQuantidadesAtualizacao(prev => ({
        ...prev,
        [produto.nome]: novaQuantidade
      }));
    }
  }

  // Modifique a função validarQuantidade
  function validarQuantidade(index: number, valor: string) {
    const produto = produtosExibidos[index];
    const numeroValor = parseInt(valor) || 0;
    
    if (numeroValor >= 0 && (produto.recebido + numeroValor) <= produto.quantidade) {
      setQuantidadesAtualizacao(prev => ({
        ...prev,
        [produto.nome]: numeroValor
      }));
    }
  }

  function abrirModalResponsavel() {
    setModalAberto(true)
  }

  function fecharModalResponsavel() {
    setModalAberto(false)
    setResponsavel("")
  }

  function confirmarResponsavel() {
    if (!responsavel.trim()) {
      setMensagem("O nome do responsável é obrigatório para atualizar a conferência.")
      return
    }

    fecharModalResponsavel()
    atualizarPendencias()
  }

  async function atualizarPendencias() {
    try {
      setSalvando(true);
      const atualizacoes = [];
      let totalRecebido = 0;
      let totalPendentes = 0;

      // Primeiro, vamos criar um mapa dos produtos que foram atualizados
      const produtosAtualizados = new Set(
        Object.keys(quantidadesAtualizacao).filter(nome => quantidadesAtualizacao[nome] > 0)
      );

      // Processamos todos os produtos
      for (const produto of produtos) {
        const quantidade_pedida = produto.quantidade;
        const quantidade_atualizada = quantidadesAtualizacao[produto.nome] || 0;
        let quantidade_recebida = produto.recebido;
        let quantidade_faltante;

        // Se o produto foi atualizado nesta sessão
        if (produtosAtualizados.has(produto.nome)) {
          quantidade_recebida = produto.recebido + quantidade_atualizada;
          quantidade_faltante = quantidade_pedida - quantidade_recebida;
          
          if (quantidade_faltante > 0) {
            totalPendentes += quantidade_faltante;
            atualizacoes.push({
              pedido_id: Number.parseInt(pedidoId),
              numero_pedido: numeroPedido,
              produto: produto.nome,
              quantidade_pedida,
              quantidade_recebida,
              quantidade_faltante,
              motivo_devolucao: produto.pendencia?.motivo || "Não informado",
              responsavel,
              data: new Date().toISOString(),
            });
          }
        } 
        // Se o produto não foi atualizado mas tinha pendência, mantemos a pendência
        else if (produto.pendencia) {
          quantidade_faltante = produto.pendencia.quantidade_faltante;
          totalPendentes += quantidade_faltante;
          atualizacoes.push({
            pedido_id: Number.parseInt(pedidoId),
            numero_pedido: numeroPedido,
            produto: produto.nome,
            quantidade_pedida,
            quantidade_recebida: produto.recebido,
            quantidade_faltante,
            motivo_devolucao: produto.pendencia.motivo,
            responsavel: produto.pendencia.responsavel,
            data: produto.pendencia.data || new Date().toISOString(),
          });
        }

        totalRecebido += quantidade_recebida;
      }

      // Remove todas as pendências antigas
      await deletarPendencias(Number.parseInt(pedidoId));

      // Salva as novas pendências (incluindo as mantidas)
      if (atualizacoes.length > 0) {
        const dadosPendencias = {
          pedidoId: String(pedidoId),
          numeroPedido,
          produtos: atualizacoes.map(p => ({
            produto: p.produto,
            quantidade_pedida: p.quantidade_pedida,
            quantidade_recebida: p.quantidade_recebida,
            quantidade_faltante: p.quantidade_faltante,
            motivo_devolucao: p.motivo_devolucao
          })),
          responsavel
        };

        await salvarPendencias(dadosPendencias);
      }

      // Prepara os dados da conferência
      const produtosArray = produtos.map((p) => {
        const quantidade_atualizada = quantidadesAtualizacao[p.nome] || 0;
        const quantidade_recebida = produtosAtualizados.has(p.nome) ? 
          p.recebido + quantidade_atualizada : 
          p.recebido;
        
        return {
          produto: p.nome,
          quantidade_pedida: p.quantidade,
          quantidade_recebida,
          quantidade_faltante: p.quantidade - quantidade_recebida
        };
      });

      const dadosConferencia = {
        pedido_id: Number.parseInt(pedidoId),
        quantidade_recebida: totalRecebido,
        total_conferida: totalRecebido,
        produtos: JSON.stringify(produtosArray),
        responsavel,
        data: new Date().toISOString(),
      };

      // Salva a conferência
      await salvarConferencia(dadosConferencia);

      // Define a mensagem apropriada
      if (atualizacoes.length > 0) {
        setMensagem("⚠️ Pedido atualizado com itens pendentes");
      } else {
        setMensagem("✅ Todos os itens foram recebidos!");
      }

      // Limpa as quantidades de atualização
      setQuantidadesAtualizacao({});

      // Recarrega os dados para atualizar a visualização
      await carregarDados();

      // Redireciona após 3,5 segundos
      setTimeout(() => router.push("/pedidos"), 3500);
    } catch (error) {
      console.error("Erro ao processar a conferência:", error);
      setMensagem("Erro ao processar a conferência.");
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Carregando pedido...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 p-4 rounded-md text-center">
        <p className="text-red-400">{error}</p>
        <Button onClick={carregarDados} variant="outline" className="mt-2">
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

      <div className="bg-card rounded-lg p-4 mb-6 text-sm md:text-base">
        <p className="text-muted-foreground">
          Pedido #{numeroPedido} (ID: {pedidoId})
        </p>
        {conferencia && (
          <p className="text-muted-foreground">
            Conferido por {conferencia.responsavel} em {new Date(conferencia.data).toLocaleString()}
          </p>
        )}
      </div>

      {modo === "pendente" && produtosExibidos.length === 0 ? (
        <div className="text-center p-8 bg-card rounded-lg">
          <span className="text-green-500 text-lg">✅ Todos os itens foram recebidos!</span>
        </div>
      ) : (
        <div className="bg-card rounded-lg overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full table-fixed divide-y divide-border">
                <thead>
                  <tr className="bg-[hsl(var(--table-header))] text-[hsl(var(--table-header-foreground))]">
                    <th scope="col" className="w-[40%] py-3 px-4 text-left text-xs md:text-sm font-medium">
                      Produto
                    </th>
                    <th scope="col" className="w-[15%] py-3 px-4 text-center text-xs md:text-sm font-medium">
                      Qtd. Pedida
                    </th>
                    <th scope="col" className="w-[15%] py-3 px-4 text-center text-xs md:text-sm font-medium">
                      Qtd. Recebida
                    </th>
                    {modo === "pendente" && (
                      <th scope="col" className="w-[15%] py-3 px-4 text-center text-xs md:text-sm font-medium">
                        Atualizar Quantidade
                      </th>
                    )}
                    <th scope="col" className="w-[15%] py-3 px-4 text-center text-xs md:text-sm font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-[hsl(var(--table-row))] text-[hsl(var(--table-row-foreground))]">
                  {produtosExibidos.map((produto, index) => {
                    const quantidadeAtualizada = quantidadesAtualizacao[produto.nome] || 0;
                    const quantidadeTotal = produto.recebido + quantidadeAtualizada;
                    const quantidadeFaltante = produto.quantidade - quantidadeTotal;

                    return (
                      <tr key={index} className="hover:bg-[hsl(var(--table-row-hover))]">
                        <td className="py-2 px-4 text-xs md:text-sm truncate">
                          {produto.nome}
                        </td>
                        <td className="py-2 px-4 text-center text-xs md:text-sm">
                          {produto.quantidade}
                        </td>
                        <td className="py-2 px-4 text-center text-xs md:text-sm">
                          {produto.recebido}
                        </td>
                        {modo === "pendente" && (
                          <td className="py-2 px-4 text-center text-xs md:text-sm">
                            <div className="inline-flex items-center rounded-md bg-background">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                                onClick={() => ajustarQuantidade(index, -1)}
                              >
                                -
                              </Button>
                              <span className="h-8 w-8 flex items-center justify-center">
                                {quantidadeAtualizada}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                                onClick={() => ajustarQuantidade(index, 1)}
                              >
                                +
                              </Button>
                            </div>
                          </td>
                        )}
                        <td className="py-2 px-4 text-center text-xs md:text-sm">
                          {modo === "pendente" ? (
                            quantidadeFaltante > 0 ? (
                              <span className="text-yellow-500">⚠️ Faltam {quantidadeFaltante}</span>
                            ) : (
                              <span className="text-green-500">✅ Completo</span>
                            )
                          ) : (
                            produto.pendencia ? (
                              <span className="text-yellow-500">⚠️ Faltam {produto.pendencia.quantidade_faltante}</span>
                            ) : (
                              <span className="text-green-500">✅ Completo</span>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modo === "pendente" && produtosExibidos.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button 
            variant="default" 
            onClick={abrirModalResponsavel} 
            disabled={salvando}
            className="w-full md:w-auto"
          >
            {salvando ? "Atualizando..." : "Atualizar Quantidades"}
          </Button>
        </div>
      )}

      {mensagem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
          <div className="bg-background p-6 rounded-lg shadow-lg text-center transform scale-100 transition-transform duration-300">
            <p className="text-2xl font-medium">{mensagem}</p>
          </div>
        </div>
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
