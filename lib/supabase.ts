import { createClient, SupabaseClient } from "@supabase/supabase-js"
import lojasConfigData from '../lojas.config.json';

const isBrowser = typeof window !== "undefined"

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

// ✅ SOLUÇÃO: Mapeamento estático das variáveis de ambiente
const ENV_VARS_MAP = {
  'NEXT_PUBLIC_SUPABASE_URL_TOLEDO01': process.env.NEXT_PUBLIC_SUPABASE_URL_TOLEDO01,
  'NEXT_PUBLIC_SUPABASE_KEY_TOLEDO01': process.env.NEXT_PUBLIC_SUPABASE_KEY_TOLEDO01,
  'NEXT_PUBLIC_SUPABASE_URL_TOLEDO02': process.env.NEXT_PUBLIC_SUPABASE_URL_TOLEDO02,
  'NEXT_PUBLIC_SUPABASE_KEY_TOLEDO02': process.env.NEXT_PUBLIC_SUPABASE_KEY_TOLEDO02,
  'NEXT_PUBLIC_SUPABASE_URL_VIDEIRA': process.env.NEXT_PUBLIC_SUPABASE_URL_VIDEIRA,
  'NEXT_PUBLIC_SUPABASE_KEY_VIDEIRA': process.env.NEXT_PUBLIC_SUPABASE_KEY_VIDEIRA,
  'NEXT_PUBLIC_SUPABASE_URL_FRAIBURGO': process.env.NEXT_PUBLIC_SUPABASE_URL_FRAIBURGO,
  'NEXT_PUBLIC_SUPABASE_KEY_FRAIBURGO': process.env.NEXT_PUBLIC_SUPABASE_KEY_FRAIBURGO,
  'NEXT_PUBLIC_SUPABASE_URL_CAMPOMOURAO': process.env.NEXT_PUBLIC_SUPABASE_URL_CAMPOMOURAO,
  'NEXT_PUBLIC_SUPABASE_KEY_CAMPOMOURAO': process.env.NEXT_PUBLIC_SUPABASE_KEY_CAMPOMOURAO,
} as const;

if (!lojasConfig || typeof lojasConfig !== 'object' || !Array.isArray(lojasConfig)) {
  console.error("[Supabase Init] ERRO CRÍTICO: lojasConfig não foi carregado corretamente, não é um array ou está malformado. Verifique a importação e o conteúdo de lojas.config.json.");
} else if (lojasConfig.length === 0) {
   console.warn("[Supabase Init] AVISO: lojasConfig foi carregado como um array vazio. O sistema pode não funcionar como esperado se nenhuma loja estiver configurada.");
}

interface StoreCredentials {
  url: string
  key: string
}

// Interfaces para os tipos de dados do Supabase
interface Document {
  id: number
  content: string
}

interface ConferidoRecord {
  pedido_id: number
  quantidade_recebida: number
  total_conferida: number
}

interface PendenciaRecord {
  pedido_id: string
  quantidade_pedida: number
  quantidade_recebida: number
  total_pendentes?: number
}

// Função para validar credenciais
function validateCredentials(credentials: StoreCredentials, storeIdInterno: string, urlVarName?: string, keyVarName?: string): boolean {
  const isValid = Boolean(
    credentials &&
    credentials.url &&
    credentials.url.startsWith('https://') &&
    credentials.key &&
    credentials.key.length > 20
  );

  if (!isValid) {
    console.error(
`
⚠️ Credenciais inválidas para a loja: ${storeIdInterno}
URL: ${credentials.url ? `Presente (${credentials.url.substring(0,30)}...)` : "Ausente"} (esperado de ${urlVarName || 'N/A'})
Key: ${credentials.key ? `Presente (${credentials.key.substring(0,5)}...)` : "Ausente"} (esperado de ${keyVarName || 'N/A'})

Verifique se:
1. O arquivo .env.local (ou equivalente) existe e contém as variáveis de ambiente ${urlVarName} e ${keyVarName}.
2. As variáveis estão definidas corretamente com URL e Key válidas do Supabase.
3. O servidor foi reiniciado após quaisquer alterações nas variáveis de ambiente.
4. O arquivo 'lojas.config.json' está correto e os nomes das variáveis de ambiente correspondem.

DEBUG: URL value = "${credentials.url}"
DEBUG: Key value = "${credentials.key ? credentials.key.substring(0,10)+'...' : 'EMPTY'}"
`
    );
  }
  return isValid;
}

// Função para obter as credenciais da loja (CORRIGIDA - usa mapeamento estático)
function getStoreCredentials(storeIdInterno: string): StoreCredentials {
  if (!storeIdInterno) {
    console.error("⚠️ ID interno da loja não fornecido para getStoreCredentials")
    throw new Error("ID interno da loja não fornecido")
  }

  console.log(`🔍 Obtendo credenciais para a loja (ID interno): ${storeIdInterno}`)
  
  if (!lojasConfig || !Array.isArray(lojasConfig) || lojasConfig.length === 0) {
    console.error("CRÍTICO: lojasConfig está vazio, não é um array ou não definido dentro de getStoreCredentials.");
    throw new Error("Configuração de lojas não carregada ou vazia.");
  }

  const lojaConf = lojasConfig.find(lc => lc.idInterno === storeIdInterno);

  if (!lojaConf) {
    console.error(`⚠️ Configuração da loja com ID interno "${storeIdInterno}" não encontrada em lojas.config.json. Lojas disponíveis: ${lojasConfig.map(l => l.idInterno).join(', ') || 'Nenhuma'}`);
    throw new Error(`Configuração da loja "${storeIdInterno}" não encontrada`)
  }

  const urlEnvVarName = lojaConf.supabaseUrlEnvVar;
  const keyEnvVarName = lojaConf.supabaseKeyEnvVar;

  // ✅ USAR MAPEAMENTO ESTÁTICO ao invés de acesso dinâmico
  const url = ENV_VARS_MAP[urlEnvVarName as keyof typeof ENV_VARS_MAP] || "";
  const key = ENV_VARS_MAP[keyEnvVarName as keyof typeof ENV_VARS_MAP] || "";
  
  console.log(`[DEBUG] Obtendo ${urlEnvVarName}: ${url ? 'PRESENTE' : 'AUSENTE'}`);
  console.log(`[DEBUG] Obtendo ${keyEnvVarName}: ${key ? 'PRESENTE' : 'AUSENTE'}`);
  
  const credentials = { url, key };

  if (!validateCredentials(credentials, storeIdInterno, urlEnvVarName, keyEnvVarName)) {
    // A função validateCredentials já loga o erro detalhado.
    throw new Error(`Credenciais inválidas para a loja ${storeIdInterno}. Verifique o console para detalhes e as variáveis de ambiente: ${urlEnvVarName}, ${keyEnvVarName}`)
  }

  return credentials
}

// Função para obter as credenciais atuais (sem grandes mudanças, mas usa o ID interno)
function getCurrentCredentials(): StoreCredentials {
  if (!lojasConfig || !Array.isArray(lojasConfig) || lojasConfig.length === 0) {
    console.error("Nenhuma loja configurada em lojas.config.json para usar como padrão (getCurrentCredentials).");
    throw new Error("Nenhuma loja padrão configurada (lojasConfig vazio).");
  }
  const defaultStoreId = lojasConfig[0].idInterno;
  
  if (!isBrowser) {
    return getStoreCredentials(defaultStoreId) // Padrão para ambiente servidor
  }

  const selectedStoreId = localStorage.getItem("selectedStore")
  if (!selectedStoreId) {
    return getStoreCredentials(defaultStoreId) // Padrão quando nenhuma loja selecionada
  }

  return getStoreCredentials(selectedStoreId)
}

// Singleton instance for the current store's client
let currentClient: SupabaseClient | null = null
let currentStore: string | null = null
let currentSession: any = null

// Função para criar um novo cliente Supabase (ajustada para usar ID interno e default)
export function createSupabaseClient(storeIdInternoParam?: string): SupabaseClient {
  if (!lojasConfig || !Array.isArray(lojasConfig) || lojasConfig.length === 0) {
    console.error("Erro crítico: Nenhuma loja configurada em lojas.config.json (createSupabaseClient).");
    throw new Error("Nenhuma loja configurada para criar cliente Supabase.");
  }
  const defaultStoreIdForCreation = lojasConfig[0].idInterno;
  
  try {
    if (currentClient && (!storeIdInternoParam || storeIdInternoParam === currentStore)) {
      return currentClient
    }

    if (!isBrowser) {
      const serverStoreId = storeIdInternoParam || defaultStoreIdForCreation;
      const serverCredentials = getStoreCredentials(serverStoreId);
      console.log(`🔄 (SSR) Criando cliente Supabase para a loja: ${serverStoreId}`)
      currentClient = createClient(serverCredentials.url, serverCredentials.key, {
        auth: {
          autoRefreshToken: true,
          persistSession: false, 
          detectSessionInUrl: false,
          storage: undefined, 
        },
      })
      currentStore = serverStoreId;
      return currentClient
    }

    const targetStoreId = storeIdInternoParam || localStorage.getItem("selectedStore") || defaultStoreIdForCreation;
    const credentials = getStoreCredentials(targetStoreId)
    console.log(`🔄 (Browser) Criando cliente Supabase para a loja: ${targetStoreId}`)

    if (currentClient && targetStoreId !== currentStore) {
      try {
        currentClient.auth.signOut().catch(e => console.warn('Aviso: Erro ao fazer signOut do cliente Supabase anterior:', e));
      } catch (e) {
        console.warn('Aviso: Exceção ao fazer signOut do cliente Supabase anterior:', e)
      }
      currentClient = null
      currentSession = null 
    }

    if (!currentClient) {
      currentClient = createClient(credentials.url, credentials.key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true, 
          storage: localStorage, 
          storageKey: `sb-${targetStoreId}-auth-token`, 
        },
      })

      currentClient.auth.onAuthStateChange((event, session) => {
        console.log(`Supabase Auth Event (${targetStoreId}):`, event, session);
        currentSession = session
        if (event === 'SIGNED_OUT') {
          console.log(`🔒 Usuário deslogado (${targetStoreId})`)
        } else if (event === 'INITIAL_SESSION') {
          console.log(`🔑 Sessão inicial carregada (${targetStoreId})`)
        } else if (event === 'SIGNED_IN') {
          console.log(`🔓 Usuário logado (${targetStoreId})`)
        } else if (event === 'TOKEN_REFRESHED') {
          console.log(`🔄 Token atualizado (${targetStoreId})`)
        } else if (event === 'USER_UPDATED') {
          console.log(`👤 Usuário atualizado (${targetStoreId})`)
        }
      })
    }

    currentStore = targetStoreId
    if (storeIdInternoParam && isBrowser) {
      localStorage.setItem("selectedStore", storeIdInternoParam)
      console.log(`✅ Loja ${storeIdInternoParam} explicitamente definida e salva no localStorage`)
    }

    return currentClient
  } catch (error) {
    console.error('❌ Erro crítico ao criar cliente Supabase:', error)
    throw error
  }
}

// Função para garantir autenticação
export async function ensureAuthenticated(): Promise<boolean> {
  if (!isBrowser) return false;

  try {
    const supabase = getSupabaseClient()
    
    if (currentSession) {
      const now = new Date()
      // @ts-ignore
      const expiresAt = new Date(currentSession.expires_at * 1000)
      
      if (expiresAt > now && (expiresAt.getTime() - now.getTime()) > 5 * 60 * 1000) {
        return true
      }
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Erro ao verificar sessão:', sessionError)
      return await tryLogin()
    }

    if (session?.access_token && session?.expires_at) {
      currentSession = session
      const expiresAt = new Date(session.expires_at * 1000)
      const now = new Date()
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()
      
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log('Sessão próxima de expirar, tentando renovar...')
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('Erro ao renovar sessão:', refreshError)
          return await tryLogin()
        }

        if (!newSession) {
          console.log('Não foi possível renovar a sessão')
          return await tryLogin()
        }

        currentSession = newSession
        // @ts-ignore
        await currentClient?.auth.setSession(newSession)
        return true
      }
      return true
    }
    return await tryLogin()
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return await tryLogin()
  }
}

// Função auxiliar para tentar fazer login
async function tryLogin(): Promise<boolean> {
  try {
    const email = localStorage.getItem('userEmail')
    const password = localStorage.getItem('userPassword')

    if (!email || !password) {
      console.error('Credenciais não encontradas para login automático')
      return false
    }

    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Erro ao fazer login automático:', error)
      return false
    }

    if (!data.session) {
      console.error('Nenhuma sessão retornada após login')
      return false
    }
    // @ts-ignore
    await currentClient?.auth.setSession(data.session)
    return true
  } catch (error) {
    console.error('Erro ao tentar login:', error)
    return false
  }
}

// Função para atualizar as credenciais do Supabase
export function updateSupabaseCredentials(storeIdInterno: string): SupabaseClient {
  if (!storeIdInterno) {
    throw new Error('ID interno da loja não fornecido')
  }
  console.log(`🔄 Atualizando credenciais para a loja: ${storeIdInterno}`)
  currentClient = null
  currentStore = null
  return createSupabaseClient(storeIdInterno)
}

// Função para obter o cliente Supabase atual
export function getSupabaseClient(): SupabaseClient {
  if (!currentClient) {
    return createSupabaseClient()
  }
  return currentClient
}

// ✅ NOVA função para obter cliente apenas quando necessário
export function getSupabaseClientSafe(): SupabaseClient | null {
  try {
    return getSupabaseClient()
  } catch (error) {
    console.warn('Não foi possível criar cliente Supabase:', error)
    return null
  }
}

// TIPOS
export type Pedido = {
  id: number
  numero: string
  quantidade_recebida?: number
  total_conferida?: number
  total_itens?: number
  quantidade_faltante?: number
  dataArquivamento?: string
}

export type Produto = {
  produto: string
  quantidade_pedida: number
  quantidade_recebida: number
  motivo_devolucao?: string | null
}

export type Pendencia = {
  id: number
  pedido_id: string 
  numero_pedido: string
  produto: string
  quantidade_pedida: number
  quantidade_recebida: number
  quantidade_faltante: number
  motivo_devolucao: string
  responsavel: string
  data: string
  total_pendentes?: number 
}

export type Conferido = {
  id: number
  pedido_id: number
  quantidade_recebida: number
  total_conferida: number
  produtos: string
  responsavel: string
  data: string
}

export type ProdutoEstoque = {
  id: number
  item: string
  situacao: string
  sugestao: string
  peso: string
  valor_total: string
  valor_produto: string
  valor_servico: string
  estoque: number
  disponivel_para_pedido: boolean
  qtd: number
}

// FUNÇÕES DE DADOS (PEDIDOS, ETC.)
export async function getPedidos() {
  const selectedStore = isBrowser ? localStorage.getItem("selectedStore") : null
  if (!selectedStore) {
    throw new Error("Nenhuma loja selecionada para getPedidos")
  }
  console.log(`📦 Buscando pedidos da loja: ${selectedStore}`)
  const supabase = getSupabaseClient()

  const { data: documentsRaw, error: documentsError } = await supabase
    .from("documents")
    .select("id, content")

  if (documentsError) {
    console.error(`❌ Erro ao buscar documentos da loja ${selectedStore}:`, documentsError)
    throw documentsError
  }

  const documents = (documentsRaw as any[])?.map(doc => ({
    id: Number(doc.id),
    content: String(doc.content)
  })) || []

  const { data: conferidosRaw, error: conferidosError } = await supabase
    .from("conferidos")
    .select("pedido_id, quantidade_recebida, total_conferida")

  if (conferidosError) {
    console.error(`❌ Erro ao buscar conferidos da loja ${selectedStore}:`, conferidosError)
    throw conferidosError
  }

  const conferidos = (conferidosRaw as any[])?.map(c => ({
    pedido_id: Number(c.pedido_id),
    quantidade_recebida: Number(c.quantidade_recebida),
    total_conferida: Number(c.total_conferida)
  })) || []
  
  const { data: pendenciasRaw, error: pendenciasError } = await supabase
    .from("pendencias")
    .select("pedido_id, quantidade_pedida, quantidade_recebida, total_pendentes")

  if (pendenciasError) {
    console.error(`❌ Erro ao buscar pendências da loja ${selectedStore}:`, pendenciasError)
    throw pendenciasError
  }

  const pendencias = (pendenciasRaw as any[])?.map(p => ({
    pedido_id: String(p.pedido_id),
    quantidade_pedida: Number(p.quantidade_pedida),
    quantidade_recebida: Number(p.quantidade_recebida),
    total_pendentes: p.total_pendentes ? Number(p.total_pendentes) : undefined
  })) || []

  const pedidosConferidos = new Map()
  const pedidosPendentes = new Map()
  const pedidosTotalItens = new Map()

  documents.forEach((doc: Document) => {
    const linhas = doc.content.split("\n")
    let totalItens = 0
    linhas.forEach((linha: string) => {
      const ignorar = /total|peso|valor|Num\. Pedido|OBSERVACAO|PRODUTO/i
      if (!ignorar.test(linha)) {
        const col = linha.split(",").map((x: string) => x.replaceAll('"', "").trim())
        const produto = col[0]
        const quantidade = Number.parseInt(col[1])
        if (produto && !isNaN(quantidade)) {
          totalItens += quantidade
        }
      }
    })
    pedidosTotalItens.set(doc.id, totalItens)
  })

  conferidos.forEach((c: ConferidoRecord) => {
    const pedidoId = c.pedido_id
    const current = pedidosConferidos.get(pedidoId) || { quantidade_recebida: 0, total_conferida: 0 }
    pedidosConferidos.set(pedidoId, {
      quantidade_recebida: current.quantidade_recebida + c.quantidade_recebida,
      total_conferida: c.total_conferida || (current.quantidade_recebida + c.quantidade_recebida),
    })
    const totalItens = pedidosTotalItens.get(pedidoId) || 0
    const totalConferidoCalculado = pedidosConferidos.get(pedidoId).total_conferida
    if (totalItens > totalConferidoCalculado) {
      pedidosPendentes.set(pedidoId, {
        quantidade_faltante: totalItens - totalConferidoCalculado
      })
    }
  })

  pendencias.forEach((p: PendenciaRecord) => {
    const quantidadeFaltante = p.quantidade_pedida - p.quantidade_recebida
    const pedidoIdNum = Number(p.pedido_id)
    if (quantidadeFaltante > 0) {
      const currentPendente = pedidosPendentes.get(pedidoIdNum) || { quantidade_faltante: 0 }
      pedidosPendentes.set(pedidoIdNum, {
        quantidade_faltante: currentPendente.quantidade_faltante + quantidadeFaltante
      })
    }
  })

  const pedidosArquivados = getPedidosArquivados()
  const pedidosArquivadosSet = new Set(pedidosArquivados.map((p) => p.id))

  const aConferir: Pedido[] = []
  const conferidosList: Pedido[] = []
  const pendentesList: Pedido[] = []
  const arquivadosList: Pedido[] = []

  documents.forEach((p: Document) => {
    const linha = p.content.split("\n")[0]
    const pedidoNum = linha.split(",")[1]?.replaceAll('"', "").trim() || "Desconhecido"
    const pedido: Pedido = { id: p.id, numero: pedidoNum }

    if (pedidosArquivadosSet.has(p.id)) {
      const arquivado = pedidosArquivados.find((a) => a.id === p.id)
      if (arquivado) {
        arquivadosList.push({
          ...pedido,
          dataArquivamento: arquivado.dataArquivamento,
        })
      }
    } else {
      if (pedidosConferidos.has(p.id)) {
        const totalItens = pedidosTotalItens.get(p.id) || 0
        const conferidoData = pedidosConferidos.get(p.id)
        conferidosList.push({
          ...pedido,
          quantidade_recebida: conferidoData.quantidade_recebida,
          total_conferida: conferidoData.total_conferida,
          total_itens: totalItens,
        })
        if (totalItens > conferidoData.total_conferida) {
          pendentesList.push({
            ...pedido,
            quantidade_faltante: totalItens - conferidoData.total_conferida,
          })
        }
      } else if (pedidosPendentes.has(p.id)) {
        pendentesList.push({
          ...pedido,
          quantidade_faltante: pedidosPendentes.get(p.id).quantidade_faltante,
        })
      } else {
        aConferir.push(pedido)
      }
    }
  })

  return {
    aConferir,
    conferidos: conferidosList,
    pendentes: pendentesList,
    arquivados: arquivadosList,
  }
}

export function getPedidosArquivados(): Pedido[] {
  if (typeof window === "undefined") return []
  const arquivados = localStorage.getItem("pedidosArquivados")
  return arquivados ? JSON.parse(arquivados) : []
}

export function arquivarPedido(pedidoId: number, numeroPedido: string) {
  const arquivados = getPedidosArquivados()
  if (!arquivados.find((p) => p.id === pedidoId)) {
    arquivados.push({
      id: pedidoId,
      numero: numeroPedido,
      dataArquivamento: new Date().toISOString(),
    })
    localStorage.setItem("pedidosArquivados", JSON.stringify(arquivados))
    return true
  }
  return false
}

export function desarquivarPedido(pedidoId: number) {
  const arquivados = getPedidosArquivados()
  const index = arquivados.findIndex((p) => p.id === pedidoId)
  if (index > -1) {
    arquivados.splice(index, 1)
    localStorage.setItem("pedidosArquivados", JSON.stringify(arquivados))
    return true
  }
  return false
}

export async function getPedidoById(pedidoId: string | number) {
  const selectedStore = isBrowser ? localStorage.getItem("selectedStore") : null
  if (!selectedStore) throw new Error("Nenhuma loja selecionada para getPedidoById")
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("documents")
      .select("content")
      .eq("id", pedidoId)
      .single()
    if (error) {
      console.error(`❌ Erro ao buscar pedido ${pedidoId} da loja ${selectedStore}:`, error)
      throw error
    }
    return data
  } catch (error) {
    console.error(`❌ Erro detalhado ao buscar pedido ${pedidoId}:`, error)
    throw error
  }
}

export async function getConferenciaById(pedidoId: string | number) {
  const selectedStore = isBrowser ? localStorage.getItem("selectedStore") : null
  if (!selectedStore) throw new Error("Nenhuma loja selecionada para getConferenciaById")
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("conferidos")
      .select("*")
      .eq("pedido_id", pedidoId)
      .order("data", { ascending: false })
      .limit(1)
    if (error) {
      console.error(`❌ Erro ao buscar conferência do pedido ${pedidoId} da loja ${selectedStore}:`, error)
      throw error
    }
    return data?.[0]
  } catch (error) {
    console.error(`❌ Erro detalhado ao buscar conferência do pedido ${pedidoId}:`, error)
    throw error
  }
}

export async function getPendenciasByPedidoId(pedidoId: string | number) {
  const selectedStore = isBrowser ? localStorage.getItem("selectedStore") : null
  if (!selectedStore) throw new Error("Nenhuma loja selecionada para getPendenciasByPedidoId")
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("pendencias")
      .select("*")
      .eq("pedido_id", String(pedidoId))
    if (error) {
      console.error(`❌ Erro ao buscar pendências do pedido ${pedidoId} da loja ${selectedStore}:`, error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error(`❌ Erro detalhado ao buscar pendências do pedido ${pedidoId}:`, error)
    throw error
  }
}

export async function getAllPendencias() {
  const selectedStore = isBrowser ? localStorage.getItem("selectedStore") : null
  if (!selectedStore) throw new Error("Nenhuma loja selecionada para getAllPendencias")
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("pendencias")
      .select("*")
    if (error) {
      console.error(`❌ Erro ao buscar todas as pendências da loja ${selectedStore}:`, error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error(`❌ Erro detalhado ao buscar todas as pendências:`, error)
    throw error
  }
}

export async function salvarConferencia(dados: {
  pedido_id: number
  quantidade_recebida: number
  total_conferida: number
  produtos: string
  responsavel: string
  data: string
}) {
  const selectedStore = isBrowser ? localStorage.getItem("selectedStore") : null
  if (!selectedStore) throw new Error("Nenhuma loja selecionada para salvarConferencia")
  try {
    const supabase = getSupabaseClient()
    const { data: existingData, error: checkError } = await supabase
      .from("conferidos")
      .select("id")
      .eq("pedido_id", dados.pedido_id)
      .order("data", { ascending: false })
      .limit(1)
    if (checkError) throw checkError
    let result
    if (existingData && existingData.length > 0) {
      result = await supabase
        .from("conferidos")
        .update(dados)
        .eq("id", existingData[0].id)
    } else {
      result = await supabase
        .from("conferidos")
        .insert([dados])
    }
    if (result.error) throw result.error
    return result
  } catch (error) {
    console.error(`❌ Erro ao salvar conferência na loja ${selectedStore}:`, error)
    throw error
  }
}

export async function salvarPendencias(dados: {
  pedidoId: string,
  numeroPedido: string,
  produtos: Array<{
    produto: string,
    quantidade_pedida: number,
    quantidade_recebida: number,
    quantidade_faltante: number,
    motivo_devolucao?: string
  }>,
  responsavel: string
}) {
  const selectedStore = isBrowser ? localStorage.getItem("selectedStore") : null
  if (!selectedStore) throw new Error("Nenhuma loja selecionada para salvarPendencias")
  try {
    if (!dados.produtos || dados.produtos.length === 0) {
      return { data: null, error: null }
    }
    const supabase = getSupabaseClient()
    await deletarPendencias(dados.pedidoId)
    const pendenciasParaSalvar = dados.produtos.map(p => ({
      pedido_id: dados.pedidoId,
      numero_pedido: dados.numeroPedido,
      produto: p.produto,
      quantidade_pedida: p.quantidade_pedida,
      quantidade_recebida: p.quantidade_recebida,
      quantidade_faltante: p.quantidade_faltante,
      motivo_devolucao: p.motivo_devolucao || '',
      responsavel: dados.responsavel,
      data: new Date().toISOString()
    }))
    const { data, error } = await supabase
      .from("pendencias")
      .insert(pendenciasParaSalvar)
    if (error) {
      console.error(`❌ Erro ao salvar pendências na loja ${selectedStore}:`, error)
      throw error
    }
    return { data, error: null } // Retornar data em vez de pendenciasParaSalvar para obter IDs se gerados
  } catch (error) {
    console.error(`❌ Erro detalhado ao salvar pendências:`, error)
    throw error
  }
}

export async function deletarPendencias(pedidoId: string | number) {
  const selectedStore = isBrowser ? localStorage.getItem("selectedStore") : null
  if (!selectedStore) throw new Error("Nenhuma loja selecionada para deletarPendencias")
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from("pendencias")
      .delete()
      .eq("pedido_id", String(pedidoId))
    if (error) {
      console.error(`❌ Erro ao deletar pendências do pedido ${pedidoId} da loja ${selectedStore}:`, error)
      throw error
    }
    return { error: null }
  } catch (error) {
    console.error(`❌ Erro detalhado ao deletar pendências do pedido ${pedidoId}:`, error)
    throw error
  }
}

// FUNÇÕES DE ESTOQUE
export async function getSorvetes() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sorvetes')
    .select('*')
    .order('item')
  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getAcai() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('acai')
    .select('*')
    .order('item')
  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getAcompanhamentos() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('acompanhamentos')
    .select('*')
    .order('item')
  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getCongelados() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('congelados')
    .select('*')
    .order('item')
  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getUtensilhos() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('utensilhos')
    .select('*')
    .order('item')
  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getColecionaveis() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('colecionaveis')
    .select('*')
    .order('item')
  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getPotes() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('potes')
    .select('*')
    .order('item')
  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getSazonais() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sazonais')
    .select('*')
  if (error) {
    console.error('Erro ao buscar produtos sazonais:', error)
    throw new Error('Erro ao buscar produtos sazonais')
  }
  return data || []
}

export async function getCampanhas() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('campanhas')
    .select('*')
  if (error) {
    console.error('Erro ao buscar produtos de campanhas:', error)
    throw new Error('Erro ao buscar produtos de campanhas')
  }
  return data || []
}

export async function limparEstoque() {
  const supabase = getSupabaseClient()
  const tabelas = [
    'sorvetes', 
    'acai', 
    'acompanhamentos', 
    'congelados', 
    'utensilhos', 
    'colecionaveis', 
    'potes',
    'sazonais',
    'campanhas'
  ]
  try {
    await Promise.all(
      tabelas.map(tabela => 
        supabase
          .from(tabela)
          .update({ estoque: 0 })
          .neq('id', 0) 
      )
    )
  } catch (error) {
    console.error('Erro ao limpar estoque:', error)
    throw error
  }
}

export async function inserirProduto(dados: {
  item: string
  categoria: 'sorvetes' | 'acai' | 'acompanhamentos' | 'congelados' | 'utensilhos' | 'colecionaveis' | 'potes' | 'sazonais' | 'campanhas'
  situacao?: string
  sugestao?: string
  peso?: string
  valor_produto?: string
  valor_servico?: string
  estoque?: number
  disponivel_para_pedido?: boolean
}) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from(dados.categoria)
      .insert([{
        item: dados.item,
        situacao: dados.situacao || 'Normal',
        sugestao: dados.sugestao || '',
        peso: dados.peso || '',
        valor_produto: dados.valor_produto || '0',
        valor_servico: dados.valor_servico || '0',
        valor_total: '0', // Geralmente calculado ou definido em outro lugar
        estoque: dados.estoque || 0,
        disponivel_para_pedido: dados.disponivel_para_pedido ?? true,
        qtd: 0 // Geralmente representa quantidade em um pedido, não estoque inicial
      }])
      .select()
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao inserir produto:', error)
    throw error
  }
}

export async function deletePedido(pedidoId: number) {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", pedidoId)

  if (error) {
    console.error(`❌ Erro ao excluir pedido ${pedidoId}:`, error)
    throw error
  }
}