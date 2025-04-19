"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { type Pedido, getPedidos, arquivarPedido, desarquivarPedido } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Home, Download, Printer, BarChart2 } from "lucide-react"

const getLojaName = (id: string) => {
  const lojas = {
    "toledo01": "Toledo 01",
    "toledo02": "Toledo 02",
    "videira": "Videira",
    "fraiburgo": "Fraiburgo",
    "campomourao": "Campo Mourão"
  }
  return lojas[id as keyof typeof lojas] || id
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

  useEffect(() => {
    const loja = localStorage.getItem("selectedLoja")
    if (loja) {
      setSelectedLoja(loja)
    }
  }, [])

  useEffect(() => {
    carregarPedidos()
  }, [])

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

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white">📦 Lista de Pedidos</h1>
        <Link href="/relatorios" className="text-foreground hover:text-primary text-xl md:text-2xl" title="Ir para relatórios">
          <BarChart2 />
        </Link>
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
                  <span className="text-card-foreground">
                    Pedido <strong>#{pedido.numero}</strong>
                  </span>
                  <Link
                    href={`/pedidos/${pedido.id}?numero=${pedido.numero}`}
                    className="text-[#6D28D9] font-bold hover:underline"
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
                    <span className="text-card-foreground">
                      Pedido <strong>#{pedido.numero}</strong>
                    </span>
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
                          className="text-muted-foreground hover:text-foreground"
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
                      <span className="text-card-foreground">
                        Pedido <strong>#{pedido.numero}</strong>
                      </span>
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
                    className="bg-card border border-border px-4 py-3 rounded flex justify-between items-center opacity-70"
                  >
                    <span className="text-card-foreground">
                      Pedido <strong>#{pedido.numero}</strong>
                    </span>
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/visualizar/${pedido.id}?numero=${pedido.numero}&modo=conferido`}
                        className="text-green-500"
                      >
                        ✅ Conferido
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        Arquivado em: {new Date(pedido.dataArquivamento || "").toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDesarquivar(pedido.id)}
                        className="text-blue-500 hover:text-blue-400"
                        title="Desarquivar"
                      >
                        📤
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
    </>
  )
}
