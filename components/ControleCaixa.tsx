"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DatePicker } from "@/components/ui/date-picker"
import { useSelectedStore } from "@/hooks/useSelectedStore"
import { syncCaixaData } from '@/lib/syncCaixa'

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
  cash: number
  store_id: number
  backup_url: string | null
  opened_at: string
  opened_by: number
  amount_on_open: string
  closed_at: string
  closed_by: number
  amount_on_close: string
  amount_on_cash: string
  in_result: string
  out_result: string
  result_cash: string
  observation: string | null
  created_at: string
  deleted_at: string | null
  balance_history_id: number
  usd_exchange_rate: string | null
  ars_exchange_rate: string | null
  pyg_exchange_rate: string | null
  local_opened_at: string
  local_closed_at: string
  opened_user: {
    id: number
    parent_id: number
    name: string
    last_name: string
    username: string
    email: string
    phone: string
    cpf: string
    level: number
    is_profile: boolean
    profile_permission: string | null
    image: string | null
    image_key: string | null
    full_name: string
    should_update_at: string
    pin_code: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
    birthday: string | null
    gender: number
    scholarity: string | null
    marital_status: string | null
    atuation: string | null
    courses: string | null
    is_married: boolean | null
    cep: string | null
    address: string | null
    state: string | null
    city: string | null
    district: string | null
    complement: string | null
    ruc: string | null
    distrito_py: string | null
    user_twygo_id: string | null
    magic_link_twygo: string | null
    user_twygo_status: boolean
    expire_pin: string | null
    password_confirmation: string | null
    passwordExpireIn: string
    first_access: boolean | null
    pin_phone: string | null
  }
  balance_history: {
    id: number
    cash_history_id: number
    store_sale: number
    total_sales: number
    total_sales_with_cpf: number
    total_sales_without_cpf: number
    total_percent_with_cpf: string
    total_percent_without_cpf: string
    delivery_sale: number
    total: string
    total_store: string
    total_delivery: string
    total_ifood: string
    total_app: string
    total_others: string
    money: string
    credit_card: string
    debit_card: string
    online: string
    pix: string
    ticket: string
    change_amount: string
    created_at: string
    deleted_at: string | null
    qr_code: string | null
  }
}

interface DadosCaixa {
  movimentacoes: MovimentacaoCaixa[]
  historico: HistoricoCaixa[]
}

export function ControleCaixa() {
  const { selectedStore, lojasConfig } = useSelectedStore()
  const [lojaSelecionada, setLojaSelecionada] = useState<string>('')
  const [dataInicial, setDataInicial] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dataFinal, setDataFinal] = useState<string>(new Date().toISOString().split('T')[0])
  const [dadosCaixa, setDadosCaixa] = useState<DadosCaixa | null>(null)
  const [carregandoCaixa, setCarregandoCaixa] = useState(false)
  const [logsApi, setLogsApi] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (selectedStore) {
      setLojaSelecionada(selectedStore)
    }
  }, [selectedStore])

  const loginUrl = process.env.NEXT_PUBLIC_API_LOGIN_URL as string
  const movimentacoesBaseUrl = process.env.NEXT_PUBLIC_API_MOVIMENTACOES_URL as string
  const historicoBaseUrl = process.env.NEXT_PUBLIC_API_HISTORICO_URL as string
  const credenciais = {
    username: process.env.NEXT_PUBLIC_API_USERNAME as string,
    password: process.env.NEXT_PUBLIC_API_PASSWORD as string
  }

  const adicionarLog = (mensagem: string) => {
    console.log(mensagem)
    setLogsApi(prev => [...prev, `${new Date().toLocaleTimeString()}: ${mensagem}`])
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  function formatarDataParaApi(data: string) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarDataBR(dataStr?: string) {
    if (!dataStr) return '';
    const match = dataStr.match(/^\d{2}-\d{2}-\d{4}/)
    if (match) {
      const [dia, mes, ano] = match[0].split('-');
      return `${dia}/${mes}/${ano}`;
    }
    const data = new Date(dataStr);
    if (!isNaN(data.getTime())) {
      return data.toLocaleDateString('pt-BR');
    }
    return '';
  }

  function parseDataAbertura(dataStr?: string) {
    if (!dataStr) return null;
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
    const data = new Date(dataStr);
    if (!isNaN(data.getTime())) {
      return data;
    }
    return null;
  }

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

  function formatarMotivo(motivo: string) {
    return motivo
      .replace(":", "")
      .trim()
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
      .join(' ');
  }

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

  const buscarMovimentacoesCaixa = async () => {
    setCarregandoCaixa(true)
    setLogsApi([])
    try {
      adicionarLog('🔐 Iniciando processo de login...')
      const token = await obterToken()
      adicionarLog('✅ Token obtido com sucesso')
      const configLojaSelecionada = lojasConfig.find(l => l.idInterno === lojaSelecionada)
      if (!configLojaSelecionada) {
        throw new Error(`Configuração da loja "${lojaSelecionada}" não encontrada`)
      }
      const lojaApiId = configLojaSelecionada.idApi
      adicionarLog(`🏪 Loja selecionada: ${configLojaSelecionada.nomeExibicao} (ID API: ${lojaApiId})`)
      const dataInicialFormatada = formatarDataParaApi(dataInicial);
      const dataFinalFormatada = formatarDataParaApi(dataFinal);
      adicionarLog(`📅 Período: ${dataInicialFormatada} até ${dataFinalFormatada}`)
      const movimentacoesUrl = `${movimentacoesBaseUrl}/${lojaApiId}?data_inicial=${encodeURIComponent(dataInicialFormatada)}&data_final=${encodeURIComponent(dataFinalFormatada)}`
      adicionarLog(`🔍 Buscando movimentações: ${movimentacoesUrl}`)
      const movimentacoesResponse = await fetch(movimentacoesUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!movimentacoesResponse.ok) {
        const errorText = await movimentacoesResponse.text()
        adicionarLog(`❌ Erro na resposta de movimentações: ${errorText}`)
        throw new Error(`Erro ao buscar movimentações: ${movimentacoesResponse.status} - ${errorText}`)
      }
      const movimentacoesData = await movimentacoesResponse.json()
      adicionarLog(`📥 Movimentações recebidas: ${JSON.stringify(movimentacoesData, null, 2)}`)
      adicionarLog(`📊 Total de movimentações: ${movimentacoesData.data?.length || 0}`)
      const historicoUrl = `${historicoBaseUrl}/${lojaApiId}?data_inicial=${encodeURIComponent(dataInicialFormatada)}&data_final=${encodeURIComponent(dataFinalFormatada)}&withDeleted=true&all_sales=true`
      adicionarLog(`🔍 Buscando histórico: ${historicoUrl}`)
      const historicoResponse = await fetch(historicoUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!historicoResponse.ok) {
        const errorText = await historicoResponse.text()
        adicionarLog(`❌ Erro na resposta de histórico: ${errorText}`)
        throw new Error(`Erro ao buscar histórico: ${historicoResponse.status} - ${errorText}`)
      }
      const historicoData = await historicoResponse.json()
      adicionarLog(`📥 Histórico recebido: ${JSON.stringify(historicoData, null, 2)}`)
      adicionarLog(`📊 Total de registros de histórico: ${historicoData.data?.length || 0}`)
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

  const formatarDataHora = (created_at: string) => {
    const [rawDate, hora] = created_at.split(" ")
    let [a, b, c] = rawDate.split("-")
    if (parseInt(a) > 31) [a, b, c] = [c, b, a]
    const data = `${a.padStart(2, "0")}/${b.padStart(2, "0")}/${c}`
    return { data, hora }
  }

  const historicoFiltrado = dadosCaixa?.historico.filter(hist => {
    if (!hist.opened_at) return false;
    const [dataPart] = hist.opened_at.split(" ");
    const [dia, mes, ano] = dataPart.split("-");
    const dataAbertura = new Date(`${ano}-${mes}-${dia}`);
    const dataInicialFiltro = new Date(dataInicial);
    dataInicialFiltro.setHours(0, 0, 0, 0);
    const dataFinalFiltro = new Date(dataFinal);
    dataFinalFiltro.setHours(23, 59, 59, 999);
    return dataAbertura >= dataInicialFiltro && dataAbertura <= dataFinalFiltro;
  }) || [];

  const handleSync = async () => {
    if (!dadosCaixa?.historico) {
      toast.error('Nenhum dado disponível para sincronizar')
      return
    }

    setSyncing(true)
    try {
      const result = await syncCaixaData(dadosCaixa.historico)
      if (result.success) {
        toast.success('Dados sincronizados com sucesso!')
      } else {
        toast.error('Erro ao sincronizar dados: ' + (result.error as Error).message)
      }
    } catch (error) {
      toast.error('Erro ao sincronizar dados: ' + (error as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white">💰 Controle de Caixa</h1>
          {dadosCaixa && (
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-database"
                  >
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                  Sincronizar com Banco
                </>
              )}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="loja">Loja</Label>
            <Select value={lojaSelecionada} onValueChange={setLojaSelecionada}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lojasConfig.map(loja => (
                  <SelectItem key={loja.idInterno} value={loja.idInterno}>{loja.nomeExibicao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dataInicial">Data Inicial</Label>
            <DatePicker
              value={dataInicial}
              onChange={(value) => setDataInicial(value)}
              placeholder="Selecione a data inicial"
            />
          </div>
          <div>
            <Label htmlFor="dataFinal">Data Final</Label>
            <DatePicker
              value={dataFinal}
              onChange={(value) => setDataFinal(value)}
              placeholder="Selecione a data final"
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
        {dadosCaixa && (
          <div className="space-y-4">
            {/* Resumo do Faturamento */}
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
                    <div className="text-lg font-semibold text-red-600">Saídas</div>
                    <div className="text-xl font-mono">
                      {formatarMoeda(
                        dadosCaixa.historico.reduce((total, h) => total + Number(h.out_result || 0), 0)
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-400">Furos</div>
                    <div className="text-xl font-mono">
                      {formatarMoeda(
                        dadosCaixa.historico.reduce((total, h) => total + (Number(h.result_cash) < 0 ? Number(h.result_cash) : 0), 0)
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-400">Sobras</div>
                    <div className="text-xl font-mono">
                      {formatarMoeda(
                        dadosCaixa.historico.reduce((total, h) => total + (Number(h.result_cash) > 0 ? Number(h.result_cash) : 0), 0)
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Tabs defaultValue="historico" className="space-y-4">
              <TabsList>
                <TabsTrigger value="historico">Histórico do Caixa</TabsTrigger>
                <TabsTrigger value="movimentacoes">Movimentações do Caixa</TabsTrigger>
                <TabsTrigger value="logs">Logs da API</TabsTrigger>
              </TabsList>
              <TabsContent value="historico">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico do Caixa</CardTitle>
                    <CardDescription>
                      Aberturas e fechamentos de caixa
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
                            const historicoOrdenado = [...historicoFiltrado].sort((a, b) => {
                              const dataA = parseDataAbertura(a.opened_at)?.getTime() || 0;
                              const dataB = parseDataAbertura(b.opened_at)?.getTime() || 0;
                              return dataA - dataB;
                            });
                            return historicoOrdenado.map((hist, idx) => (
                              <TableRow key={hist.id}>
                                <TableCell>{formatarDataBR(hist.opened_at)}</TableCell>
                                <TableCell className="font-medium text-gray-600">
                                  {formatarPrimeiroNome(hist.opened_user?.full_name)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-gray-600">
                                  {hist.cash_id}
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold">
                                  {formatarMoeda(Number(hist.amount_on_open) || 0)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-red-600">
                                  {formatarMoeda(Number(hist.out_result) || 0)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-green-600">
                                  {formatarMoeda(Number(hist.in_result) || 0)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-white font-semibold">
                                  {formatarMoeda(Number(hist.amount_on_close) || 0)}
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
                                          className="cursor-pointer border-b border-dotted border-gray-400"
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
                            ));
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
                              <TableCell>{formatarMotivo(mov.reason)}</TableCell>
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
    </div>
  )
} 