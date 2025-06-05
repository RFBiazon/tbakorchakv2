"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EmployeeFullCard } from "@/components/rh/employee-full-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, Plus, Pencil, Download, Trash2 } from "lucide-react"
import { EmployeesService } from "@/lib/employees-service"
import lojasConfig from '../../lojas.config.json'
import { useSelectedStore } from "@/hooks/useSelectedStore"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

const lojas = lojasConfig.map(loja => ({ id: loja.idInterno, nome: loja.nomeExibicao }))

export default function GestaoRH() {
  const router = useRouter()
  const { selectedStore, updateSelectedStore } = useSelectedStore()
  const [tab, setTab] = useState("ativos")
  const [search, setSearch] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState({
    situacao: [] as string[],
    departamento: [] as string[],
    cargo: [] as string[],
    necessitaVT: undefined as boolean | undefined,
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null)
  const [employeeDriveLinks, setEmployeeDriveLinks] = useState<Record<string, string>>({})

  useEffect(() => {
    if (selectedStore) {
      loadEmployees()
    }
  }, [selectedStore])

  async function loadEmployees() {
    try {
      setLoading(true)
      const data = await EmployeesService.getEmployeesByStore(selectedStore)
      setEmployees(data)
      
      // Load drive links from employees data
      const driveLinks: Record<string, string> = {}
      data.forEach(emp => {
        if (emp.drive_link) {
          driveLinks[emp.id] = emp.drive_link
        }
      })
      setEmployeeDriveLinks(driveLinks)
    } catch (err) {
      setError('Erro ao carregar funcionários')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDriveLinkUpdate = async (employeeId: string, driveLink: string) => {
    try {
      // Update the drive link in the database
      await EmployeesService.updateEmployee(employeeId, { drive_link: driveLink })
      
      // Update local state
      setEmployeeDriveLinks(prev => ({
        ...prev,
        [employeeId]: driveLink
      }))
    } catch (err) {
      console.error('Error updating drive link:', err)
      toast.error('Erro ao atualizar link do Google Drive')
    }
  }

  // Filtro por busca e filtros compostos
  let filteredEmployees = employees
  if (search) {
    filteredEmployees = filteredEmployees.filter(emp =>
      emp.employee_data.nome.toLowerCase().includes(search.toLowerCase()) ||
      emp.employee_data.informacoes_pessoais.cpf?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employee_data.dados_registro.cargo_funcao.toLowerCase().includes(search.toLowerCase()) ||
      emp.employee_data.dados_registro.departamento.toLowerCase().includes(search.toLowerCase())
    )
  }
  if (filter.situacao.length > 0) {
    filteredEmployees = filteredEmployees.filter(emp => filter.situacao.includes(emp.employee_data.informacoes_pessoais.situacao))
  }
  if (filter.departamento.length > 0) {
    filteredEmployees = filteredEmployees.filter(emp => filter.departamento.includes(emp.employee_data.dados_registro.departamento))
  }
  if (filter.cargo.length > 0) {
    filteredEmployees = filteredEmployees.filter(emp => filter.cargo.includes(emp.employee_data.dados_registro.cargo_funcao))
  }
  if (filter.necessitaVT !== undefined) {
    filteredEmployees = filteredEmployees.filter(emp => emp.employee_data.informacoes_pessoais.necessita_vale_transporte === filter.necessitaVT)
  }

  const ativos = filteredEmployees.filter(emp => emp.employee_data.informacoes_pessoais.situacao === "ATIVO")
  const inativos = filteredEmployees.filter(emp => ["INATIVO", "DESLIGADO"].includes(emp.employee_data.informacoes_pessoais.situacao))
  const ferias = filteredEmployees.filter(emp => emp.employee_data.informacoes_pessoais.situacao === "FÉRIAS")

  const departamentos = Array.from(new Set(employees.map(e => e.employee_data.dados_registro.departamento)))
  const cargos = Array.from(new Set(employees.map(e => e.employee_data.dados_registro.cargo_funcao)))

  async function handleDeleteEmployee(id: string) {
    try {
      await EmployeesService.deleteEmployee(id)
      await loadEmployees()
      toast.success("Funcionário excluído com sucesso")
      setShowDeleteDialog(false)
      setEmployeeToDelete(null)
    } catch (err) {
      toast.error("Erro ao excluir funcionário")
      console.error(err)
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Gestão de RH</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/gestao-rh/relatorios')}>
              <Download className="w-4 h-4 mr-2" /> Relatórios
            </Button>
            <Button onClick={() => router.push('/gestao-rh/novo')}>
              <Plus className="w-4 h-4 mr-2" /> Novo Colaborador
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Select value={selectedStore} onValueChange={updateSelectedStore}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione uma unidade" />
            </SelectTrigger>
            <SelectContent>
              {lojas.map(loja => (
                <SelectItem key={loja.id} value={loja.id}>{loja.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-[280px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário, CPF, cargo..."
                className="pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex gap-2"><Filter className="w-4 h-4" />Filtros</Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros Avançados</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                  <div>
                    <div className="font-semibold mb-2">Situação</div>
                    {["ATIVO", "INATIVO", "DESLIGADO", "FÉRIAS"].map(sit => (
                      <div key={sit} className="flex items-center gap-2 mb-1">
                        <Checkbox
                          checked={filter.situacao.includes(sit)}
                          onCheckedChange={v => setFilter(f => ({ ...f, situacao: v ? [...f.situacao, sit] : f.situacao.filter(s => s !== sit) }))}
                          id={`sit-${sit}`}
                        />
                        <label htmlFor={`sit-${sit}`}>{sit}</label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Departamento</div>
                    {departamentos.map(dep => (
                      <div key={dep} className="flex items-center gap-2 mb-1">
                        <Checkbox
                          checked={filter.departamento.includes(dep)}
                          onCheckedChange={v => setFilter(f => ({ ...f, departamento: v ? [...f.departamento, dep] : f.departamento.filter(d => d !== dep) }))}
                          id={`dep-${dep}`}
                        />
                        <label htmlFor={`dep-${dep}`}>{dep}</label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Cargo/Função</div>
                    {cargos.map(cargo => (
                      <div key={cargo} className="flex items-center gap-2 mb-1">
                        <Checkbox
                          checked={filter.cargo.includes(cargo)}
                          onCheckedChange={v => setFilter(f => ({ ...f, cargo: v ? [...f.cargo, cargo] : f.cargo.filter(c => c !== cargo) }))}
                          id={`cargo-${cargo}`}
                        />
                        <label htmlFor={`cargo-${cargo}`}>{cargo}</label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Necessita VT</div>
                    <div className="flex items-center gap-2 mb-1">
                      <Checkbox
                        checked={filter.necessitaVT === true}
                        onCheckedChange={v => setFilter(f => ({ ...f, necessitaVT: v ? true : f.necessitaVT === false ? undefined : false }))}
                        id="vt-sim"
                      />
                      <label htmlFor="vt-sim">Sim</label>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Checkbox
                        checked={filter.necessitaVT === false}
                        onCheckedChange={v => setFilter(f => ({ ...f, necessitaVT: v ? false : f.necessitaVT === true ? undefined : true }))}
                        id="vt-nao"
                      />
                      <label htmlFor="vt-nao">Não</label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setFilter({ situacao: [], departamento: [], cargo: [], necessitaVT: undefined })}>Limpar filtros</Button>
                  <Button variant="default" onClick={() => setFilterOpen(false)}>Aplicar filtros</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        {loading ? (
          <div>Carregando...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
              <TabsTrigger value="ativos">Ativos ({ativos.length})</TabsTrigger>
              <TabsTrigger value="inativos">Inativos ({inativos.length})</TabsTrigger>
              <TabsTrigger value="ferias">Em Férias ({ferias.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="ativos">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ativos.map(emp => (
                <div key={emp.id} className="relative">
                  <EmployeeFullCard 
                    employee={emp.employee_data} 
                    employeeId={emp.id}
                    driveLink={employeeDriveLinks[emp.id]}
                    onDriveLinkUpdate={(link) => handleDriveLinkUpdate(emp.id, link)}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/gestao-rh/${emp.id}`)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setEmployeeToDelete(emp.id)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="inativos">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inativos.map(emp => (
                <div key={emp.id} className="relative">
                  <EmployeeFullCard 
                    employee={emp.employee_data} 
                    employeeId={emp.id}
                    driveLink={employeeDriveLinks[emp.id]}
                    onDriveLinkUpdate={(link) => handleDriveLinkUpdate(emp.id, link)}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/gestao-rh/${emp.id}`)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setEmployeeToDelete(emp.id)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="ferias">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ferias.map(emp => (
                <div key={emp.id} className="relative">
                  <EmployeeFullCard 
                    employee={emp.employee_data} 
                    employeeId={emp.id}
                    driveLink={employeeDriveLinks[emp.id]}
                    onDriveLinkUpdate={(link) => handleDriveLinkUpdate(emp.id, link)}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/gestao-rh/${emp.id}`)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setEmployeeToDelete(emp.id)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false)
              setEmployeeToDelete(null)
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => employeeToDelete && handleDeleteEmployee(employeeToDelete)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
} 