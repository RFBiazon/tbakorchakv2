"use client"
// Componente duplicado do ControleCaixa para customizações exclusivas do SCM
// A partir daqui, pode ser customizado livremente para o fluxo SCM

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

interface SCMControleCaixaProps {
  onSelecionarCaixa?: (caixaObj: any) => void;
}

export function SCMControleCaixa({ onSelecionarCaixa }: SCMControleCaixaProps) {
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
    const match = dataStr.match(/\d{2}-\d{2}-\d{4}/)
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
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais)
    })
    if (!response.ok) throw new Error(`Erro no login: ${response.status}`)
    const data = await response.json()
    if (!data.access_token) throw new Error("Token não encontrado na resposta")
    return data.access_token
  }

  const buscarMovimentacoesCaixa = async () => {
    setCarregandoCaixa(true)
    setLogsApi([])
    try {
      const token = await obterToken()
      const configLojaSelecionada = lojasConfig.find(l => l.idInterno === lojaSelecionada)
      if (!configLojaSelecionada) throw new Error(`Configuração da loja "${lojaSelecionada}" não encontrada`)
      const lojaApiId = configLojaSelecionada.idApi
      const dataInicialFormatada = formatarDataParaApi(dataInicial);
      const dataFinalFormatada = formatarDataParaApi(dataFinal);
      const movimentacoesUrl = `${movimentacoesBaseUrl}/${lojaApiId}?data_inicial=${encodeURIComponent(dataInicialFormatada)}&data_final=${encodeURIComponent(dataFinalFormatada)}`
      const movimentacoesResponse = await fetch(movimentacoesUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!movimentacoesResponse.ok) throw new Error(`Erro ao buscar movimentações: ${movimentacoesResponse.status}`)
      const movimentacoesData = await movimentacoesResponse.json()
      const historicoUrl = `${historicoBaseUrl}/${lojaApiId}?data_inicial=${encodeURIComponent(dataInicialFormatada)}&data_final=${encodeURIComponent(dataFinalFormatada)}&withDeleted=true&all_sales=true`
      const historicoResponse = await fetch(historicoUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!historicoResponse.ok) throw new Error(`Erro ao buscar histórico: ${historicoResponse.status}`)
      const historicoData = await historicoResponse.json()
      setDadosCaixa({
        movimentacoes: movimentacoesData.data || [],
        historico: historicoData.data || []
      })
      toast.success('Dados do caixa carregados com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao carregar dados do caixa: ' + error.message)
    } finally {
      setCarregandoCaixa(false)
    }
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

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white">💰 Controle de Caixa</h1>
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
                        {onSelecionarCaixa && <TableHead></TableHead>}
                        <TableHead>Data</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead className="text-right">Abertura</TableHead>
                        <TableHead className="text-right">Saídas</TableHead>
                        <TableHead className="text-right">Entradas</TableHead>
                        <TableHead className="text-right">Fechamento</TableHead>
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
                            {onSelecionarCaixa && (
                              <TableCell>
                                <Button size="sm" variant="outline" onClick={() => onSelecionarCaixa(hist)}>
                                  Selecionar
                                </Button>
                              </TableCell>
                            )}
                            <TableCell>{formatarDataBR(hist.opened_at)}</TableCell>
                            <TableCell className="font-medium text-gray-600">
                              {formatarPrimeiroNome(hist.opened_user?.full_name)}
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
                            <TableCell className="text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className={`font-mono font-semibold ${Number(hist.result_cash) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatarMoeda(Number(hist.result_cash) || 0)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{hist.observation || 'Sem observação'}</p>
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 