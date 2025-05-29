"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { updateSupabaseCredentials, getPedidos, getSupabaseClient } from "@/lib/supabase"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Home, 
  Package, 
  Box, 
  DollarSign,
  Menu,
  X,
  ShoppingCart,
  LogOut,
  Settings,
  BarChart3,
  Users,
  PackageSearch,
  FileText,
  CheckSquare,
  Archive,
  AlertTriangle,
  Truck,
  Building,
  ChevronDown
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import lojasConfigData from '../../lojas.config.json';

interface LojaConfig {
  idInterno: string;
  nomeExibicao: string;
  idApi: string;
  supabaseUrlEnvVar: string;
  supabaseKeyEnvVar: string;
}

interface MenuItem {
  name: string;
  href?: string;
  icon: any;
  submenu?: MenuItem[];
}

const lojasConfig: LojaConfig[] = lojasConfigData;

const menuItems: MenuItem[] = [
  { 
    name: "Início", 
    href: "/dashboard", 
    icon: Home 
  },
  { 
    name: "Controle de Pedidos", 
    icon: Package,
    submenu: [
      { 
        name: "Amadelli", 
        href: "/pedidos", 
        icon: Package 
      },
      { 
        name: "Demais Fornecedores", 
        href: "/pedidos-fornecedores", 
        icon: Package 
      }
    ]
  },
  { 
    name: "Controle de Estoques", 
    href: "/estoques", 
    icon: Box 
  },
  { 
    name: "Controle Financeiro", 
    icon: DollarSign,
    submenu: [
      { 
        name: "Dashboard", 
        href: "/financeiro", 
        icon: BarChart3 
      },
      { 
        name: "Controle de Caixa", 
        href: "/controle-caixa", 
        icon: DollarSign 
      },
      { 
        name: "Faturamento", 
        href: "/faturamento", 
        icon: FileText 
      }
    ]
  },
  { 
    name: "Central de Compras", 
    href: "/compras", 
    icon: ShoppingCart 
  }
]

interface DashboardStats {
  totalPedidos: number;
  pedidosParaConferir: number;
  pedidosPendentes: number;
  itensPendentes: number;
}

export function useDashboardStatsHook() {
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
  
  const { stats, loading } = useDashboardStatsHook()

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
      await getSupabaseClient().auth.signOut()
      localStorage.removeItem("selectedStore")
      router.push("/")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const getLojaName = (idInterno: string) => {
    const loja = lojasConfig.find((l: LojaConfig) => l.idInterno === idInterno);
    return loja ? loja.nomeExibicao : idInterno;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <div className="flex-1 max-w-[300px] md:max-w-none">
              <div className="flex flex-col">
                <h1 className="text-xs md:text-sm font-medium text-[hsl(var(--header-foreground))]/70 uppercase tracking-wider">
                  Sistema de Gerenciamento de Lojas
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-px w-6 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                  <span className="text-sm md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {selectedLoja ? getLojaName(selectedLoja) : "Carregando Loja..."}
                  </span>
                </div>
              </div>
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

      <div className="flex pt-16 flex-1 pb-16">
        {/* Menu lateral */}
        <div className={`${
          isMenuOpen ? 'block' : 'hidden'
        } md:block fixed top-16 left-0 bottom-16 w-64 bg-background border-r border-border overflow-y-auto`}>
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const hasSubmenu = item.submenu && item.submenu.length > 0
                
                // Verifica se algum item do submenu está ativo
                const isSubmenuActive = hasSubmenu && item.submenu && item.submenu.some((subItem: MenuItem) => pathname === subItem.href)
                const isActive = pathname === item.href || isSubmenuActive

                if (hasSubmenu && item.submenu) {
                  return (
                    <div key={item.name}>
                      <div className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                      }`}>
                        <Icon
                          className={`mr-3 h-5 w-5 ${
                            isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                          }`}
                        />
                        {item.name}
                      </div>
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem: MenuItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = pathname === subItem.href
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href || '#'}
                              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                isSubActive
                                  ? 'bg-accent text-accent-foreground'
                                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                              }`}
                            >
                              <SubIcon
                                className={`mr-3 h-4 w-4 ${
                                  isSubActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                                }`}
                              />
                              {subItem.name}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <Link
                      key={item.name}
                      href={item.href || '#'}
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
                }
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

      {/* Rodapé Global Fixo */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-[4rem] px-4 md:px-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="h-px w-6 md:w-8 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <span className="text-sm md:text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              © 2025 NeoSystemsAI
            </span>
            <span className="text-xs md:text-sm text-muted-foreground/80 whitespace-nowrap">
              Todos os direitos reservados.
            </span>
            <div className="h-px w-6 md:w-8 bg-gradient-to-r from-purple-600 to-blue-500"></div>
          </div>
        </div>
      </footer>
    </div>
  )
} 