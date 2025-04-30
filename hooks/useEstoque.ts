import { useState, useEffect } from "react"
import { 
  getSorvetes, 
  getAcai, 
  getAcompanhamentos, 
  getCongelados, 
  getUtensilhos, 
  getColecionaveis, 
  getPotes,
  getSazonais,
  getCampanhas,
  type ProdutoEstoque 
} from "@/lib/supabase"

type CategoriaEstoque = {
  nome: string
  icone: string
  produtos: ProdutoEstoque[]
  loading: boolean
  error: string | null
}

export function useEstoque() {
  const [categorias, setCategorias] = useState<CategoriaEstoque[]>([
    { nome: "Sorvetes", icone: "🍦", produtos: [], loading: true, error: null },
    { nome: "Açaí", icone: "🥣", produtos: [], loading: true, error: null },
    { nome: "Acompanhamentos", icone: "🍫", produtos: [], loading: true, error: null },
    { nome: "Congelados", icone: "❄️", produtos: [], loading: true, error: null },
    { nome: "Utensilhos", icone: "🍴", produtos: [], loading: true, error: null },
    { nome: "Colecionáveis", icone: "🎁", produtos: [], loading: true, error: null },
    { nome: "Potes", icone: "🥤", produtos: [], loading: true, error: null },
    { nome: "Sazonais", icone: "🎯", produtos: [], loading: true, error: null },
    { nome: "Campanhas", icone: "📢", produtos: [], loading: true, error: null }
  ])

  const carregarEstoque = async () => {
    try {
      const [
        sorvetes,
        acai,
        acompanhamentos,
        congelados,
        utensilhos,
        colecionaveis,
        potes,
        sazonais,
        campanhas
      ] = await Promise.all([
        getSorvetes(),
        getAcai(),
        getAcompanhamentos(),
        getCongelados(),
        getUtensilhos(),
        getColecionaveis(),
        getPotes(),
        getSazonais(),
        getCampanhas()
      ])

      setCategorias([
        { ...categorias[0], produtos: sorvetes, loading: false },
        { ...categorias[1], produtos: acai, loading: false },
        { ...categorias[2], produtos: acompanhamentos, loading: false },
        { ...categorias[3], produtos: congelados, loading: false },
        { ...categorias[4], produtos: utensilhos, loading: false },
        { ...categorias[5], produtos: colecionaveis, loading: false },
        { ...categorias[6], produtos: potes, loading: false },
        { ...categorias[7], produtos: sazonais, loading: false },
        { ...categorias[8], produtos: campanhas, loading: false }
      ])
    } catch (error) {
      setCategorias(categorias.map(cat => ({
        ...cat,
        loading: false,
        error: error instanceof Error ? error.message : "Erro ao carregar estoque"
      })))
    }
  }

  useEffect(() => {
    carregarEstoque()
  }, [])

  return {
    categorias,
    recarregarEstoque: carregarEstoque
  }
} 