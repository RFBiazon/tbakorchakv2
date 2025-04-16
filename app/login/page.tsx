'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeProvider } from 'next-themes'

const lojas = [
  { id: 'toledo01', nome: 'Toledo 01' },
  { id: 'toledo02', nome: 'Toledo 02' },
  { id: 'videira', nome: 'Videira' },
  { id: 'fraiburgo', nome: 'Fraiburgo' },
  { id: 'campomourao', nome: 'Campo Mourão' }
]

export default function LoginPage() {
  const router = useRouter()
  const [selectedLoja, setSelectedLoja] = useState('')

  useEffect(() => {
    // Força o tema escuro
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
    document.body.classList.add('dark')
  }, [])

  const handleLojaSelect = (value: string) => {
    setSelectedLoja(value)
    localStorage.setItem('selectedLoja', value)
    router.push('/')
  }

  return (
    <ThemeProvider forcedTheme="dark">
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Controle de Pedidos</h1>
            <p className="mt-2 text-white">Selecione a loja para continuar</p>
          </div>
          <div className="space-y-4">
            <Select onValueChange={handleLojaSelect}>
              <SelectTrigger className="w-full">
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
        </div>
      </div>
    </ThemeProvider>
  )
} 