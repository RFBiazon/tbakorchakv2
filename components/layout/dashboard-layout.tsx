"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { supabase, updateSupabaseCredentials, getPedidos } from "@/lib/supabase"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Home, 
  Package, 
  Box, 
  DollarSign,
  Menu,
  X
} from "lucide-react"

const menuItems = [
  { 
    name: "Início", 
    href: "/dashboard", 
    icon: Home 
  },
  { 
    name: "Controle de Pedidos", 
    href: "/pedidos", 
    icon: Package 
  },
  { 
    name: "Controle de Estoques", 
    href: "/estoques", 
    icon: Box 
  },
  { 
    name: "Controle Financeiro", 
    href: "/financeiro", 
    icon: DollarSign 
  }
]

interface DashboardStats {
  totalPedidos: number;
  pedidosParaConferir: number;
  pedidosPendentes: number;
  itensPendentes: number;
}

export function useStoreStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const { aConferir, pendentes } = await getPedidos();
        
        // Calcula o total de itens pendentes
        const totalItensPendentes = pendentes.reduce((total, pedido) => {
          return total + (pedido.quantidade_faltante || 0);
        }, 0);

        setStats({
          pedidosParaConferir: aConferir.length,
          pedidosPendentes: pendentes.length,
          itensPendentes: totalItensPendentes,
          totalPedidos: aConferir.length + pendentes.length
        });
        setError(null);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setError('Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [selectedLoja, setSelectedLoja] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  const { stats, loading } = useStoreStats()

  useEffect(() => {
    checkSession()
  }, [router])

  const checkSession = async () => {
    try {
      // Verifica a loja selecionada
      const loja = localStorage.getItem("selectedStore")
      if (!loja) {
        console.log("Nenhuma loja selecionada")
        router.push("/")
        return
      }

      // Atualiza o cliente Supabase com as credenciais da loja
      const supabaseClient = updateSupabaseCredentials(loja)
      
      // Verifica a sessão
      const { data: { session } } = await supabaseClient.auth.getSession()
      if (!session) {
        console.log("Sessão não encontrada")
        router.push("/")
        return
      }

      setSelectedLoja(loja)
    } catch (error) {
      console.error("Erro ao verificar sessão:", error)
      router.push("/")
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem("selectedStore")
      router.push("/")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

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

  return (
    <div className="min-h-screen bg-background">
      {/* Barra superior */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--header-background))]">
        <div className="flex justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-[hsl(var(--header-foreground))]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
            <div className="hidden md:block w-64">
              <Image
                src="/NeoSystemsAI.png"
                alt="NeoSystems Logo"
                width={400}
                height={80}
                className="h-[3.5rem] w-auto"
                priority
              />
            </div>
            <div className="max-w-[200px] md:max-w-none">
              <h1 className="text-sm md:text-xl font-semibold text-[hsl(var(--header-foreground))] truncate">
                Controle de Loja - {getLojaName(selectedLoja)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="outline"
              onClick={handleLogout}
              className="text-foreground hover:text-foreground/80 text-sm md:text-base"
            >
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="flex pt-16">
        {/* Menu lateral */}
        <div className={`${
          isMenuOpen ? 'block' : 'hidden'
        } md:block fixed top-16 left-0 bottom-0 w-64 bg-background border-r border-border overflow-y-auto`}>
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>

        {/* Conteúdo principal */}
        <main className="flex-1 md:ml-64 p-4 md:p-6 max-w-full overflow-x-auto bg-background">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 