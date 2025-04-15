"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

const lojas = [
  { id: "toledo01", nome: "Toledo 01", email: "toledo01@neosystems.ai" },
  { id: "toledo02", nome: "Toledo 02", email: "toledo02@neosystems.ai" },
  { id: "videira", nome: "Videira", email: "videira@neosystems.ai" },
  { id: "fraiburgo", nome: "Fraiburgo", email: "fraiburgo@neosystems.ai" },
  { id: "campomourao", nome: "Campo Mourão", email: "campomourao@neosystems.ai" }
]

export function LoginForm() {
  const [loja, setLoja] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Atualiza o email automaticamente quando a loja é selecionada
  useEffect(() => {
    if (loja) {
      const selectedLoja = lojas.find(l => l.id === loja)
      if (selectedLoja) {
        setEmail(selectedLoja.email)
      }
    }
  }, [loja])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!loja) {
      setError("Por favor, selecione uma loja")
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Erro de login:", error)
        setError("Email ou senha inválidos")
        return
      }

      if (data.user) {
        localStorage.setItem("selectedLoja", loja)
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err)
      setError("Erro ao tentar fazer login")
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg shadow-lg border border-border">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Controle de Loja</h2>
        <p className="mt-2 text-muted-foreground">Selecione sua loja e faça login</p>
      </div>

      <form onSubmit={handleLogin} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="loja" className="text-foreground">Loja</Label>
            <Select value={loja} onValueChange={setLoja}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {lojas.map((loja) => (
                  <SelectItem key={loja.id} value={loja.id}>
                    {loja.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background border-input text-foreground"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background border-input text-foreground"
            />
          </div>
        </div>

        {error && (
          <div className="text-destructive text-sm text-center">{error}</div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-[hsl(var(--conferir))] hover:bg-[hsl(var(--conferir))/90] text-white"
        >
          Entrar
        </Button>
      </form>
    </div>
  )
} 