import { getSupabaseClient } from "./supabase"
import type { ProdutoEstoque } from "./supabase"

// Catálogo de produtos por categoria
const CATALOGO_PRODUTOS = {
  sorvetes: [
    'abacaxi', 'amarena', 'blue ice', 'brownie recheado', 'chocomenta',
    'chocopipoca caramelizada 6,5kg', 'creme americano', 'creme de amendoim trufado',
    'cupuaçu', 'doce de leite', 'ferrero rocher', 'flocos', 'laka oreo',
    'leitinho trufado', 'maça encantada', 'merengue de morango', 'mokaccino',
    'morango', 'mousse maracujá', 'ovomaltine', 'passas ao rum', 'pistache choco braco',
    'pitaya tropical', 'rafaello', 'red velvet', 'sorbet kiwi 7kg', 'sorbet limão 7kg',
    'sorbet maracuja com morango zero açúcar 7kg', 'sorbet morango 7kg',
    'sorvete de cheesecake de goiabada', 'unicórnio', 'uva'
  ],
  acai: [
    'açaí - amarena', 'açaí - banana', 'açaí - cupuaçu', 'açai - kinder',
    'açaí - leitinho c/ creme avelã', 'açaí - morango', 'açaí - mousse de maracujá',
    'açaí - paçoca', 'açai - pistache', 'açaí - tradicional', 'açaí - trufado branco',
    'açaí - zero', 'açaí do pará'
  ],
  congelados: [
    'bestzinho - açaí tradicional (50un)',
    'brownie em cubos (acompanhamento) - caixa 10 kg',
    'caixa de donuts (120un) - promocional',
    'massa de waffle congelado',
    'massa de waffle congelado 72un',
    'waffle congelado'
  ],
  potes: [
    '(6un) açai do para - pote 1,5l', '(6un) açai leitinho c/ avela - pote 1,5l',
    '(6un) açai pistache - pote 1,5l', '(6un) açai tradicional - pote 1,5l',
    '(6un) açai zero - pote 1,5l', '(6un) sorbet morango - pote 1,5l',
    '(6un) sorbet pitaya - pote 1,5l', '(6un) sorvete creme de amendoim trufado - pote 1,5l',
    '(6un) sorvete ferrero rocher - pote 1,5l', '(6un) sorvete ovomaltine - pote 1,5l',
    '(6un) sorvete unicornio - pote 1,5l'
  ],
  acompanhamentos: [
    'amendoim granulado', 'balde de doce de leite', 'beijinho', 'bombom triturado 8kg',
    'brigadeiro', 'cajuzinho', 'calda fini - banana', 'calda fini - beijos',
    'calda fini - dentadura', 'chocolate com avelã', 'chocotine cream 14kg',
    'cobertura blue ice 1,3kg', 'cobertura chiclete 1,3kg', 'cobertura de amora 1,3kg',
    'cobertura de banana 1,3kg', 'cobertura de caramelo 1,3kg',
    'cobertura de choc. meio amargo 1,3kg', 'cobertura de chocolate 1,3kg',
    'cobertura de limão 1,3kg', 'cobertura de menta 1,3kg', 'cobertura de morango 1,3kg',
    'cobertura de tutti frutti 1,3kg', 'cobertura de uva 1,3kg', 'confete',
    'corante para chocolate - azul', 'corante para chocolate - rosa',
    'creme cookies cream - 12kg - duas rodas', 'creme cookies cream - the best açai',
    'creme de amendoim', 'creme de avelã - duas rodas', 'creme de avelã the best - 2024',
    'creme de leitinho 14kg', 'gelatina cobrinha cítrica', 'gelatina de cereja',
    'gelatinas de beijo', 'geleia de morango 20kg', 'gominha tipo sino doce cx c/ 10kg',
    'gotas de chocolate - berry callebout - 20kg', 'granola 1kg',
    'granulado cacau foods 10 kg', 'granulado macio colorido', 'kit de embalagens (whey)',
    'leite condensado - 20kg', 'leite condensado cx - 10kg', 'leite em pó integral',
    'marshmallow p/ fondue - pacote 250g', 'mel 5kg', 'micro ball cacau foods 6kg',
    'ovomaltine', 'paçoca branca', 'paçoca preta', 'paçoca rolha - paçoquita',
    'pasta de pistache', 'pipoca caramelizada 10kg',
    'power ball choc. branco cacau foods 6kg', 'power ball chocolate cacau foods 6kg',
    'stracciatella branco', 'stracciatella meio amargo', 'tapioca granulada 5kg',
    'tubete de baunilha 4kg', 'tubetes de chocolate 6kg', 'wafer branco', 'whey +mu 900g'
  ],
  utensilhos: [
    'adesivo - pascoa 2025 (un)', 'baldinho para pegador', 'bisnaga 1l', 'bóia grande',
    'bóia pequena', 'cadeira bebê – the best açaí', 'carrinho the best acai',
    'cartão de delivery "salvê" c/100', 'cartaz - pascoa 2025 (un)', 'colher de degustação cx',
    'colher grande (18 cm) cx c/ 400', 'colher the best 2024 - c/ 1000',
    'concha vazada para buffet', 'cuba 100mm gn 1/6 + tampa', 'cuba 65mm gn 1/6 + tampa',
    'dangler - pascoa 2025 (un)', 'display suporte para whey', 'farinheira',
    'fôrma de ovo de páscoa - 3 ovos', 'jogo mesa bistrô 2 cadeiras – the best açaí',
    'jogo mesa comum 4 cadeiras - the best açaí 70x70', 'kit etiquetas adesivas',
    'kit plaquinhas - tba', 'lacre segurança p/ delivery',
    'letrinha frase - "porque o melhor açaí..."', 'ombrelone the best acai',
    'pegador de sorvete - boleador', 'pegador de sorvete - espátula', 'pegador para buffet',
    'saco kraft - tamanho g - c/ 250 un', 'saco kraft - tamanho p - c/ 250 un',
    'sacolinhas 1000un (tam g)', 'sacolinhas 1000un (tam p)', 'tapete the best açaí 1,50x60',
    'termômetro digital de espeto - para açaí/sorvete', 'tiara - pascoa 2025 (un)',
    'totem alcool em gel'
  ],
  colecionaveis: [
    '⁠bolsa térmica the best 2024 - branca', '⁠bolsa térmica the best 2024 - grafites @carao01',
    '⁠bolsa térmica the best 2024 - preta', 'boné all black (exclusivo - modelo 2024)',
    'chaveiro the best (the best club)', 'copo coleção 01 - branco',
    'copo coleção 01 - preto', 'copo coleção 02 - tucano azul (un)',
    'garrafinha the best (the best club)'
  ],
  sazonais: [] // Nova categoria para produtos sazonais
}

// Cache para produtos já encontrados
const produtosEncontradosCache = new Map<string, ProdutoEstoque>()

// Função para calcular a similaridade entre duas strings
function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()
  
  const limparString = (s: string) => {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
  }

  const palavras1 = new Set(limparString(s1).split(' '))
  const palavras2 = new Set(limparString(s2).split(' '))

  const intersecao = new Set([...palavras1].filter(x => palavras2.has(x)))
  const similaridade = intersecao.size / (palavras1.size + palavras2.size - intersecao.size)
  
  return similaridade
}

// Função para buscar produtos similares em uma categoria
async function buscarProdutosSimilares(nome: string, categoria: string): Promise<Array<{
  id: number
  nome: string
  categoria: string
  similaridade: number
}>> {
  const supabase = getSupabaseClient()
  const { data: produtos } = await supabase
    .from(categoria)
    .select('id, item')

  if (!produtos) return []

  const resultados = produtos
    .map(p => ({
      id: p.id,
      nome: p.item,
      categoria,
      similaridade: calcularSimilaridade(nome, p.item)
    }))
    .filter(p => p.similaridade > 0.3) // Reduz o limiar para mostrar mais sugestões
    .sort((a, b) => b.similaridade - a.similaridade)
    .slice(0, 5)

  return resultados
}

// Função para limpar o cache de um produto específico
function limparCacheProduto(categoria: string, nomeProduto: string) {
  const chaveCache = `${categoria}:${nomeProduto}`
  if (produtosEncontradosCache.has(chaveCache)) {
    console.log(`Limpando cache para: ${nomeProduto}`)
    produtosEncontradosCache.delete(chaveCache)
  }
}

// Função para encontrar produto no estoque
async function encontrarProdutoEstoque(
  categoria: string,
  nomeProduto: string
): Promise<ProdutoEstoque | null> {
  const supabase = getSupabaseClient()
  const chaveCache = `${categoria}:${nomeProduto}`

  // Verifica no cache primeiro
  if (produtosEncontradosCache.has(chaveCache)) {
    console.log(`Produto encontrado no cache: ${nomeProduto}`)
    return produtosEncontradosCache.get(chaveCache) || null
  }

  try {
    console.log(`Buscando produto "${nomeProduto}" na categoria ${categoria}`)
    
    // Busca todos os produtos da categoria
    const { data: produtos, error } = await supabase
      .from(categoria)
      .select("*")

    if (error || !produtos) {
      console.error(`Erro ao buscar produtos da categoria ${categoria}:`, error)
      return null
    }

    // Normaliza os textos para comparação
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    }

    const nomeProdutoNormalizado = normalizeText(nomeProduto)

    // Busca por correspondência exata (case insensitive e sem acentos)
    const produtoEncontrado = produtos.find(p => 
      normalizeText(p.item) === nomeProdutoNormalizado
    )

    if (produtoEncontrado) {
      console.log(`Correspondência exata encontrada para "${nomeProduto}": ${produtoEncontrado.item}`)
      produtosEncontradosCache.set(chaveCache, produtoEncontrado)
      return produtoEncontrado
    }

    console.log(`Nenhuma correspondência exata encontrada para "${nomeProduto}" na categoria ${categoria}`)
    return null
  } catch (error) {
    console.error(`Erro ao buscar produto ${nomeProduto}:`, error)
    return null
  }
}

// Função para processar a atualização do estoque
export async function processarAtualizacaoEstoque() {
  const supabase = getSupabaseClient()
  const produtosNaoEncontrados: Array<{
    nome: string
    quantidade: number
    sugestoes: Array<{
      id: number
      nome: string
      categoria: string
      similaridade: number
    }>
  }> = []

  // Busca todas as conferências
  const { data: conferencias } = await supabase
    .from('conferidos')
    .select('*')
    .order('data', { ascending: true })

  if (!conferencias?.length) {
    console.log('Nenhuma conferência encontrada')
    return { produtosNaoEncontrados }
  }

  // Para cada conferência
  for (const conferencia of conferencias) {
    try {
      console.log(`\nProcessando conferência ${conferencia.id}:`)
      const produtos = JSON.parse(conferencia.produtos)

      // Busca todos os históricos desta conferência de uma vez
      const { data: historicos } = await supabase
        .from('historico_estoque')
        .select('*')
        .eq('conferencia_id', conferencia.id)

      // Cria um mapa dos históricos por nome do produto
      const historicosMap = new Map(
        (historicos || []).map(h => [h.produto_nome, h])
      )

      // Para cada produto na conferência
      for (const produto of produtos) {
        const nomeProduto = produto.produto || produto.nome
        const quantidadePedida = produto.quantidade_pedida || 0
        const quantidadeRecebida = produto.quantidade_recebida || produto.recebido || 0

        if (!nomeProduto) {
          console.error('Nome do produto não encontrado:', produto)
          continue
        }

        console.log(`\nVerificando produto: ${nomeProduto}`)
        console.log(`Quantidade recebida: ${quantidadeRecebida}`)

        // Verifica o histórico existente
        const historicoExistente = historicosMap.get(nomeProduto)

        // Se já existe um histórico com a mesma quantidade, pula
        if (historicoExistente?.quantidade_recebida === quantidadeRecebida) {
          console.log(`Produto ${nomeProduto} já processado com a mesma quantidade (${quantidadeRecebida}), pulando...`)
          continue
        }

        // Procura o produto no estoque
        const categorias = [
          'campanhas', 'sorvetes', 'acai', 'acompanhamentos', 'congelados',
          'utensilhos', 'colecionaveis', 'potes', 'sazonais'
        ]

        let produtoEncontrado = false
        let categoriaEncontrada = ''
        let produtoEstoqueEncontrado = null

        for (const categoria of categorias) {
          const produtoEstoque = await encontrarProdutoEstoque(categoria, nomeProduto)
          if (produtoEstoque) {
            produtoEncontrado = true
            categoriaEncontrada = categoria
            produtoEstoqueEncontrado = produtoEstoque
            break
          }
        }

        if (!produtoEncontrado || !produtoEstoqueEncontrado) {
          console.log(`Produto não encontrado no estoque: ${nomeProduto}`)
          const todasSugestoes = await Promise.all(
            categorias.map(cat => buscarProdutosSimilares(nomeProduto, cat))
          )

          const sugestoes = todasSugestoes
            .flat()
            .sort((a, b) => b.similaridade - a.similaridade)
            .slice(0, 5)

          if (!produtosNaoEncontrados.some(p => p.nome === nomeProduto)) {
            produtosNaoEncontrados.push({
              nome: nomeProduto,
              quantidade: quantidadeRecebida,
              sugestoes
            })
          }
          continue
        }

        try {
          const estoqueAtual = produtoEstoqueEncontrado.estoque || 0

          if (historicoExistente) {
            // Se existe histórico, atualiza apenas a diferença
            const quantidadeAnterior = historicoExistente.quantidade_recebida || 0
            const diferenca = quantidadeRecebida - quantidadeAnterior
            
            if (diferenca === 0) {
              console.log(`Nenhuma alteração na quantidade para ${nomeProduto}`)
              continue
            }

            const novoEstoque = estoqueAtual + diferenca
            console.log(`\nAtualizando produto ${nomeProduto}:`)
            console.log(`Histórico anterior: ${quantidadeAnterior}`)
            console.log(`Nova quantidade: ${quantidadeRecebida}`)
            console.log(`Diferença a aplicar: ${diferenca}`)
            console.log(`Estoque atual: ${estoqueAtual}`)
            console.log(`Novo estoque: ${novoEstoque}`)

            // Atualiza o histórico
            await supabase
              .from('historico_estoque')
              .update({
                quantidade_recebida: quantidadeRecebida,
                quantidade_faltante: quantidadePedida - quantidadeRecebida,
                data_atualizacao: new Date().toISOString()
              })
              .eq('id', historicoExistente.id)

            // Atualiza o estoque
            await supabase
              .from(categoriaEncontrada)
              .update({ estoque: novoEstoque })
              .eq('id', produtoEstoqueEncontrado.id)

          } else {
            // Primeira vez processando este produto
            const novoEstoque = estoqueAtual + quantidadeRecebida
            console.log(`\nPrimeiro processamento para ${nomeProduto}:`)
            console.log(`Estoque atual: ${estoqueAtual}`)
            console.log(`Quantidade recebida: ${quantidadeRecebida}`)
            console.log(`Novo estoque: ${novoEstoque}`)

            // Cria o histórico
            await supabase
              .from('historico_estoque')
              .insert([{
                conferencia_id: conferencia.id,
                produto_nome: nomeProduto,
                categoria: categoriaEncontrada,
                produto_id: produtoEstoqueEncontrado.id,
                quantidade_pedida: quantidadePedida,
                quantidade_recebida: quantidadeRecebida,
                quantidade_faltante: quantidadePedida - quantidadeRecebida,
                data_atualizacao: new Date().toISOString()
              }])

            // Atualiza o estoque
            await supabase
              .from(categoriaEncontrada)
              .update({ estoque: novoEstoque })
              .eq('id', produtoEstoqueEncontrado.id)
          }

          // Limpa o cache do produto
          limparCacheProduto(categoriaEncontrada, nomeProduto)

        } catch (error) {
          console.error(`Erro ao processar produto ${nomeProduto}:`, error)
        }
      }
    } catch (error) {
      console.error(`Erro ao processar conferência ${conferencia.id}:`, error)
    }
  }

  return { produtosNaoEncontrados }
}

// Função para vincular um produto
export async function vincularProduto(
  nomeOriginal: string,
  produtoId: number,
  categoria: string
) {
  const supabase = getSupabaseClient()

  // Busca o produto no estoque
  const { data: produto } = await supabase
    .from(categoria)
    .select('*')
    .eq('id', produtoId)
    .single()

  if (!produto) {
    throw new Error('Produto não encontrado')
  }

  // Busca a conferência mais recente
  const { data: conferencias } = await supabase
    .from('conferidos')
    .select('*')
    .order('data', { ascending: false })
    .limit(1)

  if (!conferencias?.length) return

  const conferencia = conferencias[0]

  try {
    const produtos = JSON.parse(conferencia.produtos)
    let estoqueAtualizado = false

    for (const p of produtos) {
      const nome = p.produto || p.nome
      if (nome === nomeOriginal) {
        const quantidade = p.quantidade_recebida || p.recebido || 0
        if (quantidade > 0) {
          const novoEstoque = (produto.estoque || 0) + quantidade

          await supabase
            .from(categoria)
            .update({ estoque: novoEstoque })
            .eq('id', produtoId)

          // Cria ou atualiza o histórico
          const { data: historicoExistente } = await supabase
            .from('historico_estoque')
            .select('*')
            .eq('conferencia_id', conferencia.id)
            .eq('produto_nome', nomeOriginal)
            .single()

          if (historicoExistente) {
            await supabase
              .from('historico_estoque')
              .update({
                quantidade_recebida: quantidade,
                quantidade_faltante: 0,
                data_atualizacao: new Date().toISOString()
              })
              .eq('id', historicoExistente.id)
          } else {
            await supabase
              .from('historico_estoque')
              .insert([{
                conferencia_id: conferencia.id,
                produto_nome: nomeOriginal,
                categoria,
                produto_id: produtoId,
                quantidade_pedida: quantidade,
                quantidade_recebida: quantidade,
                quantidade_faltante: 0,
                data_atualizacao: new Date().toISOString()
              }])
          }

          estoqueAtualizado = true
        }
      }
    }

    if (estoqueAtualizado) {
      console.log(`✅ Produto vinculado e estoque atualizado: ${nomeOriginal}`)
    }
  } catch (error) {
    console.error(`Erro ao processar conferência ${conferencia.id}:`, error)
  }
}

// Função para cadastrar um novo produto
export async function cadastrarProduto(dados: {
  nome: string
  categoria: string
  estoque: number
}) {
  const supabase = getSupabaseClient()

  try {
    // Cadastra o novo produto
    const { data: produto, error } = await supabase
      .from(dados.categoria)
      .insert([{
        item: dados.nome,
        situacao: 'Normal',
        sugestao: '',
        peso: '',
        valor_produto: '0',
        valor_servico: '0',
        valor_total: '0',
        estoque: dados.estoque,
        disponivel_para_pedido: true,
        qtd: 0
      }])
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao cadastrar produto')
    }

    // Busca o histórico do produto para atualizar o estoque_atual
    const { data: historicos } = await supabase
      .from('historico_estoque')
      .select('*')
      .eq('produto_nome', dados.nome)
      .order('created_at', { ascending: false })

    // Atualiza o estoque_atual no histórico
    if (historicos?.length) {
      const { error: erroHistorico } = await supabase
        .from('historico_estoque')
        .update({
          estoque_atual: dados.estoque,
          data_atualizacao: new Date().toISOString()
        })
        .eq('produto_nome', dados.nome)

      if (erroHistorico) {
        console.error('Erro ao atualizar estoque_atual no histórico:', erroHistorico)
      }
    }

    return produto
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error)
    throw error
  }
}

// Função principal para atualizar o estoque baseado em uma conferência
export async function atualizarEstoqueConferencia(conferencia: any) {
  const supabase = getSupabaseClient()
  try {
    if (!conferencia || !conferencia.produtos) {
      console.error('Dados da conferência inválidos:', conferencia)
      return
    }

    let conferenciaId = conferencia.id
    if (!conferenciaId && conferencia.pedido_id) {
      const { data: confByPedido } = await supabase
        .from('conferidos')
        .select('id')
        .eq('pedido_id', conferencia.pedido_id)
        .single()
      if (confByPedido) {
        conferenciaId = confByPedido.id
      }
    }
    if (!conferenciaId) {
      console.error('Não foi possível encontrar uma conferência válida')
      return
    }

    const produtos = typeof conferencia.produtos === 'string' 
      ? JSON.parse(conferencia.produtos) 
      : conferencia.produtos

    // Busca o histórico existente para este pedido
    const { data: historicosExistentes } = await supabase
      .from('historico_estoque')
      .select('*')
      .eq('conferencia_id', conferenciaId)

    // Lista de categorias para buscar o estoque
    const categorias = [
      'campanhas', 'sorvetes', 'acai', 'acompanhamentos', 'congelados',
      'utensilhos', 'colecionaveis', 'potes', 'sazonais'
    ]
    for (const produto of produtos) {
      if (!produto || typeof produto !== 'object') {
        console.error('Produto inválido:', produto)
        continue
      }
      const nomeProduto = produto.produto || produto.nome
      const quantidadeRecebida = produto.quantidade_recebida || produto.recebido || 0
      if (!nomeProduto) {
        console.error('Nome do produto não encontrado:', produto)
        continue
      }
      // Busca histórico anterior deste produto/pedido
      const historicoAnterior = historicosExistentes?.find(h => h.produto_nome === nomeProduto)
      let quantidadeAnterior = 0
      if (historicoAnterior) {
        quantidadeAnterior = historicoAnterior.quantidade_recebida || 0
      }
      const quantidadeAtualizada = quantidadeRecebida - quantidadeAnterior
      // Busca a quantidade atual no estoque (assume 0 se não encontrar)
      let estoqueAtual = 0
      for (const categoria of categorias) {
        const { data: produtosEstoque } = await supabase
          .from(categoria)
          .select('estoque')
          .eq('item', nomeProduto)
          .single()
        if (produtosEstoque?.estoque !== undefined) {
          estoqueAtual = produtosEstoque.estoque
          break
        }
      }
      if (historicoAnterior) {
        // Atualiza o histórico existente
        const { error: erroHistorico } = await supabase
          .from('historico_estoque')
          .update({
            quantidade_anterior: quantidadeAnterior,
            quantidade_recebida: quantidadeRecebida,
            quantidade_atualizada: quantidadeAtualizada,
            estoque_atual: estoqueAtual,
            data_atualizacao: new Date().toISOString()
          })
          .eq('id', historicoAnterior.id)
        if (erroHistorico) {
          console.error('Erro ao atualizar histórico:', erroHistorico)
        }
      } else {
        // Cria um novo registro no histórico
        const { error: erroHistorico } = await supabase
          .from('historico_estoque')
          .insert([{
            conferencia_id: conferenciaId,
            produto_nome: nomeProduto,
            quantidade_anterior: 0,
            quantidade_recebida: quantidadeRecebida,
            quantidade_atualizada: quantidadeRecebida,
            estoque_atual: estoqueAtual,
            data_atualizacao: new Date().toISOString()
          }])
        if (erroHistorico) {
          console.error('Erro ao criar histórico:', erroHistorico)
        }
      }
      console.log(`✅ Histórico registrado para ${nomeProduto}: anterior=${quantidadeAnterior}, recebida=${quantidadeRecebida}, atualizada=${quantidadeAtualizada}`)
    }
  } catch (error) {
    console.error("Erro ao registrar conferência:", error)
  }
}

// Interface para retorno da função
interface ResultadoAtualizacao {
  produtosAtualizados: string[]
  produtosNaoEncontrados: Array<{
    nome: string
    quantidade_recebida: number
    sugestoes: Array<{
      id: number
      nome: string
      categoria: string
      similaridade: number
    }>
  }>
}

// Função para processar as atualizações de estoque
export async function processarAtualizacoesEstoque(): Promise<ResultadoAtualizacao> {
  const supabase = getSupabaseClient()
  const resultado: ResultadoAtualizacao = {
    produtosAtualizados: [],
    produtosNaoEncontrados: []
  }

  try {
    // Busca todos os registros do histórico com quantidade_recebida > 0
    const { data: historicos, error: erroHistorico } = await supabase
      .from('historico_estoque')
      .select('*')
      .gt('quantidade_recebida', 0)
      .order('created_at', { ascending: true })

    if (erroHistorico) {
      console.error('Erro ao buscar histórico:', erroHistorico)
      throw new Error('Erro ao buscar histórico')
    }

    if (!historicos?.length) {
      console.log('Nenhuma atualização pendente')
      throw new Error('Sem movimentações de pedidos.')
    }

    // Lista de categorias para buscar/atualizar o estoque
    const categorias = [
      'campanhas', 'sorvetes', 'acai', 'acompanhamentos', 'congelados',
      'utensilhos', 'colecionaveis', 'potes', 'sazonais'
    ]

    // Processa cada registro do histórico
    for (const historico of historicos) {
      const nomeProduto = historico.produto_nome
      console.log(`\nProcessando produto: ${nomeProduto}`)
      console.log(`Quantidade recebida: ${historico.quantidade_recebida}`)

      // Procura o produto em todas as categorias
      let produtoEncontrado = false
      
      for (const categoria of categorias) {
        const { data: produto } = await supabase
          .from(categoria)
          .select('id, estoque')
          .eq('item', nomeProduto)
          .single()

        if (produto) {
          try {
            // estoque_atual = valor que consta na tabela estoque do produto
            const estoqueAtual = produto.estoque || 0
            
            // Busca o histórico anterior do mesmo pedido (sem filtrar por nome do produto)
            const { data: historicoAnterior } = await supabase
              .from('historico_estoque')
              .select('quantidade_recebida')
              .eq('conferencia_id', historico.conferencia_id)
              .neq('id', historico.id)
              .order('created_at', { ascending: false })
              .limit(1)
            
            // quantidade_anterior = quantidade_recebida do histórico anterior (ou 0 se não houver)
            const quantidadeAnterior = historicoAnterior?.[0]?.quantidade_recebida || 0
            // quantidade_recebida = valor atual recebido
            const quantidadeRecebida = historico.quantidade_recebida || 0
            // quantidade_atualizada = quantidade_recebida - quantidade_anterior
            const quantidadeAtualizada = quantidadeRecebida - quantidadeAnterior
            // Novo estoque será o estoque atual mais a quantidade_atualizada
            const novoEstoque = estoqueAtual + quantidadeAtualizada

            console.log(`Atualizando estoque em ${categoria}:`)
            console.log(`- Estoque atual: ${estoqueAtual}`)
            console.log(`- Quantidade anterior (mesmo pedido): ${quantidadeAnterior}`)
            console.log(`- Quantidade recebida: ${quantidadeRecebida}`)
            console.log(`- Quantidade atualizada: ${quantidadeAtualizada}`)
            console.log(`- Novo estoque: ${novoEstoque}`)

            // Atualiza o estoque do produto (usando apenas a diferença)
            if (quantidadeAtualizada !== 0) {
              const { error: erroAtualizacao } = await supabase
                .from(categoria)
                .update({ estoque: novoEstoque })
                .eq('id', produto.id)

              if (erroAtualizacao) {
                throw new Error(`Erro ao atualizar estoque: ${erroAtualizacao.message}`)
              }
            }

            // Verifica se o produto está 100% concluído
            const { data: conferencia } = await supabase
              .from('conferidos')
              .select('produtos')
              .eq('id', historico.conferencia_id)
              .single()

            let produtoFinalizado = false;
            let quantidadePedida = 0;
            if (conferencia) {
              const produtos = JSON.parse(conferencia.produtos)
              const produtoConferencia = produtos.find((p: any) => p.produto === nomeProduto || p.nome === nomeProduto)
              if (produtoConferencia) {
                quantidadePedida = produtoConferencia.quantidade || produtoConferencia.quantidade_pedida || 0;
                // A soma das quantidades recebidas deve ser igual à quantidade pedida
                if (quantidadeRecebida === quantidadePedida) {
                  produtoFinalizado = true;
                }
              }
            }

            if (produtoFinalizado) {
              // Se o produto está 100% concluído, deleta o registro do histórico
              const { error: erroDelete } = await supabase
                .from('historico_estoque')
                .delete()
                .eq('id', historico.id)

              if (erroDelete) {
                console.error('Erro ao deletar histórico:', erroDelete)
              } else {
                console.log(`✅ Histórico deletado para ${nomeProduto} (100% concluído)`)
              }
            } else {
              // Se não está 100% concluído, atualiza o histórico corretamente
              const { error: erroHistorico } = await supabase
                .from('historico_estoque')
                .update({
                  quantidade_anterior: quantidadeAnterior,
                  quantidade_recebida: quantidadeRecebida,
                  quantidade_atualizada: quantidadeAtualizada,
                  estoque_atual: novoEstoque,
                  data_atualizacao: new Date().toISOString()
                })
                .eq('id', historico.id)

              if (erroHistorico) {
                console.error('Erro ao atualizar histórico:', erroHistorico)
              }
            }

            console.log(`✅ Estoque atualizado com sucesso`)
            resultado.produtosAtualizados.push(nomeProduto)
            produtoEncontrado = true
            break
          } catch (error) {
            console.error(`Erro ao processar ${nomeProduto}:`, error)
          }
        }
      }

      if (!produtoEncontrado) {
        console.log(`Produto não encontrado: ${nomeProduto}`)
        
        // Busca sugestões para o cadastro manual
        const todasSugestoes = await Promise.all(
          categorias.map(cat => buscarProdutosSimilares(nomeProduto, cat))
        )

        const sugestoes = todasSugestoes
          .flat()
          .sort((a, b) => b.similaridade - a.similaridade)
          .slice(0, 5)

        resultado.produtosNaoEncontrados.push({
          nome: nomeProduto,
          quantidade_recebida: historico.quantidade_recebida,
          sugestoes
        })
      }
    }

    return resultado
  } catch (error) {
    console.error('Erro ao processar atualizações:', error)
    throw error
  }
}

// Função para finalizar a atualização após cadastro manual
export async function finalizarAtualizacaoAposCadastro(
  nomeProduto: string,
  categoria: string,
  produtoId: number,
  quantidadeRecebida: number
) {
  const supabase = getSupabaseClient()

  try {
    // Atualiza o estoque do produto recém cadastrado
    const { error: erroEstoque } = await supabase
      .from(categoria)
      .update({ estoque: quantidadeRecebida })
      .eq('id', produtoId)

    if (erroEstoque) {
      throw new Error(`Erro ao atualizar estoque: ${erroEstoque.message}`)
    }

    // Zera as quantidades no histórico
    const { error: erroHistorico } = await supabase
      .from('historico_estoque')
      .update({
        quantidade_anterior: 0,
        quantidade_recebida: 0
      })
      .eq('produto_nome', nomeProduto)

    if (erroHistorico) {
      console.error('Erro ao zerar histórico:', erroHistorico)
    }

    console.log(`✅ Atualização finalizada com sucesso para ${nomeProduto}`)
    return true
  } catch (error) {
    console.error('Erro ao finalizar atualização:', error)
    return false
  }
} 