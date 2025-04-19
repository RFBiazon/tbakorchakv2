"use client"

import { useState, useEffect } from "react"
import { getPedidos } from "@/lib/supabase"

interface DashboardStats {
  totalPedidos: number
  pedidosParaConferir: number
  pedidosPendentes: number
  itensPendentes: number
}

export function useStoreStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const { aConferir, pendentes } = await getPedidos()
        
        // Calcula o total de itens pendentes
        const totalItensPendentes = pendentes.reduce((total, pedido) => {
          return total + (pedido.quantidade_faltante || 0)
        }, 0)

        setStats({
          pedidosParaConferir: aConferir.length,
          pedidosPendentes: pendentes.length,
          itensPendentes: totalItensPendentes,
          totalPedidos: aConferir.length + pendentes.length
        })
        setError(null)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        setError('Erro ao carregar estatísticas')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
    const interval = setInterval(loadStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { stats, loading, error }
} 