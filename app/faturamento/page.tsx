"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye } from "lucide-react"
import { toast } from "sonner"
import { useSelectedStore } from "@/hooks/useSelectedStore"
import { DatePicker } from "@/components/ui/date-picker"

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

export default function FaturamentoPage() {
  const { selectedStore, lojasConfig } = useSelectedStore()
  
  // Estados separados para o benchmark
  const [lojaSelecionadaBenchmark, setLojaSelecionadaBenchmark] = useState<string>('')
  const [dataInicialBenchmark, setDataInicialBenchmark] = useState<string>(new Date().toISOString().split('T')[0])
  const [dataFinalBenchmark, setDataFinalBenchmark] = useState<string>(new Date().toISOString().split('T')[0])
  const [dadosBenchmark, setDadosBenchmark] = useState<BenchmarkStore[]>([])
  const [carregandoBenchmark, setCarregandoBenchmark] = useState(false)
  const [logsApi, setLogsApi] = useState<string[]>([])

  // Definir loja selecionada quando selectedStore estiver disponível
  useEffect(() => {
    if (selectedStore) {
      setLojaSelecionadaBenchmark(selectedStore)
    }
  }, [selectedStore])

  // Endpoints e credenciais via variáveis de ambiente
  const loginUrl = process.env.NEXT_PUBLIC_API_LOGIN_URL as string
  const benchmarkBaseUrl = process.env.NEXT_PUBLIC_API_BENCHMARK_URL as string
  const credenciais = {
    username: process.env.NEXT_PUBLIC_API_USERNAME as string,
    password: process.env.NEXT_PUBLIC_API_PASSWORD as string
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const adicionarLog = (mensagem: string) => {
    console.log(mensagem)
    setLogsApi(prev => [...prev, `${new Date().toLocaleTimeString()}: ${mensagem}`])
  }

  function formatarDataParaApi(data: string) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
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

  function formatarNomeLojaApiParaExibicao(nomeApi: string): string {
    const nomeApiNormalizado = nomeApi.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
    const lojaEncontrada = lojasConfig.find(l => {
        const nomeExibicaoNormalizado = l.nomeExibicao.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
        return nomeExibicaoNormalizado === nomeApiNormalizado || l.idInterno === nomeApiNormalizado;
    });
    return lojaEncontrada ? lojaEncontrada.nomeExibicao : nomeApi;
  }

  // Função para buscar dados de benchmark
  const buscarDadosBenchmark = async () => {
    setCarregandoBenchmark(true)
    setLogsApi([])
    
    try {
      adicionarLog('🔐 Iniciando processo de login...')
      const token = await obterToken()
      adicionarLog('✅ Token obtido com sucesso')
      
      const lojaId = lojasConfig.find(l => l.idInterno === lojaSelecionadaBenchmark)?.idApi
      if (!lojaId) {
        throw new Error(`Loja "${lojaSelecionadaBenchmark}" não encontrada`)
      }
      adicionarLog(`🏪 Loja selecionada: ${lojaSelecionadaBenchmark} (ID API: ${lojaId})`)

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
          company_name: formatarNomeLojaApiParaExibicao(store.company_name),
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white">📊 Faturamento</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por Loja</CardTitle>
            <CardDescription>
              Comparativo de faturamento entre as lojas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="lojaBenchmark">Loja</Label>
                  <Select value={lojaSelecionadaBenchmark} onValueChange={setLojaSelecionadaBenchmark}>
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
                  <Label htmlFor="dataInicialBenchmark">Data Inicial</Label>
                  <DatePicker
                    id="dataInicialBenchmark"
                    value={dataInicialBenchmark}
                    onChange={(value) => setDataInicialBenchmark(value)}
                    placeholder="Selecione a data inicial"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dataFinalBenchmark">Data Final</Label>
                  <DatePicker
                    id="dataFinalBenchmark"
                    value={dataFinalBenchmark}
                    onChange={(value) => setDataFinalBenchmark(value)}
                    placeholder="Selecione a data final"
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
                          <TableCell>{store.company_name}</TableCell>
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

              {dadosBenchmark.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-lg font-semibold">Top 5 Lojas</h3>
                  {dadosBenchmark.slice(0, 5).map((item, idx) => {
                    const percent = (item.balance.total / dadosBenchmark[0].balance.total) * 100;
                    return (
                      <div key={item.id} className="flex items-center bg-card rounded-lg border p-3 shadow-sm">
                        <div className="w-10 text-lg font-bold text-orange-500 text-center">{item.position}º</div>
                        <div className="flex-1 ml-2">
                          <div className="text-primary font-medium">{item.company_name}</div>
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
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
                  <p className="text-muted-foreground">
                    Selecione um período e clique em Consultar para visualizar o faturamento das lojas.
                  </p>
                </div>
              )}

              {/* Logs da API */}
              {logsApi.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Logs da API</CardTitle>
                    <CardDescription>
                      Registro detalhado das chamadas à API
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
                      {logsApi.map((log, index) => (
                        <div key={index} className="mb-1">
                          {log}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 