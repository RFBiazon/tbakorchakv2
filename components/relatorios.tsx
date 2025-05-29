"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getAllPendencias } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Download, Printer } from "lucide-react"
import lojasConfigData from '../lojas.config.json'; // Corrigido o caminho de importação
import { DatePicker } from "./ui/date-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

// Definir uma interface para o objeto de configuração da loja
interface LojaConfig {
  idInterno: string;
  nomeExibicao: string;
  idApi: string;
  supabaseUrlEnvVar: string;
  supabaseKeyEnvVar: string;
}
const lojasConfig: LojaConfig[] = lojasConfigData;

const getLojaName = (idInterno: string) => {
  const loja = lojasConfig.find((l: LojaConfig) => l.idInterno === idInterno);
  return loja ? loja.nomeExibicao : idInterno;
}

type Pendencia = {
  id: number
  pedido_id: number
  numero_pedido: string
  produto: string
  quantidade_pedida: number
  quantidade_recebida: number
  quantidade_faltante: number
  motivo_devolucao: string
  responsavel: string
  data: string
}

export function Relatorios() {
  const [pendencias, setPendencias] = useState<Pendencia[]>([])
  const [filtradas, setFiltradas] = useState<Pendencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [selectedLoja, setSelectedLoja] = useState("")

  // Filtros
  const [dataInicial, setDataInicial] = useState("")
  const [dataFinal, setDataFinal] = useState("")
  const [motivo, setMotivo] = useState("")
  const [busca, setBusca] = useState("")

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    danificada: 0,
    vencido: 0,
    violada: 0,
    ausente: 0,
    outros: 0,
  })

  const motivos = [
    { value: "Embalagem Danificada", icon: "📦" },
    { value: "Produto Vencido", icon: "⚠️" },
    { value: "Embalagem Violada", icon: "🔒" },
    { value: "Produto Ausente", icon: "❌" },
    { value: "Outros", icon: "❓" },
  ]

  useEffect(() => {
    const loja = localStorage.getItem("selectedLoja")
    if (loja) {
      setSelectedLoja(loja)
    }
  }, [])

  useEffect(() => {
    carregarPendencias()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [pendencias, dataInicial, dataFinal, motivo, busca])

  async function carregarPendencias() {
    try {
      setLoading(true)
      const data = await getAllPendencias()

      // Ordenar por data mais recente
      const ordenadas = [...data].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

      setPendencias(ordenadas)
      setFiltradas(ordenadas)
      calcularEstatisticas(ordenadas)
    } catch (err) {
      console.error("Erro ao carregar pendências:", err)
      setError("Erro ao carregar as pendências. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function aplicarFiltros() {
    const filtradas = pendencias.filter((item) => {
      const data = new Date(item.data)
      const dataMatch =
        (!dataInicial || data >= new Date(dataInicial)) && (!dataFinal || data <= new Date(dataFinal + "T23:59:59"))
      const motivoMatch = !motivo || motivo === "todos" || item.motivo_devolucao === motivo
      const buscaMatch =
        !busca ||
        item.numero_pedido.toLowerCase().includes(busca.toLowerCase()) ||
        item.responsavel.toLowerCase().includes(busca.toLowerCase()) ||
        item.produto.toLowerCase().includes(busca.toLowerCase())

      return dataMatch && motivoMatch && buscaMatch
    })

    setFiltradas(filtradas)
    calcularEstatisticas(filtradas)
  }

  function calcularEstatisticas(dados: Pendencia[]) {
    const total = dados.length
    const danificada = dados.filter((d) => d.motivo_devolucao === "Embalagem Danificada").length
    const vencido = dados.filter((d) => d.motivo_devolucao === "Produto Vencido").length
    const violada = dados.filter((d) => d.motivo_devolucao === "Embalagem Violada").length
    const ausente = dados.filter((d) => d.motivo_devolucao === "Produto Ausente").length
    const outros = dados.filter((d) => d.motivo_devolucao === "Outros").length

    setEstatisticas({
      total,
      danificada,
      vencido,
      violada,
      ausente,
      outros,
    })
  }

  // Função simplificada para exportar como CSV (não depende de bibliotecas externas)
  function exportarCSV() {
    if (gerando) return

    try {
      setGerando(true)

      // Cabeçalhos da tabela
      const headers = [
        "Pedido",
        "Data",
        "Produto",
        "Qtd. Pedida",
        "Qtd. Recebida",
        "Qtd. Pendente",
        "Motivo",
        "Responsável",
      ]

      // Converter dados para formato CSV
      let csvContent = headers.join(",") + "\n"

      filtradas.forEach((p) => {
        const data = new Date(p.data).toLocaleDateString("pt-BR")
        const row = [
          `"${p.numero_pedido}"`,
          `"${data}"`,
          `"${p.produto}"`,
          p.quantidade_pedida,
          p.quantidade_recebida,
          p.quantidade_faltante,
          `"${p.motivo_devolucao}"`,
          `"${p.responsavel}"`,
        ]
        csvContent += row.join(",") + "\n"
      })

      // Criar um blob com o conteúdo CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

      // Criar um link para download
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute("download", "relatorio-pendencias.csv")
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao gerar CSV:", error)
      alert(`Erro ao gerar o relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setGerando(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4 print:hidden">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/pedidos" className="text-foreground hover:text-primary text-xl md:text-2xl" title="Voltar para pedidos">
            <Home />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Relatórios de Pendências - {getLojaName(selectedLoja)}</h1>
        </div>
        <div className="flex gap-2 md:gap-4 w-full md:w-auto">
          <Button onClick={exportarCSV} className="w-full md:w-auto" disabled={gerando}>
            {gerando ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></div>
                Gerando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" /> Exportar CSV
              </>
            )}
          </Button>
          <Button onClick={() => window.print()} variant="secondary" className="w-full md:w-auto">
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Dashboard de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
        <div className="bg-card border border-border p-3 md:p-4 rounded-lg">
          <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2">Total de Pendências</h3>
          <p className="text-2xl md:text-3xl font-bold text-blue-500">{estatisticas.total}</p>
        </div>
        <div className="bg-card border border-border p-3 md:p-4 rounded-lg">
          <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2">📦 Embalagem Danificada</h3>
          <p className="text-2xl md:text-3xl font-bold text-orange-500">{estatisticas.danificada}</p>
        </div>
        <div className="bg-card border border-border p-3 md:p-4 rounded-lg">
          <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2">⚠️ Produto Vencido</h3>
          <p className="text-2xl md:text-3xl font-bold text-red-500">{estatisticas.vencido}</p>
        </div>
        <div className="bg-card border border-border p-3 md:p-4 rounded-lg">
          <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2">🔒 Embalagem Violada</h3>
          <p className="text-2xl md:text-3xl font-bold text-yellow-500">{estatisticas.violada}</p>
        </div>
        <div className="bg-card border border-border p-3 md:p-4 rounded-lg">
          <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2">❌ Produto Ausente</h3>
          <p className="text-2xl md:text-3xl font-bold text-blue-500">{estatisticas.ausente}</p>
        </div>
        <div className="bg-card border border-border p-3 md:p-4 rounded-lg">
          <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2">❓ Outros Motivos</h3>
          <p className="text-2xl md:text-3xl font-bold text-muted-foreground">{estatisticas.outros}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border p-3 md:p-4 rounded-lg mb-4 md:mb-8 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="block text-foreground font-medium mb-1 md:mb-2">Data Inicial</label>
            <DatePicker
              value={dataInicial}
              onChange={(value) => setDataInicial(value)}
              className="w-full bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Selecione a data inicial"
            />
          </div>
          <div>
            <label className="block text-foreground font-medium mb-1 md:mb-2">Data Final</label>
            <DatePicker
              value={dataFinal}
              onChange={(value) => setDataFinal(value)}
              className="w-full bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Selecione a data final"
            />
          </div>
          <div>
            <label className="block text-foreground font-medium mb-1 md:mb-2">Motivo</label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger className="bg-background text-foreground">
                <SelectValue placeholder="Todos os motivos" className="text-foreground" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os motivos</SelectItem>
                <SelectItem value="Embalagem Danificada">Embalagem Danificada</SelectItem>
                <SelectItem value="Produto Vencido">Produto Vencido</SelectItem>
                <SelectItem value="Embalagem Violada">Embalagem Violada</SelectItem>
                <SelectItem value="Produto Ausente">Produto Ausente</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-foreground font-medium mb-1 md:mb-2">Buscar</label>
            <Input
              type="text"
              placeholder="Pedido, responsável ou produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Tabela de Resultados */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando pendências...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/20 border border-destructive p-4 rounded-md text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={carregarPendencias} variant="outline" className="mt-2">
            Tentar novamente
          </Button>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma pendência encontrada com os filtros selecionados.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Pedido</th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-center text-xs md:text-sm font-medium text-muted-foreground">Qtd. Pedida</th>
                  <th className="px-4 py-3 text-center text-xs md:text-sm font-medium text-muted-foreground">Qtd. Recebida</th>
                  <th className="px-4 py-3 text-center text-xs md:text-sm font-medium text-muted-foreground">Qtd. Pendente</th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtradas.map((pendencia) => (
                  <tr key={pendencia.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-card-foreground">
                      <Link href={`/visualizar/${pendencia.pedido_id}?numero=${pendencia.numero_pedido}&modo=pendente`} className="hover:underline">
                        #{pendencia.numero_pedido}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-card-foreground">
                      {new Date(pendencia.data).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-card-foreground">{pendencia.produto}</td>
                    <td className="px-4 py-3 text-sm text-center text-card-foreground">{pendencia.quantidade_pedida}</td>
                    <td className="px-4 py-3 text-sm text-center text-card-foreground">{pendencia.quantidade_recebida}</td>
                    <td className="px-4 py-3 text-sm text-center font-bold text-red-500">{pendencia.quantidade_faltante}</td>
                    <td className="px-4 py-3 text-sm text-card-foreground">
                      {motivos.find(m => m.value === pendencia.motivo_devolucao)?.icon || "❓"} {pendencia.motivo_devolucao}
                    </td>
                    <td className="px-4 py-3 text-sm text-card-foreground">{pendencia.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          .print-hidden, .print-hidden * {
            display: none !important;
          }
          body {
            background-color: white;
            color: black;
          }
          table, th, td {
            border: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2 !important;
            color: black !important;
          }
        }
      `}</style>
    </>
  )
}
