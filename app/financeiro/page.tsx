"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  MinusCircle,
  Calendar,
  CreditCard,
  Wallet,
  BarChart3,
  Eye,
  Filter,
  Download,
  Trash2,
  Edit,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ReferenceLine, Tooltip as RechartsTooltip } from "recharts"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Transacao {
  id: string
  tipo: 'entrada' | 'saida'
  valor: number
  descricao: string
  categoria: string
  data: Date
  metodo: string
  observacoes?: string
}

interface MovimentacaoCaixa {
  id: number
  created_at: string
  type: number
  amount: number
  reason: string
  verified: boolean
}

interface HistoricoCaixa {
  id: number
  cash_id: number
  opened_user?: {
    full_name: string
    name?: string
  }
  amount_on_open: number | string
  amount_on_close: number | string
  out_result: number | string
  in_result?: number | string
  amount_on_cash: number | string
  balance_history?: {
    id: number
    cash_history_id: number
    pix: number | string
    credit_card: number | string
    debit_card: number | string
    ticket: number | string
    online: number | string
    money?: number | string
  }
  total_sales?: number
  created_at?: string
  updated_at?: string
  opened_at?: string
  result_cash?: number | string
  observation?: string
}

interface DadosCaixa {
  movimentacoes: MovimentacaoCaixa[]
  historico: HistoricoCaixa[]
}

interface BenchmarkStore {
  id: number
  company_name: string
  franchisee_id: null
  store_city: string
  balance: {
    change_amount: number
    discount: number
    credit_card: number
    debit_card: number
    delivery_sale: number
    money: number
    pix: number
    online: number
    store_sale: number
    ticket: number
    total: number
    total_app: number
    total_delivery: number
    total_ifood: number
    total_others: number
    total_store: number
  }
  percent: number
  position: number
}

interface BenchmarkResponse {
  message: string
  content: BenchmarkStore[]
}

const categorias = {
  entrada: [
    'Vendas',
    'Receita de Serviços',
    'Investimentos',
    'Outros Recebimentos'
  ],
  saida: [
    'Compra de Mercadorias',
    'Salários',
    'Aluguel',
    'Utilities',
    'Marketing',
    'Transporte',
    'Equipamentos',
    'Outros Gastos'
  ]
}

const metodosPagamento = [
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência Bancária',
  'Boleto'
]

const chartConfig = {
  entrada: {
    label: "Entradas",
    color: "#22c55e",
  },
  saida: {
    label: "Saídas", 
    color: "#ef4444",
  },
}

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [novaTransacao, setNovaTransacao] = useState<Partial<Transacao>>({
    tipo: 'entrada',
    data: new Date(),
    metodo: 'PIX'
  })
  const [modalAberto, setModalAberto] = useState(false)
  const [modalCaixaAberto, setModalCaixaAberto] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [mesAtual, setMesAtual] = useState(new Date())
  
  // Estados para controle de caixa
  const [lojaSelecionada, setLojaSelecionada] = useState<string>('TOLEDO LAGO')
  const [dataInicial, setDataInicial] = useState<string>(new Date().toISOString().split('T')[0])
  const [dataFinal, setDataFinal] = useState<string>(new Date().toISOString().split('T')[0])
  const [dadosCaixa, setDadosCaixa] = useState<DadosCaixa | null>(null)
  const [carregandoCaixa, setCarregandoCaixa] = useState(false)
  const [logsApi, setLogsApi] = useState<string[]>([])

  // Estados separados para o benchmark
  const [lojaSelecionadaBenchmark, setLojaSelecionadaBenchmark] = useState<string>('TOLEDO LAGO')
  const [dataInicialBenchmark, setDataInicialBenchmark] = useState<string>(new Date().toISOString().split('T')[0])
  const [dataFinalBenchmark, setDataFinalBenchmark] = useState<string>(new Date().toISOString().split('T')[0])
  const [dadosBenchmark, setDadosBenchmark] = useState<BenchmarkStore[]>([])
  const [carregandoBenchmark, setCarregandoBenchmark] = useState(false)

  // Dados para gráficos
  const [dadosGraficoMensal, setDadosGraficoMensal] = useState<any[]>([])
  const [dadosGraficoCategorias, setDadosGraficoCategorias] = useState<any[]>([])

  // Endpoints e credenciais via variáveis de ambiente
  const loginUrl = process.env.NEXT_PUBLIC_API_LOGIN_URL as string
  const movimentacoesBaseUrl = process.env.NEXT_PUBLIC_API_MOVIMENTACOES_URL as string
  const historicoBaseUrl = process.env.NEXT_PUBLIC_API_HISTORICO_URL as string
  const benchmarkBaseUrl = process.env.NEXT_PUBLIC_API_BENCHMARK_URL as string
  const credenciais = {
    username: process.env.NEXT_PUBLIC_API_USERNAME as string,
    password: process.env.NEXT_PUBLIC_API_PASSWORD as string
  }

  const lojas = {
    "TOLEDO LAGO": 4,
    "TOLEDO PIONEIRO": 40,
    "VIDEIRA": 184,
    "FRAIBURGO": 528,
    "CAMPO MOURÃO": 616
  }

  // Função para fazer login e obter token
  const obterToken = async (): Promise<string> => {
    try {
      adicionarLog('🔑 Fazendo requisição de login...')
      adicionarLog(`📡 URL: ${loginUrl}`)
      adicionarLog(`👤 Usuário: ${credenciais.username}`)
      
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credenciais)
      })

      adicionarLog(`📊 Status da resposta: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        throw new Error(`Erro no login: ${response.status}`)
      }

      const data = await response.json()
      adicionarLog(`📥 Resposta do login: ${JSON.stringify(data, null, 2)}`)
      
      if (!data.access_token) {
        throw new Error("Token não encontrado na resposta")
      }

      adicionarLog(`🎯 Token obtido: ${data.access_token.substring(0, 50)}...`)
      return data.access_token
    } catch (error) {
      adicionarLog(`❌ Erro no login: ${(error as Error).message}`)
      console.error('Erro ao obter token:', error)
      throw error
    }
  }

  // Função para formatar data yyyy-MM-dd para dd/MM/yyyy (evita problemas de timezone)
  function formatarDataParaApi(data: string) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  // Função para buscar movimentações do caixa
  const buscarMovimentacoesCaixa = async () => {
    setCarregandoCaixa(true)
    setLogsApi([]) // Limpar logs anteriores
    
    try {
      adicionarLog('🔐 Iniciando processo de login...')
      const token = await obterToken()
      adicionarLog('✅ Token obtido com sucesso')
      
      const lojaId = lojas[lojaSelecionada as keyof typeof lojas]
      if (!lojaId) {
        throw new Error(`Loja "${lojaSelecionada}" não encontrada`)
      }
      adicionarLog(`🏪 Loja selecionada: ${lojaSelecionada} (ID: ${lojaId})`)

      // Formatar datas para o formato da API (dd/MM/yyyy)
      const dataInicialFormatada = formatarDataParaApi(dataInicial);
      const dataFinalFormatada = formatarDataParaApi(dataFinal);
      adicionarLog(`📅 Período: ${dataInicialFormatada} até ${dataFinalFormatada}`)

      // Buscar movimentações
      const movimentacoesUrl = `${movimentacoesBaseUrl}/${lojaId}?data_inicial=${encodeURIComponent(dataInicialFormatada)}&data_final=${encodeURIComponent(dataFinalFormatada)}`
      adicionarLog(`🔍 Buscando movimentações: ${movimentacoesUrl}`)
      
      const movimentacoesResponse = await fetch(movimentacoesUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!movimentacoesResponse.ok) {
        throw new Error(`Erro ao buscar movimentações: ${movimentacoesResponse.status}`)
      }

      const movimentacoesData = await movimentacoesResponse.json()
      adicionarLog(`📥 Movimentações recebidas: ${JSON.stringify(movimentacoesData, null, 2)}`)
      adicionarLog(`📊 Total de movimentações: ${movimentacoesData.data?.length || 0}`)

      // Buscar histórico do caixa
      const historicoUrl = `${historicoBaseUrl}/${lojaId}?data_inicial=${encodeURIComponent(dataInicialFormatada)}&data_final=${encodeURIComponent(dataFinalFormatada)}&withDeleted=true&all_sales=true`
      adicionarLog(`🔍 Buscando histórico: ${historicoUrl}`)
      
      const historicoResponse = await fetch(historicoUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!historicoResponse.ok) {
        throw new Error(`Erro ao buscar histórico: ${historicoResponse.status}`)
      }

      const historicoData = await historicoResponse.json()
      adicionarLog(`📥 Histórico recebido: ${JSON.stringify(historicoData, null, 2)}`)
      adicionarLog(`📊 Total de registros de histórico: ${historicoData.data?.length || 0}`)

      // Analisar dados do histórico para debug
      if (historicoData.data && historicoData.data.length > 0) {
        historicoData.data.forEach((item: any, index: number) => {
          adicionarLog(`🔍 Histórico ${index + 1}:`)
          adicionarLog(`  - Data: ${item.opened_at || 'N/A'}`)
          adicionarLog(`  - Usuário: ${item.opened_user?.full_name || 'N/A'}`)
          adicionarLog(`  - Total Sales: ${item.total_sales || 0}`)
          adicionarLog(`  - Amount on Cash: ${item.amount_on_cash || 0}`)
          adicionarLog(`  - Balance History: ${JSON.stringify(item.balance_history || {})}`)
          adicionarLog(`  - Abertura: ${item.amount_on_open || 0}`)
          adicionarLog(`  - Fechamento: ${item.amount_on_close || 0}`)
          adicionarLog(`  - Saídas: ${item.out_result || 0}`)
        })
      }

      setDadosCaixa({
        movimentacoes: movimentacoesData.data || [],
        historico: historicoData.data || []
      })

      adicionarLog('✅ Dados do caixa carregados com sucesso!')
      toast.success('Dados do caixa carregados com sucesso!')
    } catch (error) {
      const errorMessage = (error as Error).message
      adicionarLog(`❌ Erro: ${errorMessage}`)
      console.error('Erro ao buscar dados do caixa:', error)
      toast.error('Erro ao carregar dados do caixa: ' + errorMessage)
    } finally {
      setCarregandoCaixa(false)
    }
  }

  // Função para formatar data e hora das movimentações
  const formatarDataHora = (created_at: string) => {
    const [rawDate, hora] = created_at.split(" ")
    let [a, b, c] = rawDate.split("-")
    if (parseInt(a) > 31) [a, b, c] = [c, b, a]
    const data = `${a.padStart(2, "0")}/${b.padStart(2, "0")}/${c}`
    return { data, hora }
  }

  useEffect(() => {
    // Simular dados iniciais
    const transacoesIniciais: Transacao[] = [
      {
        id: '1',
        tipo: 'entrada',
        valor: 15000,
        descricao: 'Vendas do mês',
        categoria: 'Vendas',
        data: new Date(),
        metodo: 'PIX'
      },
      {
        id: '2',
        tipo: 'saida',
        valor: 3500,
        descricao: 'Compra de frutas',
        categoria: 'Compra de Mercadorias',
        data: new Date(),
        metodo: 'Transferência Bancária'
      },
      {
        id: '3',
        tipo: 'saida',
        valor: 2500,
        descricao: 'Salário funcionários',
        categoria: 'Salários',
        data: new Date(),
        metodo: 'PIX'
      }
    ]
    setTransacoes(transacoesIniciais)
    atualizarDadosGraficos(transacoesIniciais)
  }, [])

  const atualizarDadosGraficos = (transacoes: Transacao[]) => {
    // Dados para gráfico mensal (últimos 6 meses)
    const mesesData = []
    for (let i = 5; i >= 0; i--) {
      const mes = subMonths(new Date(), i)
      const inicioMes = startOfMonth(mes)
      const fimMes = endOfMonth(mes)
      
      const transacoesMes = transacoes.filter(t => 
        t.data >= inicioMes && t.data <= fimMes
      )
      
      const entradas = transacoesMes
        .filter(t => t.tipo === 'entrada')
        .reduce((sum, t) => sum + t.valor, 0)
      
      const saidas = transacoesMes
        .filter(t => t.tipo === 'saida')
        .reduce((sum, t) => sum + t.valor, 0)
      
      mesesData.push({
        mes: format(mes, 'MMM', { locale: ptBR }),
        entrada: entradas,
        saida: saidas
      })
    }
    setDadosGraficoMensal(mesesData)

    // Dados para gráfico de categorias de gastos
    const categoriasSaidas = transacoes
      .filter(t => t.tipo === 'saida')
      .reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor
        return acc
      }, {} as Record<string, number>)

    const dadosCategorias = Object.entries(categoriasSaidas).map(([categoria, valor], index) => ({
      name: categoria,
      value: valor,
      fill: `hsl(${index * 45}, 70%, 50%)`
    }))
    setDadosGraficoCategorias(dadosCategorias)
  }

  const calcularEstatisticas = () => {
    const inicioMes = startOfMonth(mesAtual)
    const fimMes = endOfMonth(mesAtual)
    
    const transacoesMes = transacoes.filter(t => 
      t.data >= inicioMes && t.data <= fimMes
    )
    
    const totalEntradas = transacoesMes
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + t.valor, 0)
    
    const totalSaidas = transacoesMes
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + t.valor, 0)
    
    const saldoMes = totalEntradas - totalSaidas
    const saldoTotal = transacoes.reduce((acc, t) => 
      t.tipo === 'entrada' ? acc + t.valor : acc - t.valor, 0
    )

    return {
      totalEntradas,
      totalSaidas,
      saldoMes,
      saldoTotal,
      quantidadeTransacoes: transacoesMes.length
    }
  }

  const stats = calcularEstatisticas()

  const adicionarTransacao = () => {
    if (!novaTransacao.valor || !novaTransacao.descricao || !novaTransacao.categoria) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const transacao: Transacao = {
      id: Date.now().toString(),
      tipo: novaTransacao.tipo as 'entrada' | 'saida',
      valor: Number(novaTransacao.valor),
      descricao: novaTransacao.descricao,
      categoria: novaTransacao.categoria,
      data: novaTransacao.data || new Date(),
      metodo: novaTransacao.metodo || 'PIX',
      observacoes: novaTransacao.observacoes
    }

    const novasTransacoes = [transacao, ...transacoes]
    setTransacoes(novasTransacoes)
    atualizarDadosGraficos(novasTransacoes)
    
    setNovaTransacao({
      tipo: 'entrada',
      data: new Date(),
      metodo: 'PIX'
    })
    setModalAberto(false)
    toast.success('Transação adicionada com sucesso!')
  }

  const removerTransacao = (id: string) => {
    const novasTransacoes = transacoes.filter(t => t.id !== id)
    setTransacoes(novasTransacoes)
    atualizarDadosGraficos(novasTransacoes)
    toast.success('Transação removida com sucesso!')
  }

  const transacoesFiltradas = transacoes.filter(t => {
    if (filtroCategoria && t.categoria !== filtroCategoria) return false
    if (filtroTipo && t.tipo !== filtroTipo) return false
    return true
  })

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // Função para adicionar log
  const adicionarLog = (mensagem: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR')
    const logComTimestamp = `[${timestamp}] ${mensagem}`
    console.log(logComTimestamp)
    setLogsApi(prev => [logComTimestamp, ...prev].slice(0, 50)) // Manter apenas os 50 logs mais recentes
  }

  // Função para formatar nome do usuário: Apenas o primeiro nome, com inicial maiúscula
  function formatarNomeUsuario(nome?: string) {
    if (!nome) return 'Free';
    const partes = nome.trim().split(/\s+/)
    const primeiro = partes[0]
    return primeiro[0].toUpperCase() + primeiro.slice(1).toLowerCase();
  }

  // Função para formatar data dd/MM/aaaa a partir de 'dd-MM-yyyy HH:mm:ss' ou ISO
  function formatarDataBR(dataStr?: string) {
    if (!dataStr) return '';
    // Tenta formato 'dd-MM-yyyy HH:mm:ss'
    const match = dataStr.match(/^(\d{2})-(\d{2})-(\d{4})/)
    if (match) {
      return `${match[1]}/${match[2]}/${match[3]}`;
    }
    // Tenta ISO ou outros formatos
    const data = new Date(dataStr);
    if (!isNaN(data.getTime())) {
      return data.toLocaleDateString('pt-BR');
    }
    return '';
  }

  // Função para converter 'dd-MM-yyyy HH:mm:ss' para Date
  function parseDataAbertura(dataStr?: string) {
    if (!dataStr) return null;
    
    // Tenta formato 'dd-MM-yyyy HH:mm:ss'
    const match = dataStr.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
    if (match) {
      const [, dia, mes, ano, hora = '00', minuto = '00', segundo = '00'] = match;
      return new Date(
        parseInt(ano),
        parseInt(mes) - 1,
        parseInt(dia),
        parseInt(hora),
        parseInt(minuto),
        parseInt(segundo)
      );
    }
    
    // Tenta ISO ou outros formatos
    const data = new Date(dataStr);
    if (!isNaN(data.getTime())) {
      return data;
    }
    
    return null;
  }

  // Ajustar datas para considerar apenas o dia (ignorando horas)
  const historicoFiltrado = dadosCaixa?.historico.filter(hist => {
    if (!hist.opened_at) return false;
    
    // Extrai só a parte da data (dd-MM-yyyy)
    const [dataPart] = hist.opened_at.split(" ");
    const [dia, mes, ano] = dataPart.split("-");
    
    // Cria data de abertura no formato yyyy-MM-dd
    const dataAbertura = new Date(`${ano}-${mes}-${dia}`);
    
    // Ajusta as datas do filtro para considerar o dia inteiro
    const dataInicialFiltro = new Date(dataInicial);
    dataInicialFiltro.setHours(0, 0, 0, 0);
    
    const dataFinalFiltro = new Date(dataFinal);
    dataFinalFiltro.setHours(23, 59, 59, 999);
    
    // Compara as datas
    return dataAbertura >= dataInicialFiltro && dataAbertura <= dataFinalFiltro;
  }) || [];

  function formatarNomeCompleto(nome?: string) {
    if (!nome) return '';
    return nome
      .split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }

  function formatarPrimeiroNome(nome?: string) {
    if (!nome) return '';
    return nome.trim().split(/\s+/)[0].charAt(0).toUpperCase() + nome.trim().split(/\s+/)[0].slice(1).toLowerCase();
  }

  const buscarDadosBenchmark = async () => {
    setCarregandoBenchmark(true)
    setLogsApi([])
    
    try {
      adicionarLog('🔐 Iniciando processo de login...')
      const token = await obterToken()
      adicionarLog('✅ Token obtido com sucesso')
      
      const lojaId = lojas[lojaSelecionadaBenchmark as keyof typeof lojas]
      if (!lojaId) {
        throw new Error(`Loja "${lojaSelecionadaBenchmark}" não encontrada`)
      }
      adicionarLog(`🏪 Loja selecionada: ${lojaSelecionadaBenchmark} (ID: ${lojaId})`)

      // Formatar datas para o formato da API (dd/MM/yyyy)
      const dataInicialFormatada = formatarDataParaApi(dataInicialBenchmark);
      const dataFinalFormatada = formatarDataParaApi(dataFinalBenchmark);
      adicionarLog(`📅 Período: ${dataInicialFormatada} até ${dataFinalFormatada}`)

      // Buscar dados do benchmark
      const benchmarkUrl = `${benchmarkBaseUrl}?data_inicial=${encodeURIComponent(dataInicialFormatada)}&data_final=${encodeURIComponent(dataFinalFormatada)}&store_id=${lojaId}`
      adicionarLog(`🔍 Buscando benchmark: ${benchmarkUrl}`)
      
      const response = await fetch(benchmarkUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      })

      adicionarLog(`📊 Status da resposta: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        adicionarLog(`❌ Erro na resposta: ${errorText}`)
        throw new Error(`Erro ao buscar benchmark: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      adicionarLog(`📥 Dados recebidos: ${JSON.stringify(data, null, 2)}`)

      if (!data.content) {
        throw new Error("Dados do benchmark não encontrados na resposta")
      }

      // Filtrar a loja vendida e recalcular as posições
      const lojasFiltradas = data.content
        .filter((store: BenchmarkStore) => store.company_name !== "carazinho - rs (vendida)")
        .map((store: BenchmarkStore, index: number) => ({
          ...store,
          position: index + 1
        }));

      setDadosBenchmark(lojasFiltradas)
      adicionarLog(`✅ Dados do benchmark carregados com sucesso! Total de lojas: ${lojasFiltradas.length}`)
      toast.success('Dados carregados com sucesso!')
    } catch (error) {
      const errorMessage = (error as Error).message
      adicionarLog(`❌ Erro: ${errorMessage}`)
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados: ' + errorMessage)
    } finally {
      setCarregandoBenchmark(false)
    }
  }

  // Função para formatar nome da loja
  function formatarNomeLoja(nome: string): string {
    const nomesFormatados: { [key: string]: string } = {
      "Toledo - PR 01 - JD. La Salle": "Toledo Lago",
      "Toledo - PR 02 - Boa Esperança": "Toledo Pioneiro",
      "campo mourão - pr": "Campo Mourão",
      "fraiburgo - sc": "Fraiburgo",
      "Videira - SC": "Videira"
    }
    return nomesFormatados[nome] || nome
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Controle Financeiro</h1>
          <div className="flex gap-2">
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Transação</DialogTitle>
                  <DialogDescription>
                    Registre uma nova entrada ou saída financeira
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select 
                        value={novaTransacao.tipo} 
                        onValueChange={(value) => setNovaTransacao({...novaTransacao, tipo: value as 'entrada' | 'saida'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="valor">Valor</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={novaTransacao.valor || ''}
                        onChange={(e) => setNovaTransacao({...novaTransacao, valor: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      placeholder="Descrição da transação"
                      value={novaTransacao.descricao || ''}
                      onChange={(e) => setNovaTransacao({...novaTransacao, descricao: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select 
                      value={novaTransacao.categoria} 
                      onValueChange={(value) => setNovaTransacao({...novaTransacao, categoria: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {(novaTransacao.tipo === 'entrada' ? categorias.entrada : categorias.saida).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="metodo">Método de Pagamento</Label>
                    <Select 
                      value={novaTransacao.metodo} 
                      onValueChange={(value) => setNovaTransacao({...novaTransacao, metodo: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {metodosPagamento.map(metodo => (
                          <SelectItem key={metodo} value={metodo}>{metodo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações (opcional)</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Observações adicionais"
                      value={novaTransacao.observacoes || ''}
                      onChange={(e) => setNovaTransacao({...novaTransacao, observacoes: e.target.value})}
                    />
                  </div>

                  <Button onClick={adicionarTransacao} className="w-full">
                    Adicionar Transação
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={() => setModalCaixaAberto(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              Controle de Caixa
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatarMoeda(stats.saldoTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                saldo acumulado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entradas do Mês</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatarMoeda(stats.totalEntradas)}
              </div>
              <p className="text-xs text-muted-foreground">
                receitas de {format(mesAtual, 'MMMM', { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saídas do Mês</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatarMoeda(stats.totalSaidas)}
              </div>
              <p className="text-xs text-muted-foreground">
                despesas de {format(mesAtual, 'MMMM', { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
              <TrendingUp className={`h-4 w-4 ${stats.saldoMes >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.saldoMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatarMoeda(stats.saldoMes)}
              </div>
              <p className="text-xs text-muted-foreground">
                resultado de {format(mesAtual, 'MMMM', { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.quantidadeTransacoes}
              </div>
              <p className="text-xs text-muted-foreground">
                transações este mês
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="transacoes">Transações</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Mensal</CardTitle>
                  <CardDescription>
                    Entradas e saídas dos últimos 6 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosGraficoMensal}>
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="entrada" fill="var(--color-entrada)" />
                        <Bar dataKey="saida" fill="var(--color-saida)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gastos por Categoria</CardTitle>
                  <CardDescription>
                    Distribuição de gastos por categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosGraficoCategorias}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {dadosGraficoCategorias.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transações</CardTitle>
                    <CardDescription>
                      Histórico de todas as transações financeiras
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="entrada">Entradas</SelectItem>
                        <SelectItem value="saida">Saídas</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {[...categorias.entrada, ...categorias.saida].map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoesFiltradas.map((transacao) => (
                      <TableRow key={transacao.id}>
                        <TableCell>
                          {format(transacao.data, 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transacao.tipo === 'entrada' ? 'default' : 'destructive'}>
                            {transacao.tipo === 'entrada' ? (
                              <ArrowUpRight className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="mr-1 h-3 w-3" />
                            )}
                            {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </Badge>
                        </TableCell>
                        <TableCell>{transacao.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{transacao.categoria}</Badge>
                        </TableCell>
                        <TableCell>{transacao.metodo}</TableCell>
                        <TableCell className={`text-right font-mono ${
                          transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transacao.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(transacao.valor)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removerTransacao(transacao.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relatorios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Financeiros</CardTitle>
                <CardDescription>
                  Análises e relatórios detalhados das finanças
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Resumo Anual</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total de Entradas:</span>
                        <span className="font-mono text-green-600">
                          {formatarMoeda(transacoes.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total de Saídas:</span>
                        <span className="font-mono text-red-600">
                          {formatarMoeda(transacoes.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0))}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Resultado:</span>
                        <span className={`font-mono ${stats.saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatarMoeda(stats.saldoTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Ações</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar para Excel
                      </Button>
                      <Button variant="outline" className="w-full">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Gerar Relatório PDF
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Calendar className="mr-2 h-4 w-4" />
                        Relatório Personalizado
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faturamento" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Faturamento por Loja</CardTitle>
                <CardDescription>
                  Comparativo de faturamento entre as lojas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filtros */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="lojaBenchmark">Loja</Label>
                      <Select value={lojaSelecionadaBenchmark} onValueChange={setLojaSelecionadaBenchmark}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(lojas).map(loja => (
                            <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="dataInicialBenchmark">Data Inicial</Label>
                      <Input
                        id="dataInicialBenchmark"
                        type="date"
                        value={dataInicialBenchmark}
                        onChange={(e) => setDataInicialBenchmark(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dataFinalBenchmark">Data Final</Label>
                      <Input
                        id="dataFinalBenchmark"
                        type="date"
                        value={dataFinalBenchmark}
                        onChange={(e) => setDataFinalBenchmark(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        onClick={buscarDadosBenchmark}
                        disabled={carregandoBenchmark}
                        className="w-full"
                      >
                        {carregandoBenchmark ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Consultar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Tabela de Faturamento */}
                  {dadosBenchmark.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ranking</TableHead>
                            <TableHead>Loja</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Dinheiro</TableHead>
                            <TableHead className="text-right">Crédito</TableHead>
                            <TableHead className="text-right">Débito</TableHead>
                            <TableHead className="text-right">PIX</TableHead>
                            <TableHead className="text-right">Ticket</TableHead>
                            <TableHead className="text-right">Online</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dadosBenchmark.map((store) => (
                            <TableRow key={store.id}>
                              <TableCell className="font-medium">{store.position}º</TableCell>
                              <TableCell>{formatarNomeLoja(store.company_name)}</TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {formatarMoeda(store.balance.total)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-green-600">
                                {formatarMoeda(store.balance.money)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-purple-600">
                                {formatarMoeda(store.balance.credit_card)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-orange-600">
                                {formatarMoeda(store.balance.debit_card)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-cyan-600">
                                {formatarMoeda(store.balance.pix)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-pink-600">
                                {formatarMoeda(store.balance.ticket)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-blue-600">
                                {formatarMoeda(store.balance.online)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Linha de Total */}
                          <TableRow className="bg-muted font-bold">
                            <TableCell colSpan={2} className="text-right">Total</TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {formatarMoeda(dadosBenchmark.reduce((acc, s) => acc + (s.balance.total || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right font-mono text-green-600">
                              {formatarMoeda(dadosBenchmark.reduce((acc, s) => acc + (s.balance.money || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right font-mono text-purple-600">
                              {formatarMoeda(dadosBenchmark.reduce((acc, s) => acc + (s.balance.credit_card || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right font-mono text-orange-600">
                              {formatarMoeda(dadosBenchmark.reduce((acc, s) => acc + (s.balance.debit_card || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right font-mono text-cyan-600">
                              {formatarMoeda(dadosBenchmark.reduce((acc, s) => acc + (s.balance.pix || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right font-mono text-pink-600">
                              {formatarMoeda(dadosBenchmark.reduce((acc, s) => acc + (s.balance.ticket || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right font-mono text-blue-600">
                              {formatarMoeda(dadosBenchmark.reduce((acc, s) => acc + (s.balance.online || 0), 0))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Ranking Visual Customizado */}
                  {dadosBenchmark.length > 0 && (
                    <div className="mt-8 space-y-3">
                      {dadosBenchmark.slice(0, 5).map((item, idx) => {
                        const percent = (item.balance.total / dadosBenchmark[0].balance.total) * 100;
                        return (
                          <div key={item.id} className="flex items-center bg-card rounded-lg border p-3 shadow-sm">
                            {/* Ranking */}
                            <div className="w-10 text-lg font-bold text-orange-500 text-center">{item.position}º</div>
                            {/* Nome da loja e barra */}
                            <div className="flex-1 ml-2">
                              <div className="text-primary font-medium">{formatarNomeLoja(item.company_name)}</div>
                              <div className="relative h-7 mt-1 bg-muted rounded-full overflow-hidden flex items-center">
                                <div
                                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                                  style={{
                                    width: `${percent}%`,
                                    background: 'hsl(var(--primary))'
                                  }}
                                />
                                <span className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-primary-foreground drop-shadow">
                                  {formatarMoeda(item.balance.total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {dadosBenchmark.length === 0 && !carregandoBenchmark && (
                    <div className="text-center py-4 text-gray-500">
                      Nenhum dado de faturamento encontrado. Selecione um período e clique em Consultar.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Controle de Caixa */}
      <Dialog open={modalCaixaAberto} onOpenChange={setModalCaixaAberto}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Controle de Caixa</DialogTitle>
            <DialogDescription>
              Consulte movimentações e histórico do caixa das lojas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="loja">Loja</Label>
                <Select value={lojaSelecionada} onValueChange={setLojaSelecionada}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(lojas).map(loja => (
                      <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dataInicial">Data Inicial</Label>
                <Input
                  id="dataInicial"
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="dataFinal">Data Final</Label>
                <Input
                  id="dataFinal"
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={buscarMovimentacoesCaixa}
                  disabled={carregandoCaixa}
                  className="w-full"
                >
                  {carregandoCaixa ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Consultar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Dados do Caixa */}
            {dadosCaixa && (
              <div className="space-y-4">
                {/* Resumo Geral do Faturamento */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo do Faturamento</CardTitle>
                    <CardDescription>
                      Totalização por forma de pagamento no período selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">Dinheiro</div>
                        <div className="text-xl font-mono">
                          {formatarMoeda(dadosCaixa.historico.reduce((total, h) => total + Number(h.amount_on_cash || 0), 0))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">Faturamento</div>
                        <div className="text-xl font-mono">
                          {formatarMoeda(dadosCaixa.historico.reduce((total, h) =>
                            total +
                            Number(h.amount_on_cash || 0) +
                            Number(h.balance_history?.credit_card || 0) +
                            Number(h.balance_history?.debit_card || 0) +
                            Number(h.balance_history?.pix || 0)
                          , 0))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">Crédito</div>
                        <div className="text-xl font-mono">
                          {formatarMoeda(dadosCaixa.historico.reduce((total, h) => total + Number(h.balance_history?.credit_card || 0), 0))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">Débito</div>
                        <div className="text-xl font-mono">
                          {formatarMoeda(dadosCaixa.historico.reduce((total, h) => total + Number(h.balance_history?.debit_card || 0), 0))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-cyan-600">PIX</div>
                        <div className="text-xl font-mono">
                          {formatarMoeda(dadosCaixa.historico.reduce((total, h) => total + Number(h.balance_history?.pix || 0), 0))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-pink-600">Ticket</div>
                        <div className="text-xl font-mono">
                          {formatarMoeda(dadosCaixa.historico.reduce((total, h) => total + Number(h.balance_history?.ticket || 0), 0))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-teal-600">Online</div>
                        <div className="text-xl font-mono">
                          {formatarMoeda(dadosCaixa.historico.reduce((total, h) => total + Number(h.balance_history?.online || 0), 0))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">Saídas</div>
                        <div className="text-xl font-mono">
                          {formatarMoeda(
                            historicoFiltrado.reduce((total, h) => total + Number(h.out_result || 0), 0)
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-400">Furos</div>
                        <div className="text-xl font-mono">
                          {formatarMoeda(
                            historicoFiltrado.reduce((total, h) => total + (Number(h.result_cash) < 0 ? Number(h.result_cash) : 0), 0)
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-400">Sobras</div>
                        <div className="text-xl font-mono">
                          {formatarMoeda(
                            historicoFiltrado.reduce((total, h) => total + (Number(h.result_cash) > 0 ? Number(h.result_cash) : 0), 0)
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabelas de Dados */}
                <Tabs defaultValue="movimentacoes" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="movimentacoes">Movimentações do Caixa</TabsTrigger>
                    <TabsTrigger value="historico">Histórico do Caixa</TabsTrigger>
                    <TabsTrigger value="logs">Logs da API</TabsTrigger>
                  </TabsList>

                  <TabsContent value="movimentacoes">
                    <Card>
                      <CardHeader>
                        <CardTitle>Movimentações do Caixa</CardTitle>
                        <CardDescription>
                          Entradas e saídas registradas no período
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Hora</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead className="text-center">Verificada</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dadosCaixa.movimentacoes.map((mov) => {
                              const { data, hora } = formatarDataHora(mov.created_at)
                              return (
                                <TableRow key={mov.id}>
                                  <TableCell>{data}</TableCell>
                                  <TableCell>{hora}</TableCell>
                                  <TableCell>
                                    <Badge variant={mov.type === 1 ? 'destructive' : 'default'}>
                                      {mov.type === 1 ? (
                                        <ArrowDownRight className="mr-1 h-3 w-3" />
                                      ) : (
                                        <ArrowUpRight className="mr-1 h-3 w-3" />
                                      )}
                                      {mov.type === 1 ? 'Saída' : 'Entrada'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className={`text-right font-mono ${
                                    mov.type === 1 ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {mov.type === 1 ? '-' : '+'}{formatarMoeda(mov.amount)}
                                  </TableCell>
                                  <TableCell>{mov.reason.replace(":", "").trim()}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant={mov.verified ? 'default' : 'secondary'}>
                                      {mov.verified ? 'Sim' : 'Não'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                        
                        {dadosCaixa.movimentacoes.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            Nenhuma movimentação encontrada no período
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="historico">
                    <Card>
                      <CardHeader>
                        <CardTitle>Histórico do Caixa</CardTitle>
                        <CardDescription>
                          Aberturas e fechamentos de caixa com detalhamento de faturamento
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead className="text-right">Caixa</TableHead>
                                <TableHead className="text-right">Abertura</TableHead>
                                <TableHead className="text-right">Saídas</TableHead>
                                <TableHead className="text-right">Entradas</TableHead>
                                <TableHead className="text-right">Fechamento</TableHead>
                                <TableHead className="text-right">Faturamento</TableHead>
                                <TableHead className="text-right">Dinheiro</TableHead>
                                <TableHead className="text-right">Crédito</TableHead>
                                <TableHead className="text-right">Débito</TableHead>
                                <TableHead className="text-right">PIX</TableHead>
                                <TableHead className="text-right">Ticket</TableHead>
                                <TableHead className="text-right">Resultado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                // Ordenar por data de abertura (caso necessário)
                                const historicoOrdenado = [...historicoFiltrado].sort((a, b) => {
                                  const dataA = parseDataAbertura(a.opened_at)?.getTime() || 0;
                                  const dataB = parseDataAbertura(b.opened_at)?.getTime() || 0;
                                  return dataA - dataB;
                                });
                                // PRÉ-PROCESSAMENTO: identificar vínculos entre fechamentos e aberturas
                                const idsFechamentosUsados: number[] = [];
                                const idsAberturasVinculadas: number[] = [];
                                historicoOrdenado.forEach((hist, idx) => {
                                  for (let i = 0; i < idx; i++) {
                                    const candidato = historicoOrdenado[i];
                                    if (
                                      !idsFechamentosUsados.includes(candidato.id) &&
                                      Number(candidato.amount_on_close) === Number(hist.amount_on_open)
                                    ) {
                                      idsFechamentosUsados.push(candidato.id);
                                      idsAberturasVinculadas.push(hist.id);
                                      break;
                                    }
                                  }
                                });
                                // RENDERIZAÇÃO
                                return historicoOrdenado.map((hist, idx) => {
                                  const valorAberturaCorresponde = idsAberturasVinculadas.includes(hist.id);
                                  return (
                                    <TableRow key={hist.id}>
                                      <TableCell className="font-medium">
                                        {formatarDataBR(hist.opened_at)}
                                      </TableCell>
                                      <TableCell className="font-medium text-gray-600">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span style={{ cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: 120 }}>
                                                {formatarPrimeiroNome(hist.opened_user?.full_name)}
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center">
                                              {hist.opened_user?.full_name || 'Sem nome completo'}
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-gray-600">
                                        {hist.cash_id}
                                      </TableCell>
                                      <TableCell className="text-right font-mono font-semibold">
                                        {formatarMoeda(Number(hist.amount_on_open) || 0)}
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              {valorAberturaCorresponde ? (
                                                <span className="inline-block ml-2 text-blue-400 text-lg align-middle" style={{ cursor: 'pointer' }}>
                                                  =
                                                </span>
                                              ) : (
                                                <span className="inline-block ml-2 text-yellow-400 text-lg align-middle" style={{ cursor: 'pointer' }}>
                                                  ≠
                                                </span>
                                              )}
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center">
                                              {valorAberturaCorresponde
                                                ? 'Abertura corresponde a um fechamento anterior'
                                                : 'Sem fechamento anterior correspondente'}
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-red-600">
                                        {formatarMoeda(Number(hist.out_result) || 0)}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-green-600">
                                        {formatarMoeda(Number(hist.in_result) || 0)}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-white font-semibold">
                                        {formatarMoeda(Number(hist.amount_on_close) || 0)}
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              {idsFechamentosUsados.includes(hist.id) ? (
                                                <span className="inline-block ml-2 text-blue-400 text-lg align-middle" style={{ cursor: 'pointer' }}>
                                                  =
                                                </span>
                                              ) : (
                                                <span className="inline-block ml-2 text-yellow-400 text-lg align-middle" style={{ cursor: 'pointer' }}>
                                                  ≠
                                                </span>
                                              )}
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center">
                                              {idsFechamentosUsados.includes(hist.id)
                                                ? 'Fechamento foi usado para satisfazer uma abertura'
                                                : 'Fechamento não foi usado para nenhuma abertura'}
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </TableCell>
                                      <TableCell className="text-right font-mono font-semibold text-indigo-600">
                                        {formatarMoeda(
                                          Number(hist.amount_on_cash || 0) +
                                          Number(hist.balance_history?.credit_card || 0) +
                                          Number(hist.balance_history?.debit_card || 0) +
                                          Number(hist.balance_history?.pix || 0)
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-green-600">
                                        {formatarMoeda(Number(hist.amount_on_cash || 0))}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-purple-600">
                                        {formatarMoeda(Number(hist.balance_history?.credit_card) || 0)}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-orange-600">
                                        {formatarMoeda(Number(hist.balance_history?.debit_card) || 0)}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-cyan-600">
                                        {formatarMoeda(Number(hist.balance_history?.pix) || 0)}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-pink-600">
                                        {formatarMoeda(Number(hist.balance_history?.ticket) || 0)}
                                      </TableCell>
                                      <TableCell className={`text-right font-mono font-semibold ${Number(hist.result_cash) >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span
                                                style={{ cursor: 'pointer', borderBottom: '1px dotted #888' }}
                                              >
                                                {Number(hist.result_cash) >= 0 ? '+' : ''}{formatarMoeda(Number(hist.result_cash) || 0)}
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center">
                                              {hist.observation ? String(hist.observation) : 'Sem Observações'}
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </TableCell>
                                    </TableRow>
                                  )
                                });
                              })()}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {dadosCaixa.historico.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            Nenhum histórico encontrado no período
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="logs">
                    <Card>
                      <CardHeader>
                        <CardTitle>Logs da API</CardTitle>
                        <CardDescription>
                          Registros detalhados de todas as interações com a API
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
                          {logsApi.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">
                              Nenhum log disponível. Execute uma consulta para ver os logs.
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {logsApi.map((log, index) => {
                                let colorClass = "text-gray-100"
                                if (log.includes('🔐') || log.includes('🔍')) colorClass = "text-blue-400"
                                else if (log.includes('✅')) colorClass = "text-green-400"
                                else if (log.includes('❌')) colorClass = "text-red-400"
                                else if (log.includes('📥') || log.includes('📊')) colorClass = "text-yellow-400"
                                else if (log.includes('🏪') || log.includes('📅')) colorClass = "text-cyan-400"
                                else if (log.includes('  -')) colorClass = "text-gray-300 ml-4"
                                
                                return (
                                  <div key={index} className={`${colorClass} break-all`}>
                                    {log}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(logsApi.join('\n'))
                              toast.success('Logs copiados para a área de transferência!')
                            }}
                          >
                            📋 Copiar Logs
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLogsApi([])
                              toast.success('Logs limpos!')
                            }}
                          >
                            🗑️ Limpar Logs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
} 