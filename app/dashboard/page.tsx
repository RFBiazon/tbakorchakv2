"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Box, DollarSign, AlertCircle, CheckCircle2, AlertTriangle, FileStack } from "lucide-react"
import { useStoreStats } from "@/hooks/useStoreStats"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"

export default function DashboardPage() {
  const { stats, loading } = useStoreStats();
  const [totalDocuments, setTotalDocuments] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTotalDocuments() {
      try {
        const supabase = getSupabaseClient();
        const { count, error } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true });

        if (error) throw error;
        setTotalDocuments(count);
      } catch (error) {
        console.error("Erro ao contar documentos:", error);
      }
    }

    fetchTotalDocuments();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">Dashboard</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/pedidos?filter=aConferir" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:border-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pedidos para Conferir
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats?.pedidosParaConferir || 0}</div>
                <p className="text-xs text-muted-foreground">
                  pedidos aguardando conferência
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pedidos?filter=pendentes" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:border-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pedidos Pendentes
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats?.pedidosPendentes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  pedidos com pendências
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/relatorios" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:border-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Itens Pendentes
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{stats?.itensPendentes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  itens com pendências
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pedidos" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:border-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Pedidos
                </CardTitle>
                <FileStack className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{totalDocuments !== null ? totalDocuments : "Carregando..."}</div>
                <p className="text-xs text-muted-foreground">
                  pedidos ativos
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/pedidos" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:border-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Controle de Pedidos
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Pedidos em andamento
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/estoques" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:border-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Controle de Estoques
                </CardTitle>
                <Box className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Itens em estoque
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/financeiro" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:border-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  💵 Controle Financeiro
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">
                  Saldo atual
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
} 