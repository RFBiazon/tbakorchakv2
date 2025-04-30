"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useEstoque } from "@/hooks/useEstoque"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, CheckCircle2, Search, XCircle, FileText, BarChart, ChartNoAxesColumn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { limparEstoque } from "@/lib/supabase"
import { AtualizarEstoqueButton } from "./components/atualizar-estoque-button"
import { useRouter } from "next/navigation"
import { TabelaEstoque } from "./components/tabela-estoque"
import { Input } from "@/components/ui/input"
import { ModalCadastroProduto } from "./components/modal-cadastro-produto"

export default function EstoquesPage() {
  const router = useRouter()
  const { categorias, recarregarEstoque } = useEstoque()
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null)
  const [limpandoEstoque, setLimpandoEstoque] = useState(false)
  const [termoBusca, setTermoBusca] = useState("")

  const getStatusColor = (estoque: number) => {
    if (estoque <= 0) return "text-red-500"
    if (estoque <= 5) return "text-yellow-500"
    return "text-green-500"
  }

  const getStatusIcon = (estoque: number) => {
    if (estoque <= 0) return <XCircle className="h-4 w-4" />
    if (estoque <= 5) return <AlertTriangle className="h-4 w-4" />
    return <CheckCircle2 className="h-4 w-4" />
  }

  const handleCardClick = (categoriaNome: string) => {
    setCategoriaSelecionada(categoriaNome)
    setTermoBusca("") // Limpa a busca ao selecionar uma categoria
  }

  const handleLimparEstoque = async () => {
    if (window.confirm("Tem certeza que deseja zerar todo o estoque? Esta ação não pode ser desfeita.")) {
      try {
        setLimpandoEstoque(true)
        await limparEstoque()
        await recarregarEstoque()
        router.refresh()
        alert("Estoque zerado com sucesso!")
      } catch (error) {
        console.error("Erro ao limpar estoque:", error)
        alert("Erro ao limpar estoque. Por favor, tente novamente.")
      } finally {
        setLimpandoEstoque(false)
      }
    }
  }

  // Função para filtrar produtos com base no termo de busca
  const filtrarProdutos = (produtos: any[]) => {
    if (!termoBusca) return produtos
    const termo = termoBusca.toLowerCase()
    return produtos.filter(produto => 
      produto.item.toLowerCase().includes(termo)
    )
  }

  // Função para verificar se uma categoria tem produtos que correspondem à busca
  const categoriaTemResultados = (categoria: any) => {
    return filtrarProdutos(categoria.produtos).length > 0
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-black dark:text-white">Controle de Estoques</h1>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Input
                type="text"
                placeholder="Buscar produto..."
                value={termoBusca}
                onChange={(e) => {
                  setTermoBusca(e.target.value)
                  setCategoriaSelecionada(null)
                }}
                className="pl-8"
              />
              <Search className="h-4 w-4 absolute left-2 top-3 text-muted-foreground" />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/relatorios/estoque")}
            >
              <ChartNoAxesColumn className="h-4 w-4" />
            </Button>
            <ModalCadastroProduto onSuccess={() => {
              recarregarEstoque()
              router.refresh()
            }} />
            <Button 
              variant="destructive" 
              onClick={handleLimparEstoque}
              disabled={limpandoEstoque}
            >
              {limpandoEstoque ? "Zerando estoque..." : "Zerar Estoque"}
            </Button>
            <AtualizarEstoqueButton onSuccess={() => {
              recarregarEstoque()
              router.refresh()
            }} />
          </div>
        </div>
        
        {!termoBusca && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categorias.map((categoria) => (
              <Card 
                key={categoria.nome} 
                className={`hover:border-primary transition-colors cursor-pointer ${
                  categoriaSelecionada === categoria.nome ? 'border-primary' : ''
                }`}
                onClick={() => handleCardClick(categoria.nome)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {categoria.icone} {categoria.nome}
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {categoria.loading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : categoria.error ? (
                    <p className="text-destructive text-sm">{categoria.error}</p>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {categoria.produtos.length} itens
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm">
                          <span className="text-green-500 mr-1">✓</span>
                          {categoria.produtos.filter(p => p.estoque > 5).length} em estoque
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-yellow-500 mr-1">⚠️</span>
                          {categoria.produtos.filter(p => p.estoque > 0 && p.estoque <= 5).length} com baixo estoque
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-red-500 mr-1">✗</span>
                          {categoria.produtos.filter(p => p.estoque <= 0).length} sem estoque
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          {termoBusca ? (
            <h2 className="text-xl font-bold mb-4">Resultados da Busca: "{termoBusca}"</h2>
          ) : (
            <h2 className="text-xl font-bold mb-4">Detalhes do Estoque</h2>
          )}
          <div className="space-y-4">
            {categorias
              .filter(categoria => {
                if (termoBusca) return categoriaTemResultados(categoria)
                return !categoriaSelecionada || categoria.nome === categoriaSelecionada
              })
              .map((categoria) => {
                const produtosFiltrados = {
                  ...categoria,
                  produtos: filtrarProdutos(categoria.produtos)
                }

                if (produtosFiltrados.produtos.length === 0) return null

                return (
                  <div key={categoria.nome} className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">{categoria.icone} {categoria.nome}</h3>
                    <TabelaEstoque 
                      categoria={produtosFiltrados}
                      onUpdate={() => {
                        recarregarEstoque()
                        router.refresh()
                      }} 
                    />
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 