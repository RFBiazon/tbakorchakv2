'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeProvider } from 'next-themes'

const lojas = [
  { id: 'toledo01', nome: 'Toledo 01' },
  { id: 'toledo02', nome: 'Toledo 02' },
  { id: 'toledo03', nome: 'Toledo 03' },
  { id: 'toledo04', nome: 'Toledo 04' },
  { id: 'toledo05', nome: 'Toledo 05' },
  { id: 'toledo06', nome: 'Toledo 06' },
  { id: 'toledo07', nome: 'Toledo 07' },
  { id: 'toledo08', nome: 'Toledo 08' },
  { id: 'toledo09', nome: 'Toledo 09' },
  { id: 'toledo10', nome: 'Toledo 10' },
  { id: 'toledo11', nome: 'Toledo 11' },
  { id: 'toledo12', nome: 'Toledo 12' },
  { id: 'toledo13', nome: 'Toledo 13' },
  { id: 'toledo14', nome: 'Toledo 14' },
  { id: 'toledo15', nome: 'Toledo 15' },
  { id: 'toledo16', nome: 'Toledo 16' },
  { id: 'toledo17', nome: 'Toledo 17' },
  { id: 'toledo18', nome: 'Toledo 18' },
  { id: 'toledo19', nome: 'Toledo 19' },
  { id: 'toledo20', nome: 'Toledo 20' },
  { id: 'toledo21', nome: 'Toledo 21' },
  { id: 'toledo22', nome: 'Toledo 22' },
  { id: 'toledo23', nome: 'Toledo 23' },
  { id: 'toledo24', nome: 'Toledo 24' },
  { id: 'toledo25', nome: 'Toledo 25' },
  { id: 'toledo26', nome: 'Toledo 26' },
  { id: 'toledo27', nome: 'Toledo 27' },
  { id: 'toledo28', nome: 'Toledo 28' },
  { id: 'toledo29', nome: 'Toledo 29' },
  { id: 'toledo30', nome: 'Toledo 30' },
  { id: 'toledo31', nome: 'Toledo 31' },
  { id: 'toledo32', nome: 'Toledo 32' },
  { id: 'toledo33', nome: 'Toledo 33' },
  { id: 'toledo34', nome: 'Toledo 34' },
  { id: 'toledo35', nome: 'Toledo 35' },
  { id: 'toledo36', nome: 'Toledo 36' },
  { id: 'toledo37', nome: 'Toledo 37' },
  { id: 'toledo38', nome: 'Toledo 38' },
  { id: 'toledo39', nome: 'Toledo 39' },
  { id: 'toledo40', nome: 'Toledo 40' },
  { id: 'toledo41', nome: 'Toledo 41' },
  { id: 'toledo42', nome: 'Toledo 42' },
  { id: 'toledo43', nome: 'Toledo 43' },
  { id: 'toledo44', nome: 'Toledo 44' },
  { id: 'toledo45', nome: 'Toledo 45' },
  { id: 'toledo46', nome: 'Toledo 46' },
  { id: 'toledo47', nome: 'Toledo 47' },
  { id: 'toledo48', nome: 'Toledo 48' },
  { id: 'toledo49', nome: 'Toledo 49' },
  { id: 'toledo50', nome: 'Toledo 50' },
  { id: 'toledo51', nome: 'Toledo 51' },
  { id: 'toledo52', nome: 'Toledo 52' },
  { id: 'toledo53', nome: 'Toledo 53' },
  { id: 'toledo54', nome: 'Toledo 54' },
  { id: 'toledo55', nome: 'Toledo 55' },
  { id: 'toledo56', nome: 'Toledo 56' },
  { id: 'toledo57', nome: 'Toledo 57' },
  { id: 'toledo58', nome: 'Toledo 58' },
  { id: 'toledo59', nome: 'Toledo 59' },
  { id: 'toledo60', nome: 'Toledo 60' },
  { id: 'toledo61', nome: 'Toledo 61' },
  { id: 'toledo62', nome: 'Toledo 62' },
  { id: 'toledo63', nome: 'Toledo 63' },
  { id: 'toledo64', nome: 'Toledo 64' },
  { id: 'toledo65', nome: 'Toledo 65' },
  { id: 'toledo66', nome: 'Toledo 66' },
  { id: 'toledo67', nome: 'Toledo 67' },
  { id: 'toledo68', nome: 'Toledo 68' },
  { id: 'toledo69', nome: 'Toledo 69' },
  { id: 'toledo70', nome: 'Toledo 70' },
  { id: 'toledo71', nome: 'Toledo 71' },
  { id: 'toledo72', nome: 'Toledo 72' },
  { id: 'toledo73', nome: 'Toledo 73' },
  { id: 'toledo74', nome: 'Toledo 74' },
  { id: 'toledo75', nome: 'Toledo 75' },
  { id: 'toledo76', nome: 'Toledo 76' },
  { id: 'toledo77', nome: 'Toledo 77' },
  { id: 'toledo78', nome: 'Toledo 78' },
  { id: 'toledo79', nome: 'Toledo 79' },
  { id: 'toledo80', nome: 'Toledo 80' },
  { id: 'toledo81', nome: 'Toledo 81' },
  { id: 'toledo82', nome: 'Toledo 82' },
  { id: 'toledo83', nome: 'Toledo 83' },
  { id: 'toledo84', nome: 'Toledo 84' },
  { id: 'toledo85', nome: 'Toledo 85' },
  { id: 'toledo86', nome: 'Toledo 86' },
  { id: 'toledo87', nome: 'Toledo 87' },
  { id: 'toledo88', nome: 'Toledo 88' },
  { id: 'toledo89', nome: 'Toledo 89' },
  { id: 'toledo90', nome: 'Toledo 90' },
  { id: 'toledo91', nome: 'Toledo 91' },
  { id: 'toledo92', nome: 'Toledo 92' },
  { id: 'toledo93', nome: 'Toledo 93' },
  { id: 'toledo94', nome: 'Toledo 94' },
  { id: 'toledo95', nome: 'Toledo 95' },
  { id: 'toledo96', nome: 'Toledo 96' },
  { id: 'toledo97', nome: 'Toledo 97' },
  { id: 'toledo98', nome: 'Toledo 98' },
  { id: 'toledo99', nome: 'Toledo 99' },
  { id: 'toledo100', nome: 'Toledo 100' },
  { id: 'toledo101', nome: 'Toledo 101' },
  { id: 'toledo102', nome: 'Toledo 102' },
  { id: 'toledo103', nome: 'Toledo 103' },
  { id: 'toledo104', nome: 'Toledo 104' },
  { id: 'toledo105', nome: 'Toledo 105' },
  { id: 'toledo106', nome: 'Toledo 106' },
  { id: 'toledo107', nome: 'Toledo 107' },
  { id: 'toledo108', nome: 'Toledo 108' },
  { id: 'toledo109', nome: 'Toledo 109' },
  { id: 'toledo110', nome: 'Toledo 110' },
  { id: 'toledo111', nome: 'Toledo 111' },
  { id: 'toledo112', nome: 'Toledo 112' },
  { id: 'toledo113', nome: 'Toledo 113' },
  { id: 'toledo114', nome: 'Toledo 114' },
  { id: 'toledo115', nome: 'Toledo 115' },
  { id: 'toledo116', nome: 'Toledo 116' },
  { id: 'toledo117', nome: 'Toledo 117' },
  { id: 'toledo118', nome: 'Toledo 118' },
  { id: 'toledo119', nome: 'Toledo 119' },
  { id: 'toledo120', nome: 'Toledo 120' },
  { id: 'toledo121', nome: 'Toledo 121' },
  { id: 'toledo122', nome: 'Toledo 122' },
  { id: 'toledo123', nome: 'Toledo 123' },
  { id: 'toledo124', nome: 'Toledo 124' },
  { id: 'toledo125', nome: 'Toledo 125' },
  { id: 'toledo126', nome: 'Toledo 126' },
  { id: 'toledo127', nome: 'Toledo 127' },
  { id: 'toledo128', nome: 'Toledo 128' },
  { id: 'toledo129', nome: 'Toledo 129' },
  { id: 'toledo130', nome: 'Toledo 130' },
  { id: 'toledo131', nome: 'Toledo 131' },
  { id: 'toledo132', nome: 'Toledo 132' },
  { id: 'toledo133', nome: 'Toledo 133' },
  { id: 'toledo134', nome: 'Toledo 134' },
  { id: 'toledo135', nome: 'Toledo 135' },
  { id: 'toledo136', nome: 'Toledo 136' },
  { id: 'toledo137', nome: 'Toledo 137' },
  { id: 'toledo138', nome: 'Toledo 138' },
  { id: 'toledo139', nome: 'Toledo 139' },
  { id: 'toledo140', nome: 'Toledo 140' },
  { id: 'toledo141', nome: 'Toledo 141' },
  { id: 'toledo142', nome: 'Toledo 142' },
  { id: 'toledo143', nome: 'Toledo 143' },
  { id: 'toledo144', nome: 'Toledo 144' },
  { id: 'toledo145', nome: 'Toledo 145' },
  { id: 'toledo146', nome: 'Toledo 146' },
  { id: 'toledo147', nome: 'Toledo 147' },
  { id: 'toledo148', nome: 'Toledo 148' },
  { id: 'toledo149', nome: 'Toledo 149' },
  { id: 'toledo150', nome: 'Toledo 150' },
  { id: 'toledo151', nome: 'Toledo 151' },
  { id: 'toledo152', nome: 'Toledo 152' },
  { id: 'toledo153', nome: 'Toledo 153' },
  { id: 'toledo154', nome: 'Toledo 154' },
  { id: 'toledo155', nome: 'Toledo 155' },
  { id: 'toledo156', nome: 'Toledo 156' },
  { id: 'toledo157', nome: 'Toledo 157' },
  { id: 'toledo158', nome: 'Toledo 158' },
  { id: 'toledo159', nome: 'Toledo 159' },
  { id: 'toledo160', nome: 'Toledo 160' },
  { id: 'toledo161', nome: 'Toledo 161' },
  { id: 'toledo162', nome: 'Toledo 162' },
  { id: 'toledo163', nome: 'Toledo 163' },
  { id: 'toledo164', nome: 'Toledo 164' },
  { id: 'toledo165', nome: 'Toledo 165' },
  { id: 'toledo166', nome: 'Toledo 166' },
  { id: 'toledo167', nome: 'Toledo 167' },
  { id: 'toledo168', nome: 'Toledo 168' },
  { id: 'toledo169', nome: 'Toledo 169' },
  { id: 'toledo170', nome: 'Toledo 170' },
  { id: 'toledo171', nome: 'Toledo 171' },
  { id: 'toledo172', nome: 'Toledo 172' },
  { id: 'toledo173', nome: 'Toledo 173' },
  { id: 'toledo174', nome: 'Toledo 174' },
  { id: 'toledo175', nome: 'Toledo 175' },
  { id: 'toledo176', nome: 'Toledo 176' },
  { id: 'toledo177', nome: 'Toledo 177' },
  { id: 'toledo178', nome: 'Toledo 178' },
  { id: 'toledo179', nome: 'Toledo 179' },
  { id: 'toledo180', nome: 'Toledo 180' },
  { id: 'toledo181', nome: 'Toledo 181' },
  { id: 'toledo182', nome: 'Toledo 182' },
  { id: 'toledo183', nome: 'Toledo 183' },
  { id: 'toledo184', nome: 'Toledo 184' },
  { id: 'toledo185', nome: 'Toledo 185' },
  { id: 'toledo186', nome: 'Toledo 186' },
  { id: 'toledo187', nome: 'Toledo 187' },
  { id: 'toledo188', nome: 'Toledo 188' },
  { id: 'toledo189', nome: 'Toledo 189' },
  { id: 'toledo190', nome: 'Toledo 190' },
  { id: 'toledo191', nome: 'Toledo 191' },
  { id: 'toledo192', nome: 'Toledo 192' },
  { id: 'toledo193', nome: 'Toledo 193' },
  { id: 'toledo194', nome: 'Toledo 194' },
  { id: 'toledo195', nome: 'Toledo 195' },
  { id: 'toledo196', nome: 'Toledo 196' },
  { id: 'toledo197', nome: 'Toledo 197' },
  { id: 'toledo198', nome: 'Toledo 198' },
  { id: 'toledo199', nome: 'Toledo 199' },
  { id: 'toledo200', nome: 'Toledo 200' },
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
              <SelectTrigger className="w-full text-white">
                <SelectValue placeholder="Selecione uma loja" className="text-white" />
              </SelectTrigger>
              <SelectContent>
                {lojas.map((loja) => (
                  <SelectItem key={loja.id} value={loja.id} className="text-white">
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