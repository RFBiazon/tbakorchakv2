"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { EmployeeCadastro } from "@/components/rh/employee-full-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Plus, Download, Trash2, UploadCloud, CheckCircle, Circle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EmployeesService, EmployeeData } from "@/lib/employees-service"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import lojasConfig from '@/lojas.config.json'

const lojas = lojasConfig.map(loja => ({ 
  id: loja.idInterno, 
  nome: loja.nomeExibicao 
}))

const tiposDocumentos = [
  { value: "rg", label: "RG" },
  { value: "cpf", label: "CPF" },
  { value: "habilitacao", label: "Habilitação" },
  { value: "comprovante_residencia", label: "Comprovante de Residência" },
  { value: "ctps", label: "CTPS" },
  { value: "nis", label: "NIS" },
  { value: "foto_3x4", label: "Foto 3x4" },
  { value: "documentos_filhos_menores_14", label: "Documentos dos Filhos < 14" },
  { value: "exame_admissional", label: "Exame Admissional" },
  { value: "carteirinha_vacinacao", label: "Carteirinha de Vacinação" }
]

export default function EmployeeViewPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employee, setEmployee] = useState<any>(null)
  const [tab, setTab] = useState("pessoais")
  const [showOcorrenciaModal, setShowOcorrenciaModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [ocorrenciaToDelete, setOcorrenciaToDelete] = useState<number | null>(null)
  const [showEditOcorrenciaModal, setShowEditOcorrenciaModal] = useState(false)
  const [ocorrenciaToEdit, setOcorrenciaToEdit] = useState<number | null>(null)
  const [novaOcorrencia, setNovaOcorrencia] = useState({
    codigo: 101,
    tipo: "Medida Disciplinar",
    data: new Date().toLocaleDateString('pt-BR'),
    cidade: "",
    ocorrencia: "",
    motivo: "",
    observacao_2: "",
    observacao_3: ""
  })
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    loadEmployee()
  }, [id])

  async function loadEmployee() {
    try {
      setLoading(true)
      const data = await EmployeesService.getEmployeeById(id)
      setEmployee(data)
    } catch (err) {
      setError('Erro ao carregar funcionário')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddOcorrencia() {
    try {
      const novasOcorrencias = [...(employee.employee_data.ocorrencias || []), novaOcorrencia]
      await EmployeesService.updateEmployee(id, { ...employee.employee_data, ocorrencias: novasOcorrencias })
      await loadEmployee()
      setShowOcorrenciaModal(false)
      setNovaOcorrencia({
        codigo: 101,
        tipo: "Medida Disciplinar",
        data: new Date().toLocaleDateString('pt-BR'),
        cidade: "",
        ocorrencia: "",
        motivo: "",
        observacao_2: "",
        observacao_3: ""
      })
      toast.success("Ocorrência adicionada com sucesso")
    } catch (err) {
      toast.error("Erro ao adicionar ocorrência")
      console.error(err)
    }
  }

  async function handleUpdateOcorrencia(index: number, field: string, value: any) {
    try {
      const novasOcorrencias = [...(employee.employee_data.ocorrencias || [])]
      novasOcorrencias[index] = { ...novasOcorrencias[index], [field]: value }
      await EmployeesService.updateEmployee(id, { ...employee.employee_data, ocorrencias: novasOcorrencias })
      await loadEmployee()
    } catch (err) {
      toast.error("Erro ao atualizar ocorrência")
      console.error(err)
    }
  }

  async function handleDeleteOcorrencia(index: number) {
    try {
      const novasOcorrencias = employee.employee_data.ocorrencias.filter((_: any, i: number) => i !== index)
      await EmployeesService.updateEmployee(id, { ...employee.employee_data, ocorrencias: novasOcorrencias })
      await loadEmployee()
      toast.success("Ocorrência removida com sucesso")
      setShowDeleteDialog(false)
      setOcorrenciaToDelete(null)
    } catch (err) {
      toast.error("Erro ao remover ocorrência")
      console.error(err)
    }
  }

  async function handleEditOcorrencia(index: number) {
    try {
      const ocorrencia = employee.employee_data.ocorrencias[index]
      setNovaOcorrencia(ocorrencia)
      setOcorrenciaToEdit(index)
      setShowEditOcorrenciaModal(true)
    } catch (err) {
      toast.error("Erro ao editar ocorrência")
      console.error(err)
    }
  }

  async function handleSaveEditOcorrencia() {
    try {
      const novasOcorrencias = [...(employee.employee_data.ocorrencias || [])]
      novasOcorrencias[ocorrenciaToEdit!] = novaOcorrencia
      await EmployeesService.updateEmployee(id, { ...employee.employee_data, ocorrencias: novasOcorrencias })
      await loadEmployee()
      setShowEditOcorrenciaModal(false)
      setOcorrenciaToEdit(null)
      setNovaOcorrencia({
        codigo: 101,
        tipo: "Medida Disciplinar",
        data: new Date().toLocaleDateString('pt-BR'),
        cidade: "",
        ocorrencia: "",
        motivo: "",
        observacao_2: "",
        observacao_3: ""
      })
      toast.success("Ocorrência editada com sucesso")
    } catch (err) {
      toast.error("Erro ao editar ocorrência")
      console.error(err)
    }
  }

  function filterOcorrencias(ocorrencias: any[]) {
    if (!dateRange.from && !dateRange.to) return ocorrencias

    return ocorrencias.filter(ocorrencia => {
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

  function generateReport() {
    const filteredOcorrencias = filterOcorrencias(employee.employee_data.ocorrencias || [])
    const report = filteredOcorrencias.map(ocorrencia => ({
      data: ocorrencia.data,
      tipo: ocorrencia.tipo,
      cidade: ocorrencia.cidade,
      ocorrencia: ocorrencia.ocorrencia,
      motivo: ocorrencia.motivo,
      observacao_2: ocorrencia.observacao_2 || '',
      observacao_3: ocorrencia.observacao_3 || ''
    }))

    const csvContent = [
      ['Data', 'Tipo', 'Cidade', 'Ocorrência', 'Motivo', 'Observação 2', 'Observação 3'],
      ...report.map(r => [
        r.data,
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
    link.setAttribute('download', `ocorrencias_${employee.employee_data.informacoes_pessoais.nome}_${format(new Date(), 'dd-MM-yyyy')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function getStoreName(storeId: string) {
    return lojas.find(loja => loja.id === storeId)?.nome || storeId
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const newDocs = files.map(file => ({ file, tipo: "" }))
    setUploadedDocs(prev => [...prev, ...newDocs])
  }

  function handleTipoChange(index: number, tipo: string) {
    setUploadedDocs(prev => prev.map((doc, i) => i === index ? { ...doc, tipo } : doc))
  }

  function handleRemoveDoc(index: number) {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files || [])
    const newDocs = files.map(file => ({ file, tipo: "" }))
    setUploadedDocs(prev => [...prev, ...newDocs])
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
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

  if (error || !employee) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <h2 className="text-xl font-bold text-red-500">{error || 'Colaborador não encontrado.'}</h2>
          <Button className="mt-4" onClick={() => router.push('/gestao-rh')}>Voltar para a lista</Button>
        </div>
      </DashboardLayout>
    )
  }

  const form = employee.employee_data

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/gestao-rh')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Colaborador</h1>
          <Button 
            variant="outline" 
            className="ml-auto"
            onClick={() => router.push(`/gestao-rh/${id}`)}
          >
            <Pencil className="w-4 h-4 mr-2" /> Editar
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="profissionais">Dados Profissionais</TabsTrigger>
            <TabsTrigger value="declaracoes">Declarações</TabsTrigger>
            <TabsTrigger value="bancarios">Dados Bancários</TabsTrigger>
            <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
            <TabsTrigger value="upload">Upload de Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="pessoais">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Nome</div>
                  <div>{form.informacoes_pessoais.nome}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Situação</div>
                  <div>{form.informacoes_pessoais.situacao}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Data de Nascimento</div>
                  <div>{form.informacoes_pessoais.data_nascimento}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">CPF</div>
                  <div>{form.informacoes_pessoais.cpf}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">RG</div>
                  <div>{form.informacoes_pessoais.rg}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Órgão Emissor RG</div>
                  <div>{form.informacoes_pessoais.orgao_emissor_rg}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">CTPS</div>
                  <div>{form.informacoes_pessoais.ctps}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">PIS/NIS</div>
                  <div>{form.informacoes_pessoais.pis_nis}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Celular</div>
                  <div>{form.informacoes_pessoais.celular}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div>{form.informacoes_pessoais.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Nome do Pai</div>
                  <div>{form.informacoes_pessoais.nome_pai}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Nome da Mãe</div>
                  <div>{form.informacoes_pessoais.nome_mae}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Cidade de Nascimento</div>
                  <div>{form.informacoes_pessoais.cidade_nascimento}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Necessita Vale Transporte</div>
                  <div>{form.informacoes_pessoais.necessita_vale_transporte ? "Sim" : "Não"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Quantidade de Filhos até 14 anos</div>
                  <div>{form.informacoes_pessoais.quant_filhos_ate_14}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Celular de Parente</div>
                  <div>{form.informacoes_pessoais.celular_parente}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Endereço</div>
                  <div>{form.informacoes_pessoais.endereco.logradouro}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Cidade</div>
                  <div>{form.informacoes_pessoais.endereco.cidade}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Estado</div>
                  <div>{form.informacoes_pessoais.endereco.estado}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">CEP</div>
                  <div>{form.informacoes_pessoais.endereco.cep}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profissionais">
            <Card>
              <CardHeader>
                <CardTitle>Dados Profissionais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Unidade</div>
                  <div>{getStoreName(form.unidade)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Razão Social</div>
                  <div>{form.razao_social}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">CNPJ</div>
                  <div>{form.cnpj}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Cargo/Função</div>
                  <div>{form.dados_registro.cargo_funcao}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Departamento</div>
                  <div>{form.dados_registro.departamento}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Data Contratação</div>
                  <div>{form.dados_registro.data_contratacao}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Turno</div>
                  <div>{form.dados_registro.turno}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Carga Horária</div>
                  <div>{form.dados_registro.carga_horaria}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Descanso Semanal</div>
                  <div>{form.dados_registro.descanso_semanal}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Salário</div>
                  <div>{form.dados_registro.salario}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Data Exame Admissional</div>
                  <div>{form.dados_registro.data_exame_admissional}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="declaracoes">
            <Card>
              <CardHeader>
                <CardTitle>Declarações</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(form.declaracoes_enviadas || {}).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-sm font-medium text-muted-foreground">{key.replace(/_/g, ' ')}</div>
                    <div>{String(value)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bancarios">
            <Card>
              <CardHeader>
                <CardTitle>Dados Bancários</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(form.dados_bancarios || {}).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-sm font-medium text-muted-foreground">{key.replace(/_/g, ' ')}</div>
                    <div>{String(value)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ocorrencias">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ocorrências</CardTitle>
                  <Button onClick={() => setShowOcorrenciaModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Ocorrência
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(form.ocorrencias || [])
                    .sort((a: any, b: any) => {
                      const dateA = new Date(a.data.split('/').reverse().join('-'))
                      const dateB = new Date(b.data.split('/').reverse().join('-'))
                      return dateB.getTime() - dateA.getTime()
                    })
                    .map((ocorrencia: any, index: number) => (
                    <Card key={index} className="overflow-hidden">
                      <details className="group">
                        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-medium text-muted-foreground">{ocorrencia.data}</div>
                            <div className="font-medium">{ocorrencia.tipo}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={(e) => {
                                e.preventDefault()
                                handleEditOcorrencia(index)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.preventDefault()
                                setOcorrenciaToDelete(index)
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="text-muted-foreground group-open:rotate-180 transition-transform">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </div>
                        </summary>
                        <div className="p-4 pt-0 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">Cidade</div>
                              <div>{ocorrencia.cidade}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">Ocorrência</div>
                              <div>{ocorrencia.ocorrencia}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-sm font-medium text-muted-foreground">Motivo</div>
                              <div>{ocorrencia.motivo}</div>
                            </div>
                            {ocorrencia.observacao_2 && (
                              <div className="col-span-2">
                                <div className="text-sm font-medium text-muted-foreground">Observação 2</div>
                                <div>{ocorrencia.observacao_2}</div>
                              </div>
                            )}
                            {ocorrencia.observacao_3 && (
                              <div className="col-span-2">
                                <div className="text-sm font-medium text-muted-foreground">Observação 3</div>
                                <div>{ocorrencia.observacao_3}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </details>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <div className="mt-4 grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 mb-6 transition-colors ${dragActive ? 'border-primary bg-muted' : 'border-muted'}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ cursor: 'pointer' }}
                  >
                    <UploadCloud className="w-12 h-12 mb-2 text-muted-foreground" />
                    <div className="font-medium">Clique ou arraste arquivos aqui</div>
                    <div className="text-xs text-muted-foreground">Suporta arquivos PDF, JPEG, PNG</div>
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>
                  {uploadedDocs.length > 0 && (
                    <>
                      <div className="flex gap-2 mb-2 justify-end">
                        <Button variant="destructive" size="sm" onClick={() => setUploadedDocs([])}>
                          Excluir Todos
                        </Button>
                        <Button variant="default" size="sm" onClick={() => {/* lógica de envio aqui */}}>
                          Enviar
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {uploadedDocs.map((doc, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-12 items-center gap-2 bg-muted/40 rounded px-2 py-2"
                            style={{ minHeight: 48 }}
                          >
                            <span className="truncate col-span-5 text-sm text-muted-foreground" title={doc.file.name}>
                              {doc.file.name}
                            </span>
                            <div className="col-span-5">
                              <Select value={doc.tipo} onValueChange={tipo => handleTipoChange(idx, tipo)}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Tipo de Documento" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tiposDocumentos.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveDoc(idx)}>
                                Remover
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Checklist de Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tiposDocumentos.map(doc => {
                      // Considera anexado se já existe no documentos_em_anexo ou está na fila de upload
                      const anexado = (employee.employee_data.documentos_em_anexo?.[doc.value] && employee.employee_data.documentos_em_anexo[doc.value] !== 'N/A') || uploadedDocs.some(d => d.tipo === doc.value)
                      return (
                        <li key={doc.value} className="flex items-center gap-2">
                          {anexado ? (
                            <CheckCircle className="text-green-500 w-5 h-5" />
                          ) : (
                            <Circle className="text-muted-foreground w-5 h-5" />
                          )}
                          <span>{doc.label}</span>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showOcorrenciaModal} onOpenChange={setShowOcorrenciaModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Ocorrência</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label>Tipo de Ocorrência</Label>
              <Select
                value={novaOcorrencia.codigo.toString()}
                onValueChange={(value) => {
                  const tipo = {
                    "101": "Medida Disciplinar",
                    "102": "Ocorrência",
                    "103": "Ajuste Salarial",
                    "104": "Adicional/Bônus",
                    "105": "Alteração de função",
                    "106": "Furo de Caixa"
                  }[value] || "";
                  setNovaOcorrencia(prev => ({
                    ...prev,
                    codigo: parseInt(value),
                    tipo: tipo
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="101">Medida Disciplinar</SelectItem>
                  <SelectItem value="102">Ocorrência</SelectItem>
                  <SelectItem value="103">Ajuste Salarial</SelectItem>
                  <SelectItem value="104">Adicional/Bônus</SelectItem>
                  <SelectItem value="105">Alteração de função</SelectItem>
                  <SelectItem value="106">Furo de Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={novaOcorrencia.data.split('/').reverse().join('-')}
                onChange={(e) => {
                  const data = new Date(e.target.value).toLocaleDateString('pt-BR')
                  setNovaOcorrencia(prev => ({ ...prev, data }))
                }}
              />
            </div>

            <div>
              <Label>Cidade</Label>
              <Input
                value={novaOcorrencia.cidade}
                onChange={(e) => setNovaOcorrencia(prev => ({ ...prev, cidade: e.target.value }))}
              />
            </div>

            <div>
              <Label>Ocorrência</Label>
              <Input
                value={novaOcorrencia.ocorrencia}
                onChange={(e) => setNovaOcorrencia(prev => ({ ...prev, ocorrencia: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <Label>Motivo</Label>
              <Textarea
                value={novaOcorrencia.motivo}
                onChange={(e) => setNovaOcorrencia(prev => ({ ...prev, motivo: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <Label>Observação 2</Label>
              <Textarea
                value={novaOcorrencia.observacao_2}
                onChange={(e) => setNovaOcorrencia(prev => ({ ...prev, observacao_2: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <Label>Observação 3</Label>
              <Textarea
                value={novaOcorrencia.observacao_3}
                onChange={(e) => setNovaOcorrencia(prev => ({ ...prev, observacao_3: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOcorrenciaModal(false)}>Cancelar</Button>
            <Button onClick={handleAddOcorrencia}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false)
              setOcorrenciaToDelete(null)
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => ocorrenciaToDelete !== null && handleDeleteOcorrencia(ocorrenciaToDelete)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditOcorrenciaModal} onOpenChange={setShowEditOcorrenciaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ocorrência</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label>Tipo de Ocorrência</Label>
              <Select
                value={novaOcorrencia.codigo.toString()}
                onValueChange={(value) => {
                  const tipo = {
                    "101": "Medida Disciplinar",
                    "102": "Ocorrência",
                    "103": "Ajuste Salarial",
                    "104": "Adicional/Bônus",
                    "105": "Alteração de função",
                    "106": "Furo de Caixa"
                  }[value] || "";
                  setNovaOcorrencia(prev => ({
                    ...prev,
                    codigo: parseInt(value),
                    tipo: tipo
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="101">Medida Disciplinar</SelectItem>
                  <SelectItem value="102">Ocorrência</SelectItem>
                  <SelectItem value="103">Ajuste Salarial</SelectItem>
                  <SelectItem value="104">Adicional/Bônus</SelectItem>
                  <SelectItem value="105">Alteração de função</SelectItem>
                  <SelectItem value="106">Furo de Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={novaOcorrencia.data.split('/').reverse().join('-')}
                onChange={e => {
                  const data = new Date(e.target.value).toLocaleDateString('pt-BR')
                  setNovaOcorrencia(prev => ({ ...prev, data }))
                }}
              />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input
                value={novaOcorrencia.cidade}
                onChange={e => setNovaOcorrencia({ ...novaOcorrencia, cidade: e.target.value })}
              />
            </div>
            <div>
              <Label>Ocorrência</Label>
              <Input
                value={novaOcorrencia.ocorrencia}
                onChange={e => setNovaOcorrencia({ ...novaOcorrencia, ocorrencia: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Motivo</Label>
              <Textarea
                value={novaOcorrencia.motivo}
                onChange={e => setNovaOcorrencia({ ...novaOcorrencia, motivo: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Observação 2</Label>
              <Textarea
                value={novaOcorrencia.observacao_2}
                onChange={e => setNovaOcorrencia({ ...novaOcorrencia, observacao_2: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Observação 3</Label>
              <Textarea
                value={novaOcorrencia.observacao_3}
                onChange={e => setNovaOcorrencia({ ...novaOcorrencia, observacao_3: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditOcorrenciaModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveEditOcorrencia}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
} 