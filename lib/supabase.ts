import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xgmotjezsdwqwrtwztlj.supabase.co"
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbW90amV6c2R3cXdydHd6dGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3Njg2ODYsImV4cCI6MjA2MDM0NDY4Nn0.GpfDr6v7P8GG06XxvFLML4fDbQBuU7u-F210_x4kInw"

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true
  }
})

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

export async function getPedidos() {
  const { data: documents, error: documentsError } = await supabase.from("documents").select("id, content")

  if (documentsError) throw documentsError

  const { data: conferidos, error: conferidosError } = await supabase
    .from("conferidos")
    .select("pedido_id, quantidade_recebida, total_conferida")

  if (conferidosError) throw conferidosError

  const { data: pendencias, error: pendenciasError } = await supabase
    .from("pendencias")
    .select("pedido_id, quantidade_pedida, quantidade_recebida, total_pendentes")

  if (pendenciasError) throw pendenciasError

  // Cria conjuntos para busca rápida
  const pedidosConferidos = new Map()
  const pedidosPendentes = new Map()
  const pedidosTotalItens = new Map()

  // Calcula o total de itens para cada pedido
  documents?.forEach((doc) => {
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
  conferidos?.forEach((c) => {
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
  pendencias?.forEach((p) => {
    const quantidadeFaltante = p.quantidade_pedida - p.quantidade_recebida
    const pedidoId = p.pedido_id

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

  documents?.forEach((p) => {
    const linha = p.content.split("\n")[0]
    const pedidoNum = linha.split(",")[1]?.replaceAll('"', "").trim() || "Desconhecido"
    const pedido = { id: p.id, numero: pedidoNum }

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
  try {
  const { data, error } = await supabase.from("documents").select("content").eq("id", pedidoId).single()

    if (error) {
      console.error(`❌ Erro ao buscar pedido ${pedidoId}:`, error)
      throw error
    }
  return data
  } catch (error) {
    console.error(`❌ Erro detalhado ao buscar pedido ${pedidoId}:`, error)
    throw error
  }
}

export async function getConferenciaById(pedidoId: string | number) {
  try {
  const { data, error } = await supabase
    .from("conferidos")
    .select("*")
    .eq("pedido_id", pedidoId)
    .order("data", { ascending: false })
    .limit(1)

    if (error) {
      console.error(`❌ Erro ao buscar conferência do pedido ${pedidoId}:`, error)
      throw error
    }
  return data?.[0]
  } catch (error) {
    console.error(`❌ Erro detalhado ao buscar conferência do pedido ${pedidoId}:`, error)
    throw error
  }
}

export async function getPendenciasByPedidoId(pedidoId: string | number) {
  try {
    const { data, error } = await supabase
      .from('pendencias')
      .select('*')
      .eq('pedido_id', String(pedidoId))

    if (error) {
      console.error(`❌ Erro ao buscar pendências do pedido ${pedidoId}:`, error)
      throw error
    }
  return data || []
  } catch (error) {
    console.error(`❌ Erro detalhado ao buscar pendências do pedido ${pedidoId}:`, error)
    throw error
  }
}

export async function getAllPendencias() {
  try {
  const { data, error } = await supabase.from("pendencias").select("*")

    if (error) {
      console.error("❌ Erro ao buscar todas as pendências:", error)
      throw error
    }
  return data || []
  } catch (error) {
    console.error("❌ Erro detalhado ao buscar todas as pendências:", error)
    throw error
  }
}

export async function salvarConferencia(dados: any) {
  try {
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
    console.error("Erro detalhado ao salvar conferência:", error)
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
  try {
    if (!dados.produtos || dados.produtos.length === 0) {
      return { data: null, error: null }
    }

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
      .from('pendencias')
      .insert(pendencias)

    if (error) {
      console.error("❌ Erro ao salvar pendências:", error)
      throw error
    }

    return { data: pendencias, error: null }
  } catch (error) {
    console.error("❌ Erro detalhado ao salvar pendências:", error)
    throw error
  }
}

export async function deletarPendencias(pedidoId: string | number) {
  try {
    const { error } = await supabase
      .from('pendencias')
      .delete()
      .eq('pedido_id', String(pedidoId))

    if (error) {
      console.error(`❌ Erro ao deletar pendências do pedido ${pedidoId}:`, error)
      throw error
    }
  return { error: null }
  } catch (error) {
    console.error(`❌ Erro detalhado ao deletar pendências do pedido ${pedidoId}:`, error)
    throw error
  }
}
