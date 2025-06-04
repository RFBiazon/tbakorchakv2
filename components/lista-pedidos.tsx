"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { type Pedido, getPedidos, arquivarPedido, desarquivarPedido, getSupabaseClient, deletePedido } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Home, Download, Printer, BarChart2, Trash2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import lojasConfigData from '../lojas.config.json';
import { DatePicker } from "./ui/date-picker"
import { Badge } from "./ui/badge"

// Definir uma interface para o objeto de configuração da loja
interface LojaConfig {
  idInterno: string;
  nomeExibicao: string;
  idApi: string;
  supabaseUrlEnvVar: string;
  supabaseKeyEnvVar: string;
}

// Tipar o array importado
const lojasConfig: LojaConfig[] = lojasConfigData;

const getLojaName = (idInterno: string) => {
  const loja = lojasConfig.find((loja: LojaConfig) => loja.idInterno === idInterno);
  return loja ? loja.nomeExibicao : idInterno;
}

export function ListaPedidos() {
  const [pedidos, setPedidos] = useState<{
    aConferir: Pedido[]
    conferidos: Pedido[]
    pendentes: Pedido[]
    arquivados: Pedido[]
  }>({
    aConferir: [],
    conferidos: [],
    pendentes: [],
    arquivados: [],
  })
  const [filtro, setFiltro] = useState("")
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLoja, setSelectedLoja] = useState("")
  const [modalPedidosApiAberto, setModalPedidosApiAberto] = useState(false)
  const [pedidosApi, setPedidosApi] = useState<any[]>([])
  const [carregandoPedidosApi, setCarregandoPedidosApi] = useState(false)
  const [erroPedidosApi, setErroPedidosApi] = useState<string | null>(null)
  const [modalProdutosAberto, setModalProdutosAberto] = useState(false)
  const [produtosPedido, setProdutosPedido] = useState<any[]>([])
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null)
  const [alertCsvOpen, setAlertCsvOpen] = useState(false)
  const [csvPedidoId, setCsvPedidoId] = useState<string | null>(null)
  const [csvPedidoVhsys, setCsvPedidoVhsys] = useState<string | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [alertLimparOpen, setAlertLimparOpen] = useState(false)
  const [limpandoPedidos, setLimpandoPedidos] = useState(false)
  const [alertDeleteOpen, setAlertDeleteOpen] = useState(false)
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState<number | null>(null)
  const [excluindoPedido, setExcluindoPedido] = useState(false)
  const [lojaApi, setLojaApi] = useState<string | undefined>(undefined)
  const [previewCsvOpen, setPreviewCsvOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{
    numeroPedido: string;
    produtos: { nome: string; quantidade: number }[];
    csvText: string;
  } | null>(null)

  // Filtros para o modal de pedidos API
  const lojasApi = lojasConfig.map((loja: LojaConfig) => ({ id: parseInt(loja.idApi), nome: loja.nomeExibicao }));

  // Função para normalizar o valor da loja
  function normalizeLoja(loja: string | null) {
    return loja?.toLowerCase().replace(/\s/g, '');
  }

  // Função para mapear selectedLoja para o ID da loja da API
  function mapSelectedLojaToApiId(selectedLojaIdInterno: string) {
    console.log('mapSelectedLojaToApiId input:', { selectedLojaIdInterno });
    
    if (!selectedLojaIdInterno) {
      console.log('No selectedLojaIdInterno provided');
      return undefined;
    }

    const lojaConfig = lojasConfig.find((loja: LojaConfig) => loja.idInterno === selectedLojaIdInterno);
    
    if (lojaConfig) {
      console.log('mapSelectedLojaToApiId result:', { apiId: lojaConfig.idApi });
      return lojaConfig.idApi;
    } else {
      console.log('mapSelectedLojaToApiId: Loja não encontrada no config para:', selectedLojaIdInterno);
      return undefined;
    }
  }

  const [dataInicialApi, setDataInicialApi] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })
  const [dataFinalApi, setDataFinalApi] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    const loja = localStorage.getItem('selectedStore');
    console.log('Initial store selection:', { loja });
    if (loja) {
      setSelectedLoja(loja);
      const apiId = mapSelectedLojaToApiId(loja);
      console.log('Setting lojaApi:', { apiId });
      setLojaApi(apiId);
    }
  }, []);

  useEffect(() => {
    carregarPedidos();
  }, []);

  useEffect(() => {
    if (lojaApi) {
      buscarPedidosApi();
    }
  }, [lojaApi]);

  useEffect(() => {
    console.log('lojaApi:', lojaApi);
  }, [lojaApi]);

  async function carregarPedidos() {
    try {
      setLoading(true)
      const data = await getPedidos()
      setPedidos(data)
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err)
      setError("Erro ao carregar pedidos. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function filtrarPedidos(lista: Pedido[]) {
    if (!filtro) return lista
    const termo = filtro.toLowerCase()
    return lista.filter((p) => p.numero.toString().toLowerCase().includes(termo))
  }

  function handleArquivar(pedidoId: number, numeroPedido: string) {
    arquivarPedido(pedidoId, numeroPedido)
    carregarPedidos()
  }

  function handleDesarquivar(pedidoId: number) {
    desarquivarPedido(pedidoId)
    carregarPedidos()
  }

  function toggleSearch() {
    setSearchExpanded(!searchExpanded)
    if (!searchExpanded) {
      setTimeout(() => {
        document.getElementById("filtroPedido")?.focus()
      }, 300)
    }
  }

  async function limparPedidos() {
    const supabase = getSupabaseClient();
    await supabase.from("historico_estoque").delete().neq("id", 0);
    await supabase.from("pendencias").delete().neq("id", 0);
    await supabase.from("conferidos").delete().neq("id", 0);
  }

  async function handleDelete(pedidoId: number) {
    setPedidoParaExcluir(pedidoId);
    setAlertDeleteOpen(true);
  }

  // Função para obter token (igual ao financeiro)
  async function obterTokenApi() {
    const loginUrl = process.env.NEXT_PUBLIC_API_LOGIN_URL as string
    const credenciais = {
      username: process.env.NEXT_PUBLIC_API_USERNAME as string,
      password: process.env.NEXT_PUBLIC_API_PASSWORD as string
    }
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais)
    })
    if (!response.ok) throw new Error("Erro ao obter token")
    const data = await response.json()
    if (!data.access_token) throw new Error("Token não encontrado na resposta")
    return data.access_token
  }

  // Função para buscar pedidos da API externa
  async function buscarPedidosApi() {
    setCarregandoPedidosApi(true)
    setErroPedidosApi(null)
    try {
      const token = await obterTokenApi()
      // Formatar datas para dd/MM/yyyy
      const formatarData = (data: string) => {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
      }
      const url = `https://amatech-prd.azure-api.net/api/odin/orders?stores_ids=${lojaApi}&page=1&size=30&data_inicial=${formatarData(dataInicialApi)}&data_final=${formatarData(dataFinalApi)}`
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!response.ok) throw new Error("Erro ao buscar pedidos da API")
      const data = await response.json()
      setPedidosApi(data.content || [])
    } catch (err: any) {
      setErroPedidosApi(err.message || "Erro desconhecido")
    } finally {
      setCarregandoPedidosApi(false)
    }
  }

  // Função para deixar o nome do produto em Title Case
  function titleCase(str: string) {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Função para verificar se um pedido já existe no sistema
  function pedidoExisteNoSistema(numeroPedido: string | number | undefined): boolean {
    if (!numeroPedido) return false;
    const numeroStr = String(numeroPedido);
    const todosPedidos = [
      ...pedidos.aConferir,
      ...pedidos.conferidos,
      ...pedidos.pendentes,
      ...pedidos.arquivados
    ];
    const existe = todosPedidos.some(p => String(p.numero) === numeroStr);
    // Debug: mostrar no console as comparações
    if (!existe) {
      console.log('[DEBUG] Pedido NÃO conferido:', numeroStr, 'Comparando com:', todosPedidos.map(p => p.numero));
    }
    return existe;
  }

  // Função para retornar o status do pedido da API
  function statusPedidoApi(numeroPedido: string | number | undefined): { label: string, color: string } {
    if (!numeroPedido) return { label: 'Pendente de Cadastro', color: 'bg-red-100 text-red-800' };
    const numeroStr = String(numeroPedido);
    if (pedidos.conferidos.some(p => String(p.numero) === numeroStr)) {
      return { label: 'Conferido', color: 'bg-green-100 text-green-800' };
    }
    if (pedidos.arquivados.some(p => String(p.numero) === numeroStr)) {
      return { label: 'Arquivado', color: 'bg-gray-200 text-gray-800' };
    }
    if (pedidos.pendentes.some(p => String(p.numero) === numeroStr)) {
      return { label: 'Com Pendências', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (pedidos.aConferir.some(p => String(p.numero) === numeroStr)) {
      return { label: 'A Conferir', color: 'bg-blue-100 text-blue-800' };
    }
    return { label: 'Pendente de Cadastro', color: 'bg-red-100 text-red-800' };
  }

  // Novo: função para processar CSV e extrair dados
  function extrairDadosCsv(csvText: string) {
    // Remover a primeira linha
    const linhas = csvText.split('\n').filter(Boolean);
    if (linhas.length === 0) return { numeroPedido: '', produtos: [], csvText };
    const linhasSemPrimeira = linhas.slice(1);

    // Extrair número do pedido
    let numeroPedido = '';
    for (const linha of linhasSemPrimeira) {
      if (linha.toLowerCase().includes('num. pedido')) {
        const partes = linha.split(',');
        numeroPedido = partes[1]?.replaceAll('"', '').trim() || '';
        break;
      }
    }

    // Extrair produtos (após linha com 'PRODUTO')
    const idxProdutos = linhasSemPrimeira.findIndex(l => l.toLowerCase().includes('produto') && l.toLowerCase().includes('quantidade'));
    const produtos: { nome: string; quantidade: number }[] = [];
    if (idxProdutos !== -1) {
      for (let i = idxProdutos + 1; i < linhasSemPrimeira.length; i++) {
        const linha = linhasSemPrimeira[i];
        if (/total|peso|valor|Num\. Pedido|OBSERVACAO|PRODUTO/i.test(linha)) continue;
        const col = linha.split(',').map((x: string) => x.replaceAll('"', '').trim());
        const produto = col[0];
        const quantidade = Number.parseInt(col[1]);
        if (produto && !isNaN(quantidade)) {
          produtos.push({ nome: produto, quantidade });
        }
      }
    }
    return { numeroPedido, produtos, csvText: linhasSemPrimeira.join('\n') };
  }

  // Modificar processarCsvESalvar para usar extrairDadosCsv e abrir modal editável
  async function processarCsvESalvar(pedido: any) {
    console.log('[FUNC] processarCsvESalvar chamado para pedido', pedido.id);
    try {
      console.log('[CSV] Iniciando processo para pedido', pedido.id);
      setCsvLoading(true);
      console.log('[CSV] Obtendo token da API...');
      const token = await obterTokenApi();
      console.log('[CSV] Token obtido');
      const url = `https://amatech-prd.azure-api.net/api/odin/orders/${pedido.id}/csv`;
      console.log('[CSV] Baixando CSV do pedido...');
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Erro ao baixar CSV");
      console.log('[CSV] CSV baixado');
      const csvText = await response.text();
      console.log('[CSV] Processando CSV...');
      const { numeroPedido, produtos, csvText: csvEditavel } = extrairDadosCsv(csvText);
      console.log('[CSV] CSV processado, abrindo modal de preview');
      setPreviewData({
        numeroPedido,
        produtos,
        csvText: csvEditavel
      });
      setPreviewCsvOpen(true);
      setAlertCsvOpen(false);
    } catch (err) {
      console.error("Erro ao processar CSV:", err);
      toast.error("Erro ao processar CSV do pedido");
    } finally {
      setCsvLoading(false);
    }
  }

  // Modificar o handler do botão de cadastrar pedido
  const enviarCsvDrive = async () => {
    console.log('[UI] Clique em Cadastrar Pedido no AlertDialog');
    console.log('[DEBUG] pedidoSelecionado:', pedidoSelecionado);
    if (!pedidoSelecionado) return;
    await processarCsvESalvar(pedidoSelecionado);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white">📦 Lista de Pedidos</h1>
        <div className="flex gap-2">
          <Link href="/relatorios" className="text-foreground hover:text-primary text-xl md:text-2xl" title="Ir para relatórios">
            <BarChart2 />
          </Link>
          <Dialog open={modalPedidosApiAberto} onOpenChange={(open) => {
            setModalPedidosApiAberto(open);
            if (open) {
              const loja = localStorage.getItem('selectedStore');
              if (loja) setLojaApi(mapSelectedLojaToApiId(loja));
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={buscarPedidosApi}>
                <Eye className="mr-2 h-4 w-4" />
                Pedidos API
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Pedidos da API Externa</DialogTitle>
                <DialogDescription>
                  Visualize os pedidos recebidos do sistema externo (vhsys).
                </DialogDescription>
              </DialogHeader>
              {/* Filtros do modal */}
              <div className="flex flex-wrap gap-2 mb-4">
                {lojaApi ? (
                  <div>
                    <label className="block text-xs mb-1">Loja</label>
                    <Select value={lojaApi} onValueChange={setLojaApi}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lojasApi.map(loja => (
                          <SelectItem key={loja.id} value={loja.id.toString()}>{loja.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>Carregando loja...</div>
                )}
                <div>
                  <label className="block text-xs mb-1">Data Inicial</label>
                  <DatePicker 
                    value={dataInicialApi} 
                    onChange={(value) => setDataInicialApi(value)} 
                    className="w-36"
                    placeholder="Data inicial"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Data Final</label>
                  <DatePicker 
                    value={dataFinalApi} 
                    onChange={(value) => setDataFinalApi(value)} 
                    className="w-36"
                    placeholder="Data final"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={buscarPedidosApi} disabled={carregandoPedidosApi}>
                    <Eye className="mr-2 h-4 w-4" /> Consultar
                  </Button>
                </div>
              </div>
              {carregandoPedidosApi ? (
                <div className="text-center py-8">Carregando pedidos...</div>
              ) : erroPedidosApi ? (
                <div className="text-red-500 text-center py-4">{erroPedidosApi}</div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {pedidosApi.length === 0 ? (
                    <div className="text-muted-foreground text-center py-4">Nenhum pedido encontrado.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2"># Pedido (vhsys)</th>
                          <th className="text-left py-2">Loja</th>
                          <th className="text-left py-2">Data</th>
                          <th className="text-right py-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedidosApi.map((pedido) => {
                          // Data: pegar created_at e converter para dd/MM/aaaa
                          let dataFormatada = "-";
                          if (pedido.created_at) {
                            const [dia, mes, ano] = pedido.created_at.split(" ")[0].split("-");
                            dataFormatada = `${dia}/${mes}/${ano}`;
                          }
                          // Loja: store.company_name
                          const loja = pedido.store?.company_name || "-";
                          // Valor: invoices.f2_valfat (pode ser array ou objeto)
                          let valor = "-";
                          if (pedido.invoices) {
                            let invoiceObj = Array.isArray(pedido.invoices) ? pedido.invoices[0] : pedido.invoices;
                            if (invoiceObj && invoiceObj.f2_valfat) {
                              valor = `R$ ${Number(invoiceObj.f2_valfat).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                            }
                          }

                          // Verificar se o pedido já existe no sistema (declarar apenas aqui)
                          const pedidoJaExiste = pedidoExisteNoSistema(pedido.vhsys);

                          // Handler para abrir modal de produtos
                          const abrirModalProdutos = () => {
                            const produtos = Array.isArray(pedido.orderItems)
                              ? pedido.orderItems.map((item: any) => ({
                                  name: item.products?.name ? titleCase(item.products.name) : '-',
                                  quantity: item.quantity || '-'
                                }))
                              : [];
                            setProdutosPedido(produtos);
                            setPedidoSelecionado(pedido);
                            setModalProdutosAberto(true);
                          }
                          // Handler para abrir AlertDialog do CSV
                          const abrirAlertCsv = () => {
                            setPedidoSelecionado(pedido);
                            setCsvPedidoId(pedido.id.toString());
                            setCsvPedidoVhsys(pedido.vhsys?.toString() || pedido.id.toString());
                            setAlertCsvOpen(true);
                            console.log('[UI] AlertDialog aberto para pedido', pedido.id);
                          }
                          // Handler para download do CSV
                          const baixarCsvPedido = async () => {
                            try {
                              setCsvLoading(true);
                              const token = await obterTokenApi();
                              const url = `https://amatech-prd.azure-api.net/api/odin/orders/${pedido.id}/csv`;
                              const response = await fetch(url, {
                                headers: { "Authorization": `Bearer ${token}` }
                              });
                              if (!response.ok) throw new Error("Erro ao baixar CSV");
                              const blob = await response.blob();
                              const urlBlob = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = urlBlob;
                              a.download = `pedido_${pedido.vhsys || pedido.id}.csv`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(urlBlob);
                              toast.success('Download realizado com sucesso!');
                            } catch (err) {
                              toast.error("Erro ao baixar CSV do pedido");
                            } finally {
                              setCsvLoading(false);
                              setAlertCsvOpen(false);
                            }
                          }
                          // Handler para enviar CSV ao Drive
                          const enviarCsvDrive = async () => {
                            console.log('[UI] Clique em Cadastrar Pedido no AlertDialog');
                            console.log('[DEBUG] pedidoSelecionado:', pedidoSelecionado);
                            if (!pedidoSelecionado) return;
                            await processarCsvESalvar(pedidoSelecionado);
                          }

                          // Status do pedido
                          const status = statusPedidoApi(pedido.vhsys);

                          return (
                            <tr key={pedido.id} className="border-b">
                              <td className="py-1 font-mono">
                                <div className="flex items-center gap-2">
                                  <button className="text-blue-600 hover:underline" onClick={abrirModalProdutos} title="Ver produtos do pedido">
                                    {pedido.vhsys}
                                  </button>
                                  <span className={`text-xs px-2 py-0.5 rounded ${status.color}`} title={status.label}>
                                    {status.label}
                                  </span>
                                </div>
                              </td>
                              <td className="py-1">{loja}</td>
                              <td className="py-1">{dataFormatada}</td>
                              <td className="py-1 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span>{valor}</span>
                                  <AlertDialog open={alertCsvOpen && csvPedidoId === pedido.id.toString()} onOpenChange={setAlertCsvOpen}>
                                    <AlertDialogTrigger asChild>
                                      <button onClick={abrirAlertCsv} title="Baixar ou Enviar CSV do pedido" className="text-primary hover:text-primary-foreground">
                                        <Download size={16} />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Exportar Pedido</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          O que deseja fazer com o arquivo CSV do pedido <b>{pedido.vhsys}</b>?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel disabled={csvLoading}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction disabled={csvLoading} onClick={baixarCsvPedido}>Download</AlertDialogAction>
                                        <AlertDialogAction disabled={csvLoading} onClick={enviarCsvDrive}>Cadastrar Pedido</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
          <AlertDialog open={alertLimparOpen} onOpenChange={setAlertLimparOpen}>
            <AlertDialogTrigger asChild>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-semibold"
                title="Limpar todos os pedidos e históricos"
              >
                Limpar Pedidos
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza que deseja excluir TODOS os pedidos e históricos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={limpandoPedidos}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={limpandoPedidos}
                  onClick={async () => {
                    setLimpandoPedidos(true);
                    await limparPedidos();
                    toast.success("Pedidos e históricos excluídos com sucesso!");
                    setLimpandoPedidos(false);
                    setAlertLimparOpen(false);
                    window.location.reload();
                  }}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex gap-4 w-full md:w-auto">
        <div
          className={`flex items-center bg-card rounded transition-all duration-300 ${searchExpanded ? "w-60" : "w-10"}`}
        >
          <button onClick={toggleSearch} className="text-muted-foreground px-3 py-2" aria-label="Buscar pedido">
            <Search size={18} />
          </button>
          <Input
            id="filtroPedido"
            placeholder="Buscar pedido..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className={`bg-transparent border-none focus:ring-0 transition-all duration-300 ${
              searchExpanded ? "w-full opacity-100 px-2 py-2" : "w-0 p-0 opacity-0"
            }`}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Carregando pedidos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 p-4 rounded-md text-center">
          <p className="text-red-400">{error}</p>
          <Button onClick={carregarPedidos} variant="outline" className="mt-2">
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-blue-500 mb-2">🧾 Pedidos a Conferir</h2>
          <ul className="space-y-2 mb-6">
            {filtrarPedidos(pedidos.aConferir).length > 0 ? (
              filtrarPedidos(pedidos.aConferir).map((pedido) => (
                <li key={pedido.id} className="bg-card border border-border px-4 py-3 rounded flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(pedido.id)}
                      className="text-red-500 hover:text-red-400"
                      title="Excluir pedido"
                    >
                      <Trash2 size={18} />
                    </Button>
                  <span className="text-card-foreground">
                    Pedido <strong>#{pedido.numero}</strong>
                  </span>
                  </div>
                  <Link
                    href={`/pedidos/${pedido.id}?numero=${pedido.numero}`}
                    className="text-blue-500 hover:text-blue-400"
                  >
                    Conferir
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Não há pedidos para conferir</li>
            )}
          </ul>

          <div className="mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-green-500">✅ Pedidos Conferidos</h2>
            </div>
            <ul className="ml-4 mt-2 space-y-2">
              {filtrarPedidos(pedidos.conferidos).length > 0 ? (
                filtrarPedidos(pedidos.conferidos).map((pedido) => (
                  <li key={pedido.id} className="bg-card border border-border px-4 py-3 rounded flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(pedido.id)}
                        className="text-red-500 hover:text-red-400"
                        title="Excluir pedido"
                      >
                        <Trash2 size={18} />
                      </Button>
                    <span className="text-card-foreground">
                      Pedido <strong>#{pedido.numero}</strong>
                    </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/visualizar/${pedido.id}?numero=${pedido.numero}&modo=conferido`}
                        className={`${pedido.total_conferida === pedido.total_itens ? "text-green-500" : "text-orange-500"}`}
                      >
                        {pedido.total_conferida === pedido.total_itens ? "✅" : "📦"}{" "}
                        {pedido.total_conferida || pedido.quantidade_recebida} de {pedido.total_itens} Itens Entregues
                      </Link>
                      {pedido.total_conferida === pedido.total_itens && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleArquivar(pedido.id, pedido.numero)}
                          className="text-green-500 hover:text-green-400"
                          title="Arquivar"
                        >
                          📥
                        </Button>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">Não há pedidos conferidos</li>
              )}
            </ul>

            <div className="flex justify-between items-center mt-4">
              <h2 className="text-lg font-bold text-yellow-500">⚠️ Pedidos com Pendências</h2>
            </div>
            <ul className="ml-4 mt-2 space-y-2">
              {filtrarPedidos(pedidos.pendentes).filter(p => (p.quantidade_faltante ?? 0) > 0).length > 0 ? (
                filtrarPedidos(pedidos.pendentes)
                  .filter(p => (p.quantidade_faltante ?? 0) > 0)
                  .map((pedido) => (
                    <li key={pedido.id} className="bg-card border border-border px-4 py-3 rounded flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pedido.id)}
                          className="text-red-500 hover:text-red-400"
                          title="Excluir pedido"
                        >
                          <Trash2 size={18} />
                        </Button>
                      <span className="text-card-foreground">
                        Pedido <strong>#{pedido.numero}</strong>
                      </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/visualizar/${pedido.id}?numero=${pedido.numero}&modo=pendente`}
                          className="text-black dark:text-yellow-500"
                        >
                          ⚠️ {pedido.quantidade_faltante} {pedido.quantidade_faltante === 1 ? 'Item Pendente' : 'Itens Pendentes'}
                        </Link>
                      </div>
                    </li>
                  ))
              ) : (
                <li className="text-muted-foreground">Não há pedidos com itens faltantes</li>
              )}
            </ul>

            <h2 className="text-lg font-bold text-gray-500 mt-4">📁 Pedidos Arquivados</h2>
            <ul className="ml-4 mt-2 space-y-2">
              {filtrarPedidos(pedidos.arquivados).length > 0 ? (
                filtrarPedidos(pedidos.arquivados).map((pedido) => (
                  <li
                    key={pedido.id}
                    className="bg-card border border-border px-4 py-3 rounded flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(pedido.id)}
                        className="text-red-500 hover:text-red-400"
                        title="Excluir pedido"
                      >
                        <Trash2 size={18} />
                      </Button>
                    <span className="text-card-foreground">
                      Pedido <strong>#{pedido.numero}</strong>
                    </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/pedidos/${pedido.id}?numero=${pedido.numero}`}
                        className="text-blue-500 hover:text-blue-400"
                      >
                        Conferir
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDesarquivar(pedido.id)}
                        className="text-yellow-500 hover:text-yellow-400"
                        title="Desarquivar"
                      >
                        📤
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(pedido.id)}
                        className="text-red-500 hover:text-red-400"
                        title="Excluir pedido"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">Não há pedidos arquivados</li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* Modal de produtos do pedido */}
      <Dialog open={modalProdutosAberto} onOpenChange={setModalProdutosAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Produtos do Pedido {pedidoSelecionado?.vhsys}</DialogTitle>
            <DialogDescription>
              Lista de produtos do pedido selecionado.
            </DialogDescription>
          </DialogHeader>
          {produtosPedido.length === 0 ? (
            <div className="text-muted-foreground text-center py-4">Nenhum produto encontrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Produto</th>
                  <th className="text-left py-2">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {produtosPedido.map((prod, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-1">{prod.name}</td>
                    <td className="py-1">{prod.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={alertDeleteOpen} onOpenChange={setAlertDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoPedido}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindoPedido}
              onClick={async () => {
                if (!pedidoParaExcluir) return;
                setExcluindoPedido(true);
                try {
                  await deletePedido(pedidoParaExcluir);
                  await carregarPedidos();
                  toast.success("Pedido excluído com sucesso!");
                } catch (error) {
                  toast.error("Erro ao excluir pedido. Por favor, tente novamente.");
                } finally {
                  setExcluindoPedido(false);
                  setAlertDeleteOpen(false);
                  setPedidoParaExcluir(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Preview do CSV */}
      <Dialog open={previewCsvOpen} onOpenChange={setPreviewCsvOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview do CSV - Pedido {previewData?.numeroPedido || '---'}</DialogTitle>
            <DialogDescription>
              Edite o CSV abaixo se necessário. O número do pedido e os produtos serão atualizados automaticamente.
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Número do Pedido:</h3>
                <p className="text-muted-foreground">{previewData.numeroPedido || '---'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Produtos:</h3>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Produto</th>
                        <th className="text-right py-2">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.produtos.map((prod, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-1">{prod.nome}</td>
                          <td className="py-1 text-right">{prod.quantidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">CSV Original (editável):</h3>
                <textarea
                  className="w-full bg-muted p-4 rounded-md text-xs overflow-x-auto min-h-[180px] font-mono"
                  value={previewData.csvText}
                  onChange={e => {
                    const novoCsv = e.target.value;
                    const { numeroPedido, produtos } = extrairDadosCsv(novoCsv);
                    setPreviewData({ ...previewData, csvText: novoCsv, numeroPedido, produtos });
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewCsvOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={async () => {
                  if (!previewData) return;
                  try {
                    setCsvLoading(true);
                    const supabase = getSupabaseClient();
                    const { error } = await supabase
                      .from("documents")
                      .insert([
                        { content: previewData.csvText }
                      ]);
                    if (error) throw error;
                    toast.success("CSV salvo com sucesso!");
                    setPreviewCsvOpen(false);
                    carregarPedidos();
                  } catch (err) {
                    toast.error("Erro ao salvar CSV no Supabase");
                  } finally {
                    setCsvLoading(false);
                  }
                }} disabled={csvLoading}>
                  {csvLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
