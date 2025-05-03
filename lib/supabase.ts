import { createClient, SupabaseClient } from "@supabase/supabase-js"

const isBrowser = typeof window !== "undefined"

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

// Mapeamento de credenciais das lojas
const storeCredentials: Record<string, StoreCredentials> = {
  toledo01: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_TOLEDO01 || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_KEY_TOLEDO01 || "",
  },
  toledo02: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_TOLEDO02 || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_KEY_TOLEDO02 || "",
  },
  videira: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_VIDEIRA || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_KEY_VIDEIRA || "",
  },
  fraiburgo: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_FRAIBURGO || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_KEY_FRAIBURGO || "",
  },
  campomourao: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_CAMPOMOURAO || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_KEY_CAMPOMOURAO || "",
  },
}

// Função para validar credenciais
function validateCredentials(credentials: StoreCredentials): boolean {
  return Boolean(
    credentials &&
    credentials.url &&
    credentials.url.startsWith('https://') &&
    credentials.key &&
    credentials.key.length > 20
  )
}

// Função para obter as credenciais da loja
function getStoreCredentials(store: string): StoreCredentials {
  if (!store) {
    console.error("⚠️ Nome da loja não fornecido")
    throw new Error("Nome da loja não fornecido")
  }

  console.log(`🔍 Obtendo credenciais para a loja: ${store}`)
  const credentials = storeCredentials[store]
  
  if (!credentials) {
    console.error(`⚠️ Loja "${store}" não encontrada no mapeamento de credenciais`)
    throw new Error(`Loja "${store}" não encontrada`)
  }

  if (!validateCredentials(credentials)) {
    console.error(`
⚠️ Credenciais inválidas para a loja: ${store}
URL: ${credentials.url ? "Presente" : "Ausente"}
Key: ${credentials.key ? "Presente" : "Ausente"}

Verifique se as variáveis de ambiente estão configuradas corretamente:
NEXT_PUBLIC_SUPABASE_URL_${store.toUpperCase()}
NEXT_PUBLIC_SUPABASE_KEY_${store.toUpperCase()}

Certifique-se de que:
1. O arquivo .env.local existe na raiz do projeto
2. As variáveis estão definidas corretamente
3. O servidor foi reiniciado após as alterações
    `)
    throw new Error(`Credenciais inválidas para a loja ${store}`)
  }

  return credentials
}

// Função para obter as credenciais atuais
function getCurrentCredentials(): StoreCredentials {
  if (!isBrowser) {
    return getStoreCredentials('toledo01') // Padrão para ambiente servidor
  }

  const selectedStore = localStorage.getItem("selectedStore")
  if (!selectedStore) {
    return getStoreCredentials('toledo01') // Padrão quando nenhuma loja selecionada
  }

  return getStoreCredentials(selectedStore)
}

// Singleton instance for the current store's client
let currentClient: SupabaseClient | null = null
let currentStore: string | null = null
let currentSession: any = null

// Função para criar um novo cliente Supabase
export function createSupabaseClient(store?: string): SupabaseClient {
  try {
    // Se já temos um cliente e não estamos mudando de loja, retorna o existente
    if (currentClient && (!store || store === currentStore)) {
      return currentClient
    }

    // Para renderização no servidor
    if (!isBrowser) {
      const defaultCredentials = storeCredentials['toledo01']
      currentClient = createClient(defaultCredentials.url, defaultCredentials.key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: undefined,
        },
      })
      return currentClient
    }

    // Para o navegador
    const targetStore = store || localStorage.getItem("selectedStore") || 'toledo01'
    const credentials = getStoreCredentials(targetStore)
    console.log(`🔄 Criando cliente Supabase para a loja: ${targetStore}`)

    // Limpa o cliente anterior se estiver mudando de loja
    if (currentClient && targetStore !== currentStore) {
      try {
        currentClient.auth.signOut()
      } catch (e) {
        console.warn('Erro ao fazer signOut do cliente anterior:', e)
      }
      currentClient = null
      currentSession = null
    }

    // Se não temos um cliente, cria um novo
    if (!currentClient) {
      currentClient = createClient(credentials.url, credentials.key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: localStorage,
          storageKey: `sb-${targetStore}-auth-token`,
        },
      })

      // Configura listener para mudanças na sessão
      currentClient.auth.onAuthStateChange((event, session) => {
        currentSession = session
        if (event === 'SIGNED_OUT') {
          console.log('🔒 Usuário deslogado')
          currentSession = null
        } else if (event === 'SIGNED_IN') {
          console.log('🔓 Usuário logado')
        }
      })
    }

    currentStore = targetStore
    if (store && isBrowser) {
      localStorage.setItem("selectedStore", store)
      console.log(`✅ Loja ${store} salva no localStorage`)
    }

    return currentClient
  } catch (error) {
    console.error('❌ Erro ao criar cliente Supabase:', error)
    throw error
  }
}

// Função para garantir autenticação
export async function ensureAuthenticated(): Promise<boolean> {
  if (!isBrowser) return false;

  try {
    const supabase = getSupabaseClient()
    
    // Primeiro verifica se temos uma sessão em memória
    if (currentSession) {
      const now = new Date()
      const expiresAt = new Date(currentSession.expires_at * 1000)
      
      // Se a sessão ainda é válida e não está próxima de expirar
      if (expiresAt > now && (expiresAt.getTime() - now.getTime()) > 5 * 60 * 1000) {
        return true
      }
    }

    // Tenta obter a sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Erro ao verificar sessão:', sessionError)
      return await tryLogin()
    }

    // Se temos uma sessão, verifica se está expirada
    if (session?.access_token && session?.expires_at) {
      currentSession = session
      const expiresAt = new Date(session.expires_at * 1000)
      const now = new Date()
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()
      
      // Se a sessão está próxima de expirar (menos de 5 minutos) ou já expirada
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
        await currentClient?.auth.setSession(newSession)
        return true
      }

      return true
    }

    // Se não tem sessão, tenta fazer login
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
    
    // Tenta fazer login
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

    // Atualiza a sessão no cliente atual
    await currentClient?.auth.setSession(data.session)
    return true
  } catch (error) {
    console.error('Erro ao tentar login:', error)
    return false
  }
}

// Função para atualizar as credenciais do Supabase
export function updateSupabaseCredentials(store: string): SupabaseClient {
  if (!store) {
    throw new Error('Nome da loja não fornecido')
  }

  console.log(`🔄 Atualizando credenciais para a loja: ${store}`)
  
  // Reseta o cliente atual
  currentClient = null
  currentStore = null
  
  // Cria um novo cliente com as credenciais da loja
  return createSupabaseClient(store)
}

// Função para obter o cliente Supabase atual
export function getSupabaseClient(): SupabaseClient {
  if (!currentClient) {
    return createSupabaseClient()
  }
  return currentClient
}

// Exporta o cliente padrão
export const supabase = getSupabaseClient()

export default supabase

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

export async function getPedidos() {
  const selectedStore = isBrowser ? localStorage.getItem("selectedStore") : null
  if (!selectedStore) {
    throw new Error("Nenhuma loja selecionada")
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
  }))

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
  }))

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
  }))

  // Cria conjuntos para busca rápida
  const pedidosConferidos = new Map()
  const pedidosPendentes = new Map()
  const pedidosTotalItens = new Map()

  // Calcula o total de itens para cada pedido
  documents?.forEach((doc: Document) => {
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

  // Agrupa os itens conferidos por pedido e calcula pendências
  conferidos?.forEach((c: ConferidoRecord) => {
    const pedidoId = c.pedido_id
    if (pedidosConferidos.has(pedidoId)) {
      const atual = pedidosConferidos.get(pedidoId)
      pedidosConferidos.set(pedidoId, {
        quantidade_recebida: atual.quantidade_recebida + c.quantidade_recebida,
        total_conferida: c.total_conferida || atual.quantidade_recebida + c.quantidade_recebida,
      })
    } else {
      pedidosConferidos.set(pedidoId, {
        quantidade_recebida: c.quantidade_recebida,
        total_conferida: c.total_conferida || c.quantidade_recebida,
      })
    }

    // Calcula pendências baseado na diferença entre total de itens e itens conferidos
    const totalItens = pedidosTotalItens.get(pedidoId) || 0
    const totalConferido = pedidosConferidos.get(pedidoId).total_conferida
    if (totalItens > totalConferido) {
      pedidosPendentes.set(pedidoId, {
        quantidade_faltante: totalItens - totalConferido
      })
    }
  })

  // Adiciona pendências da tabela de pendências
  pendencias?.forEach((p: PendenciaRecord) => {
    const quantidadeFaltante = p.quantidade_pedida - p.quantidade_recebida
    const pedidoId = Number(p.pedido_id)

    if (quantidadeFaltante > 0) {
      if (pedidosPendentes.has(pedidoId)) {
        const atual = pedidosPendentes.get(pedidoId)
        pedidosPendentes.set(pedidoId, {
          quantidade_faltante: atual.quantidade_faltante + quantidadeFaltante
        })
      } else {
        pedidosPendentes.set(pedidoId, {
          quantidade_faltante: quantidadeFaltante
        })
      }
    }
  })

  const pedidosArquivados = getPedidosArquivados()
  const pedidosArquivadosSet = new Set(pedidosArquivados.map((p) => p.id))

  // Classifica os pedidos
  const aConferir: Pedido[] = []
  const conferidosList: Pedido[] = []
  const pendentesList: Pedido[] = []
  const arquivadosList: Pedido[] = []

  documents?.forEach((p: Document) => {
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
      // Verifica se tem itens conferidos
      if (pedidosConferidos.has(p.id)) {
        const totalItens = pedidosTotalItens.get(p.id) || 0
        const totalConferido = pedidosConferidos.get(p.id).total_conferida
        
        conferidosList.push({
          ...pedido,
          quantidade_recebida: pedidosConferidos.get(p.id).quantidade_recebida,
          total_conferida: totalConferido,
          total_itens: totalItens,
        })

        // Se tem itens faltantes, adiciona à lista de pendentes
        if (totalItens > totalConferido) {
          pendentesList.push({
            ...pedido,
            quantidade_faltante: totalItens - totalConferido,
          })
        }
      } else if (pedidosPendentes.has(p.id)) {
        // Se não está conferido mas tem pendências
        pendentesList.push({
          ...pedido,
          quantidade_faltante: pedidosPendentes.get(p.id).quantidade_faltante,
        })
      } else {
        // Se não tem nem conferidos nem pendências
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
  if (!selectedStore) {
    throw new Error("Nenhuma loja selecionada")
  }

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
  if (!selectedStore) {
    throw new Error("Nenhuma loja selecionada")
  }

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
  if (!selectedStore) {
    throw new Error("Nenhuma loja selecionada")
  }

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
  if (!selectedStore) {
    throw new Error("Nenhuma loja selecionada")
  }

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
  if (!selectedStore) {
    throw new Error("Nenhuma loja selecionada")
  }

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
      // Atualizar registro existente
      result = await supabase
        .from("conferidos")
        .update(dados)
        .eq("id", existingData[0].id)
    } else {
      // Inserir novo registro
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
  if (!selectedStore) {
    throw new Error("Nenhuma loja selecionada")
  }

  try {
    if (!dados.produtos || dados.produtos.length === 0) {
      return { data: null, error: null }
    }

    const supabase = getSupabaseClient()

    // Primeiro, deletar pendências existentes
    await deletarPendencias(dados.pedidoId)

    // Formatar os dados para o formato esperado pela tabela
    const pendencias = dados.produtos.map(p => ({
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

    // Inserir as novas pendências
    const { data, error } = await supabase
      .from("pendencias")
      .insert(pendencias)

    if (error) {
      console.error(`❌ Erro ao salvar pendências na loja ${selectedStore}:`, error)
      throw error
    }

    return { data: pendencias, error: null }
  } catch (error) {
    console.error(`❌ Erro detalhado ao salvar pendências:`, error)
    throw error
  }
}

export async function deletarPendencias(pedidoId: string | number) {
  const selectedStore = isBrowser ? localStorage.getItem("selectedStore") : null
  if (!selectedStore) {
    throw new Error("Nenhuma loja selecionada")
  }

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

// Função para testar as credenciais de todas as lojas
export function testStoreCredentials() {
  const stores = ['toledo01', 'toledo02', 'videira', 'fraiburgo', 'campomourao']
  
  console.log('\n🔍 Testando credenciais de todas as lojas:')
  console.log('----------------------------------------')
  
  stores.forEach(store => {
    try {
      const credentials = storeCredentials[store]
      console.log(`\n📌 Loja: ${store}`)
      console.log(`URL: ${credentials.url ? credentials.url.substring(0, 30) + '...' : 'não definida'}`)
      console.log(`Key presente: ${Boolean(credentials.key)}`)
      console.log(`URL válida: ${credentials.url.startsWith('https://')}`)
      console.log(`Key válida: ${credentials.key.length > 20}`)
      console.log(`Variáveis usadas:`)
      console.log(`- NEXT_PUBLIC_SUPABASE_URL_${store.toUpperCase()}`)
      console.log(`- NEXT_PUBLIC_SUPABASE_KEY_${store.toUpperCase()}`)
    } catch (error) {
      console.error(`❌ Erro ao testar credenciais da loja ${store}:`, error)
    }
  })
  
  console.log('\n----------------------------------------')
}

// Executa o teste se estiver em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Ambiente de desenvolvimento detectado')
  testStoreCredentials()
}

export async function getSorvetes() {
  const { data, error } = await supabase
    .from('sorvetes')
    .select('*')
    .order('item')

  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getAcai() {
  const { data, error } = await supabase
    .from('acai')
    .select('*')
    .order('item')

  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getAcompanhamentos() {
  const { data, error } = await supabase
    .from('acompanhamentos')
    .select('*')
    .order('item')

  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getCongelados() {
  const { data, error } = await supabase
    .from('congelados')
    .select('*')
    .order('item')

  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getUtensilhos() {
  const { data, error } = await supabase
    .from('utensilhos')
    .select('*')
    .order('item')

  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getColecionaveis() {
  const { data, error } = await supabase
    .from('colecionaveis')
    .select('*')
    .order('item')

  if (error) throw error
  return data as ProdutoEstoque[]
}

export async function getPotes() {
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
    // Atualiza todas as tabelas em paralelo
    await Promise.all(
      tabelas.map(tabela => 
        supabase
          .from(tabela)
          .update({ estoque: 0 })
          .neq('id', 0) // Garante que atualize todos os registros
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
        valor_total: '0',
        estoque: dados.estoque || 0,
        disponivel_para_pedido: dados.disponivel_para_pedido ?? true,
        qtd: 0
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