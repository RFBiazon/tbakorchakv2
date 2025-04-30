"use client"

import { useState, useMemo, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useEstoque } from "@/hooks/useEstoque"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, ArrowUpDown, FileDown, Printer } from "lucide-react"
import type { ProdutoEstoque } from "@/lib/supabase"

export default function RelatoriosEstoquePage() {
  const { categorias, recarregarEstoque } = useEstoque()
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("")
  const [termoBusca, setTermoBusca] = useState("")
  const [ordenacao, setOrdenacao] = useState<"asc" | "desc">("desc")

  // Recarrega os dados ao montar o componente
  useEffect(() => {
    recarregarEstoque()
  }, [])

  const capitalizarPalavras = (texto: string) => {
    return texto
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
      .join(' ')
  }

  // Combina todos os produtos de todas as categorias
  const todosProdutos = useMemo(() => {
    return categorias
      .filter(categoria => !categoria.loading && !categoria.error) // Filtra categorias com erro ou carregando
      .flatMap(categoria => 
        categoria.produtos.map(produto => ({
          ...produto,
          categoria: categoria.nome,
          icone: categoria.icone,
          item: capitalizarPalavras(produto.item)
        }))
      )
  }, [categorias])

  // Filtra e ordena os produtos
  const produtosFiltrados = useMemo(() => {
    let produtos = [...todosProdutos]

    // Filtra por categoria
    if (categoriaSelecionada && categoriaSelecionada !== "todas") {
      produtos = produtos.filter(p => p.categoria === categoriaSelecionada)
    }

    // Filtra por termo de busca
    if (termoBusca) {
      const termo = termoBusca.toLowerCase()
      produtos = produtos.filter(p => 
        p.item.toLowerCase().includes(termo)
      )
    }

    // Ordena por quantidade
    produtos.sort((a, b) => {
      const estoqueA = a.estoque || 0
      const estoqueB = b.estoque || 0
      return ordenacao === "asc" ? estoqueA - estoqueB : estoqueB - estoqueA
    })

    return produtos
  }, [todosProdutos, categoriaSelecionada, termoBusca, ordenacao])

  const getStatusText = (estoque: number) => {
    if (estoque <= 0) return "Sem Estoque"
    if (estoque <= 5) return "Baixo Estoque"
    return "Em Estoque"
  }

  const getStatusColor = (estoque: number) => {
    if (estoque <= 0) return "text-red-500"
    if (estoque <= 5) return "text-yellow-500"
    return "text-green-500"
  }

  const exportarCSV = () => {
    // Usa todosProdutos se não houver filtros, caso contrário usa produtosFiltrados
    const dadosParaExportar = (!categoriaSelecionada || categoriaSelecionada === "todas") && !termoBusca 
      ? todosProdutos 
      : produtosFiltrados

    // Ordena os dados conforme a ordenação atual
    const dadosOrdenados = [...dadosParaExportar].sort((a, b) => {
      const estoqueA = a.estoque || 0
      const estoqueB = b.estoque || 0
      return ordenacao === "asc" ? estoqueA - estoqueB : estoqueB - estoqueA
    })

    // Prepara os dados para o CSV
    const headers = ["Categoria", "Produto", "Quantidade", "Status"]
    const dados = dadosOrdenados.map(produto => [
      capitalizarPalavras(produto.categoria),
      produto.item,
      produto.estoque || 0,
      getStatusText(produto.estoque || 0)
    ])

    // Cria o conteúdo do CSV
    const csvContent = [
      headers.join(","),
      ...dados.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\\n")

    // Cria o blob e faz o download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
    const nomeArquivo = `relatorio-estoque${categoriaSelecionada && categoriaSelecionada !== "todas" ? '-' + categoriaSelecionada : ''}-${dataAtual}.csv`
    
    link.setAttribute("href", url)
    link.setAttribute("download", nomeArquivo)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const imprimir = () => {
    // Define os dados a serem impressos (todos ou filtrados)
    const dadosParaImprimir = (!categoriaSelecionada || categoriaSelecionada === "todas") && !termoBusca 
      ? todosProdutos 
      : produtosFiltrados

    // Atualiza temporariamente os dados na tabela
    const tabelaAtual = document.querySelector('.tabela-estoque tbody')
    if (tabelaAtual) {
      const conteudoOriginal = tabelaAtual.innerHTML
      
      // Atualiza com todos os dados
      tabelaAtual.innerHTML = dadosParaImprimir
        .sort((a, b) => {
          const estoqueA = a.estoque || 0
          const estoqueB = b.estoque || 0
          return ordenacao === "asc" ? estoqueA - estoqueB : estoqueB - estoqueA
        })
        .map(produto => `
          <tr class="border-b">
            <td class="p-4">
              <div class="flex items-center gap-2">
                ${produto.icone} ${capitalizarPalavras(produto.categoria)}
              </div>
            </td>
            <td class="p-4">${produto.item}</td>
            <td class="text-center p-4">${produto.estoque || 0}</td>
            <td class="text-right p-4 ${getStatusColor(produto.estoque || 0)}">
              ${getStatusText(produto.estoque || 0)}
            </td>
          </tr>
        `).join('')

      // Imprime
      window.print()

      // Restaura o conteúdo original
      tabelaAtual.innerHTML = conteudoOriginal
    } else {
      window.print()
    }
  }

  // Loading state
  const isLoading = categorias.some(cat => cat.loading)
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  const hasError = categorias.some(cat => cat.error)
  if (hasError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-destructive">
          <p>Erro ao carregar dados do estoque.</p>
          <Button 
            variant="outline" 
            onClick={recarregarEstoque}
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-black dark:text-white">Relatório de Estoque</h1>
          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={exportarCSV}
              title="Exportar para CSV"
            >
              <FileDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={imprimir}
              title="Imprimir relatório"
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 print:hidden">
          {/* Filtro por Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={categoriaSelecionada}
              onValueChange={setCategoriaSelecionada}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.nome} value={categoria.nome}>
                    {categoria.icone} {capitalizarPalavras(categoria.nome)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de Busca */}
          <div className="space-y-2">
            <Label>Buscar Produto</Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Digite para buscar..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-8"
              />
              <Search className="h-4 w-4 absolute left-2 top-3 text-muted-foreground" />
            </div>
          </div>

          {/* Botão de Ordenação */}
          <div className="space-y-2">
            <Label>Ordenar por Quantidade</Label>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setOrdenacao(prev => prev === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {ordenacao === "asc" ? "Menor → Maior" : "Maior → Menor"}
            </Button>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="bg-card border border-border rounded-lg print:border-none">
          <div className="overflow-x-auto">
            <table className="w-full tabela-estoque">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Categoria</th>
                  <th className="text-left p-4">Produto</th>
                  <th className="text-center p-4">Quantidade em Estoque</th>
                  <th className="text-right p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((produto) => (
                  <tr key={`${produto.categoria}-${produto.id}`} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {produto.icone} {capitalizarPalavras(produto.categoria)}
                      </div>
                    </td>
                    <td className="p-4">{produto.item}</td>
                    <td className="text-center p-4">{produto.estoque || 0}</td>
                    <td className={`text-right p-4 ${getStatusColor(produto.estoque || 0)}`}>
                      {getStatusText(produto.estoque || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumo */}
          <div className="p-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total de produtos: {produtosFiltrados.length}
              </span>
              <div className="flex gap-4">
                <span className="text-sm text-red-500">
                  Sem estoque: {produtosFiltrados.filter(p => p.estoque <= 0).length}
                </span>
                <span className="text-sm text-yellow-500">
                  Baixo estoque: {produtosFiltrados.filter(p => p.estoque > 0 && p.estoque <= 5).length}
                </span>
                <span className="text-sm text-green-500">
                  Em estoque: {produtosFiltrados.filter(p => p.estoque > 5).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos específicos para impressão */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-4, .print\\:p-4 * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:border-none {
            border: none;
          }
          @page {
            size: auto;
            margin: 20mm;
          }
        }
      `}</style>
    </DashboardLayout>
  )
} 