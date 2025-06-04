"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Filter } from "lucide-react"
import { EmployeesService } from "@/lib/employees-service"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import lojasConfig from '@/lojas.config.json'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { motion, AnimatePresence } from "framer-motion"

export default function RelatoriosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [filteredOcorrencias, setFilteredOcorrencias] = useState<any[]>([])
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    unidade: [] as string[],
    motivo: [] as string[],
    observacao_2: [] as string[],
    observacao_3: [] as string[]
  })
  const [tempFilters, setTempFilters] = useState({
    unidade: [] as string[],
    motivo: [] as string[],
    observacao_2: [] as string[],
    observacao_3: [] as string[]
  })

  useEffect(() => {
    loadEmployees()
  }, [selectedStore])

  useEffect(() => {
    filterOcorrencias()
  }, [employees, dateRange, searchTerm, advancedFilters])

  async function loadEmployees() {
    try {
      setLoading(true)
      // Carrega todos os funcionários inicialmente
      const data = await EmployeesService.getEmployeesByStore("")
      setEmployees(data)
      // Se houver uma unidade selecionada, filtra os funcionários
      if (selectedStore !== "all") {
        const filteredData = data.filter(emp => emp.employee_data.unidade === selectedStore)
        setEmployees(filteredData)
      }
    } catch (err) {
      setError('Erro ao carregar funcionários')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function filterOcorrencias() {
    let ocorrencias: any[] = []

    // Coleta todas as ocorrências dos funcionários
    employees.forEach(employee => {
      if (employee.employee_data.ocorrencias) {
        ocorrencias = ocorrencias.concat(
          employee.employee_data.ocorrencias.map((ocorrencia: any) => ({
            ...ocorrencia,
            funcionario: employee.employee_data.informacoes_pessoais.nome,
            unidade: employee.employee_data.unidade
          }))
        )
      }
    })

    // Filtra por data
    if (dateRange.from || dateRange.to) {
      ocorrencias = ocorrencias.filter(ocorrencia => {
        const ocorrenciaDate = new Date(ocorrencia.data.split('/').reverse().join('-'))
        const from = dateRange.from ? new Date(dateRange.from.setHours(0, 0, 0, 0)) : undefined
        const to = dateRange.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)) : undefined

        if (from && to) {
          return ocorrenciaDate >= from && ocorrenciaDate <= to
        } else if (from) {
          return ocorrenciaDate >= from
        } else if (to) {
          return ocorrenciaDate <= to
        }
        return true
      })
    }

    // Filtra por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      ocorrencias = ocorrencias.filter(ocorrencia => 
        ocorrencia.funcionario.toLowerCase().includes(term) ||
        ocorrencia.tipo.toLowerCase().includes(term) ||
        ocorrencia.ocorrencia.toLowerCase().includes(term) ||
        ocorrencia.motivo.toLowerCase().includes(term)
      )
    }

    // Filtros avançados
    if (advancedFilters.unidade.length > 0) {
      ocorrencias = ocorrencias.filter(ocorrencia => 
        advancedFilters.unidade.includes(ocorrencia.unidade)
      )
    }

    if (advancedFilters.motivo.length > 0) {
      ocorrencias = ocorrencias.filter(ocorrencia => 
        advancedFilters.motivo.includes(ocorrencia.motivo)
      )
    }

    if (advancedFilters.observacao_2.length > 0) {
      ocorrencias = ocorrencias.filter(ocorrencia => 
        ocorrencia.observacao_2 && advancedFilters.observacao_2.includes(ocorrencia.observacao_2)
      )
    }

    if (advancedFilters.observacao_3.length > 0) {
      ocorrencias = ocorrencias.filter(ocorrencia => 
        ocorrencia.observacao_3 && advancedFilters.observacao_3.includes(ocorrencia.observacao_3)
      )
    }

    // Ordena por data (mais recente primeiro)
    ocorrencias.sort((a, b) => {
      const dateA = new Date(a.data.split('/').reverse().join('-'))
      const dateB = new Date(b.data.split('/').reverse().join('-'))
      return dateB.getTime() - dateA.getTime()
    })

    setFilteredOcorrencias(ocorrencias)
  }

  function generateReport() {
    const report = filteredOcorrencias.map(ocorrencia => ({
      data: ocorrencia.data,
      funcionario: ocorrencia.funcionario,
      unidade: ocorrencia.unidade,
      tipo: ocorrencia.tipo,
      cidade: ocorrencia.cidade,
      ocorrencia: ocorrencia.ocorrencia,
      motivo: ocorrencia.motivo,
      observacao_2: ocorrencia.observacao_2 || '',
      observacao_3: ocorrencia.observacao_3 || ''
    }))

    const csvContent = [
      ['Data', 'Funcionário', 'Unidade', 'Tipo', 'Cidade', 'Ocorrência', 'Motivo', 'Observação 2', 'Observação 3'],
      ...report.map(r => [
        r.data,
        r.funcionario,
        r.unidade,
        r.tipo,
        r.cidade,
        r.ocorrencia,
        r.motivo,
        r.observacao_2,
        r.observacao_3
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_ocorrencias_${format(new Date(), 'dd-MM-yyyy')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function getStoreName(storeId: string) {
    const store = lojasConfig.find(loja => loja.idInterno === storeId)
    return store ? store.nomeExibicao : storeId
  }

  function handleDateRangeChange(range: { from: Date | undefined; to: Date | undefined } | undefined) {
    if (range) {
      setDateRange(range)
      // Se tiver selecionado tanto a data inicial quanto a final, fecha o calendário após 1 segundo
      if (range.from && range.to) {
        setTimeout(() => {
          setIsCalendarOpen(false)
        }, 1000)
      }
    } else {
      setDateRange({ from: undefined, to: undefined })
    }
  }

  // Coleta valores únicos para os filtros
  const unidades = Array.from(new Set(filteredOcorrencias.map(o => o.unidade)))
  const motivos = Array.from(new Set(filteredOcorrencias.map(o => o.motivo)))
  const observacoes2 = Array.from(new Set(filteredOcorrencias.filter(o => o.observacao_2).map(o => o.observacao_2)))
  const observacoes3 = Array.from(new Set(filteredOcorrencias.filter(o => o.observacao_3).map(o => o.observacao_3)))

  function applyFilters() {
    setAdvancedFilters(tempFilters)
  }

  function clearFilters() {
    setDateRange({ from: undefined, to: undefined })
    setSelectedStore("all")
    setSearchTerm("")
    setAdvancedFilters({
      unidade: [],
      motivo: [],
      observacao_2: [],
      observacao_3: []
    })
    setTempFilters({
      unidade: [],
      motivo: [],
      observacao_2: [],
      observacao_3: []
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <div>Carregando...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <h2 className="text-xl font-bold text-red-500">{error}</h2>
          <Button className="mt-4" onClick={() => router.push('/gestao-rh')}>Voltar</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/gestao-rh')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold">Relatório de Ocorrências</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtros</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {filterOpen ? "Ocultar Filtros" : "Mostrar Filtros"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateRange({ from: undefined, to: undefined })
                    setSelectedStore("all")
                    setSearchTerm("")
                    setAdvancedFilters({
                      unidade: [],
                      motivo: [],
                      observacao_2: [],
                      observacao_3: []
                    })
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Unidade</Label>
                <Select
                  value={selectedStore}
                  onValueChange={setSelectedStore}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {Array.from(new Set(employees.map(emp => emp.employee_data.unidade))).map(unidade => (
                      <SelectItem key={unidade} value={unidade}>{getStoreName(unidade)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Período</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                        )
                      ) : (
                        "Selecione o período"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Buscar</Label>
                <Input
                  placeholder="Buscar por funcionário, tipo ou ocorrência..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {unidades.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Unidade</h3>
                          <div className="space-y-2">
                            {unidades.map(unidade => (
                              <div key={unidade} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`unidade-${unidade}`}
                                  checked={tempFilters.unidade.includes(unidade)}
                                  onCheckedChange={(checked) => {
                                    setTempFilters(prev => ({
                                      ...prev,
                                      unidade: checked
                                        ? [...prev.unidade, unidade]
                                        : prev.unidade.filter(u => u !== unidade)
                                    }))
                                  }}
                                />
                                <label
                                  htmlFor={`unidade-${unidade}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {getStoreName(unidade)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {motivos.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Motivo</h3>
                          <div className="space-y-2">
                            {motivos.map(motivo => (
                              <div key={motivo} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`motivo-${motivo}`}
                                  checked={tempFilters.motivo.includes(motivo)}
                                  onCheckedChange={(checked) => {
                                    setTempFilters(prev => ({
                                      ...prev,
                                      motivo: checked
                                        ? [...prev.motivo, motivo]
                                        : prev.motivo.filter(m => m !== motivo)
                                    }))
                                  }}
                                />
                                <label
                                  htmlFor={`motivo-${motivo}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {motivo}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {observacoes2.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Observação 2</h3>
                          <div className="space-y-2">
                            {observacoes2.map(obs => (
                              <div key={obs} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`obs2-${obs}`}
                                  checked={tempFilters.observacao_2.includes(obs)}
                                  onCheckedChange={(checked) => {
                                    setTempFilters(prev => ({
                                      ...prev,
                                      observacao_2: checked
                                        ? [...prev.observacao_2, obs]
                                        : prev.observacao_2.filter(o => o !== obs)
                                    }))
                                  }}
                                />
                                <label
                                  htmlFor={`obs2-${obs}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {obs}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {observacoes3.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Observação 3</h3>
                          <div className="space-y-2">
                            {observacoes3.map(obs => (
                              <div key={obs} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`obs3-${obs}`}
                                  checked={tempFilters.observacao_3.includes(obs)}
                                  onCheckedChange={(checked) => {
                                    setTempFilters(prev => ({
                                      ...prev,
                                      observacao_3: checked
                                        ? [...prev.observacao_3, obs]
                                        : prev.observacao_3.filter(o => o !== obs)
                                    }))
                                  }}
                                />
                                <label
                                  htmlFor={`obs3-${obs}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {obs}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={clearFilters}>
                        Limpar Filtros
                      </Button>
                      <Button onClick={applyFilters}>
                        Aplicar Filtros
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ocorrências ({filteredOcorrencias.length})</CardTitle>
              <Button onClick={generateReport}>
                <Download className="w-4 h-4 mr-2" /> Exportar Relatório
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Ocorrência</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOcorrencias.map((ocorrencia, index) => (
                  <TableRow key={index}>
                    <TableCell>{ocorrencia.data}</TableCell>
                    <TableCell>{ocorrencia.funcionario}</TableCell>
                    <TableCell>{getStoreName(ocorrencia.unidade)}</TableCell>
                    <TableCell>{ocorrencia.tipo}</TableCell>
                    <TableCell>{ocorrencia.cidade}</TableCell>
                    <TableCell>{ocorrencia.ocorrencia}</TableCell>
                    <TableCell>{ocorrencia.motivo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 