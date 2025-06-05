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
import { salvarMovimentacaoSCM } from "@/lib/supabase"

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
  jaConferido?: boolean
}

interface DadosCaixa {
  movimentacoes: MovimentacaoCaixa[]
  historico: HistoricoCaixa[]
}

interface SCMControleCaixaProps {
  onSelecionarCaixa?: (caixaObj: any) => void;
}

// Novo tipo para armazenar id e diferença
interface ProximoIdDiff {
  id: number;
  diff: number;
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
  const [idsFechamentosUsados, setIdsFechamentosUsados] = useState<number[]>([])
  const [idsAberturasVinculadas, setIdsAberturasVinculadas] = useState<number[]>([])
  const [idsValoresProximos, setIdsValoresProximos] = useState<ProximoIdDiff[]>([])
  const [idsFechamentosProximos, setIdsFechamentosProximos] = useState<ProximoIdDiff[]>([])

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

  // Função para verificar se o caixa já foi conferido
  const verificarCaixaConferido = async (caixaId: number, historicoId: number) => {
    try {
      if (!caixaId || !historicoId) {
        console.log("IDs não fornecidos:", { caixaId, historicoId });
        return false;
      }

      const supabase = await import("@/lib/supabase")
      const client = supabase.createSupabaseClient(selectedStore)
      
      console.log("Verificando caixa:", { caixaId, historicoId }, "para loja:", selectedStore);
      
      const { data, error } = await client
        .from("scm_movimentacoes")
        .select("id")
        .eq("cash_id", caixaId)
        .eq("historico_id", historicoId)
        .maybeSingle()

      if (error) {
        console.error("Erro ao verificar caixa:", error);
        return false;
      }

      console.log("Resultado da verificação:", data);
      return !!data;
    } catch (e) {
      console.error("Erro ao verificar caixa:", e);
      return false;
    }
  }

  // Função para verificar se os valores são próximos (diferença <= R$ 2,00)
  const valoresSaoProximos = (valor1: number, valor2: number): boolean => {
    return Math.abs(valor1 - valor2) <= 2;
  };

  const verificarCorrespondenciaAberturaFechamento = (historico: HistoricoCaixa[]) => {
    const historicoOrdenado = [...historico].sort((a, b) => {
      const dataA = parseDataAbertura(a.opened_at)?.getTime() || 0;
      const dataB = parseDataAbertura(b.opened_at)?.getTime() || 0;
      return dataA - dataB;
    });

    const novosIdsFechamentosUsados: number[] = [];
    const novosIdsAberturasVinculadas: number[] = [];
    const novosIdsValoresProximos: ProximoIdDiff[] = [];
    const novosIdsFechamentosProximos: ProximoIdDiff[] = [];

    historicoOrdenado.forEach((hist, idx) => {
      let encontrouCorrespondencia = false;
      for (let i = 0; i < idx; i++) {
        const candidato = historicoOrdenado[i];
        if (!novosIdsFechamentosUsados.includes(candidato.id)) {
          const valorAbertura = Number(hist.amount_on_open);
          const valorFechamento = Number(candidato.amount_on_close);
          
          if (valorAbertura === valorFechamento) {
            novosIdsFechamentosUsados.push(candidato.id);
            novosIdsAberturasVinculadas.push(hist.id);
            encontrouCorrespondencia = true;
            break;
          } else if (valoresSaoProximos(valorAbertura, valorFechamento)) {
            const diff = Math.abs(valorAbertura - valorFechamento);
            novosIdsValoresProximos.push({ id: hist.id, diff });
            novosIdsFechamentosProximos.push({ id: candidato.id, diff });
            encontrouCorrespondencia = true;
            break;
          }
        }
      }
    });

    setIdsFechamentosUsados(novosIdsFechamentosUsados);
    setIdsAberturasVinculadas(novosIdsAberturasVinculadas);
    setIdsValoresProximos(novosIdsValoresProximos);
    setIdsFechamentosProximos(novosIdsFechamentosProximos);
  };

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

      // Verificar quais caixas já foram conferidos
      console.log("Iniciando verificação de caixas conferidos...");
      const historicoComVerificacao = await Promise.all(
        (historicoData.data || []).map(async (hist: HistoricoCaixa) => {
          try {
            const jaConferido = await verificarCaixaConferido(hist.cash_id, hist.id);
            console.log(`Caixa ${hist.cash_id} (ID: ${hist.id}) - Conferido: ${jaConferido}`);
            return { ...hist, jaConferido };
          } catch (e) {
            console.error(`Erro ao verificar caixa ${hist.cash_id} (ID: ${hist.id}):`, e);
            return { ...hist, jaConferido: false };
          }
        })
      )

      // Verificar correspondência entre aberturas e fechamentos
      verificarCorrespondenciaAberturaFechamento(historicoComVerificacao);

      setDadosCaixa({
        movimentacoes: movimentacoesData.data || [],
        historico: historicoComVerificacao
      })
      toast.success('Dados do caixa carregados com sucesso!')
    } catch (error: any) {
      console.error("Erro completo:", error);
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

  // Função para buscar a diferença exata pelo id
  const getDiffById = (arr: ProximoIdDiff[], id: number) => {
    const found = arr.find(item => item.id === id);
    return found ? found.diff : null;
  };

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
                        return historicoOrdenado.map((hist: HistoricoCaixa, idx) => {
                          const valorAberturaCorresponde = idsAberturasVinculadas.includes(hist.id);
                          const fechamentoFoiUsado = idsFechamentosUsados.includes(hist.id);
                          
                          return (
                            <TableRow key={hist.id}>
                              {onSelecionarCaixa && !hist.jaConferido && (
                                <TableCell>
                                  <Badge 
                                    className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white"
                                    onClick={() => onSelecionarCaixa(hist)}
                                  >
                                    Selecionar
                                  </Badge>
                                </TableCell>
                              )}
                              {onSelecionarCaixa && hist.jaConferido && (
                                <TableCell>
                                  <Badge className="cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white">
                                    Conferido
                                  </Badge>
                                </TableCell>
                              )}
                              <TableCell>{formatarDataBR(hist.opened_at)}</TableCell>
                              <TableCell className="font-medium text-gray-600">
                                {formatarPrimeiroNome(hist.opened_user?.full_name)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center justify-end gap-1">
                                        {formatarMoeda(Number(hist.amount_on_open) || 0)}
                                        {valorAberturaCorresponde ? (
                                          <span className="text-green-500">
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                          </span>
                                        ) : getDiffById(idsValoresProximos, hist.id) !== null ? (
                                          <span className="text-blue-500">
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                          </span>
                                        ) : (
                                          <span className="text-red-500">
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs break-words whitespace-pre-line text-center">
                                      {valorAberturaCorresponde
                                        ? 'Abertura corresponde a um fechamento anterior'
                                        : getDiffById(idsValoresProximos, hist.id) !== null
                                        ? `Abertura tem valor próximo a um fechamento anterior (diferença: R$ ${getDiffById(idsValoresProximos, hist.id)?.toFixed(2).replace('.', ',')})`
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
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center justify-end gap-1">
                                        {formatarMoeda(Number(hist.amount_on_close) || 0)}
                                        {fechamentoFoiUsado ? (
                                          <span className="text-green-500">
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                          </span>
                                        ) : getDiffById(idsFechamentosProximos, hist.id) !== null ? (
                                          <span className="text-blue-500">
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                          </span>
                                        ) : (
                                          <span className="text-red-500">
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs break-words whitespace-pre-line text-center">
                                      {fechamentoFoiUsado
                                        ? 'Fechamento foi usado para satisfazer uma abertura'
                                        : getDiffById(idsFechamentosProximos, hist.id) !== null
                                        ? `Fechamento tem valor próximo a uma abertura posterior (diferença: R$ ${getDiffById(idsFechamentosProximos, hist.id)?.toFixed(2).replace('.', ',')})`
                                        : 'Fechamento não foi usado para nenhuma abertura'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="text-right">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className={`font-mono font-semibold ${Number(hist.result_cash) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatarMoeda(Number(hist.result_cash) || 0)}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-lg max-h-40 overflow-y-auto break-words whitespace-pre-line text-center" side="top" align="center">
                                      <p>{hist.observation || 'Sem observação'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          );
                        });
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