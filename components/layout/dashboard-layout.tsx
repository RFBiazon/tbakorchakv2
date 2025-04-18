"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { supabase, updateSupabaseCredentials } from "@/lib/supabase"
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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [selectedLoja, setSelectedLoja] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
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
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-[hsl(var(--header-foreground))] ml-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
            <div className="hidden md:block w-64 pl-2">
              <Image
                src="/NeoSystemsAI.png"
                alt="NeoSystems Logo"
                width={400}
                height={80}
                className="h-[3.5rem] w-auto"
                priority
              />
            </div>
            <div className="px-4">
              <h1 className="text-xl font-semibold text-[hsl(var(--header-foreground))] truncate">
                Controle de Loja - {getLojaName(selectedLoja)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 mr-4">
            <ThemeToggle />
            <Button 
              variant="outline"
              onClick={handleLogout}
              className="text-foreground hover:text-foreground/80"
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