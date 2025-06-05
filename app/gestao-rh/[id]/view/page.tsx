"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { EmployeeCadastro } from "@/components/rh/employee-full-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Plus, Download, Trash2, UploadCloud, CheckCircle, Circle, Link as LinkIcon } from "lucide-react"
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
import { MultiFileUpload } from '@/components/rh/multi-file-upload'
import { OcorrenciaModal, Ocorrencia } from '@/components/rh/ocorrencia-modal'

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
  const [checklist, setChecklist] = useState<Record<string, string>>({})

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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="profissionais">Dados Profissionais</TabsTrigger>
            <TabsTrigger value="declaracoes">Declarações</TabsTrigger>
            <TabsTrigger value="bancarios">Dados Bancários</TabsTrigger>
            <TabsTrigger value="uniformes">Uniformes</TabsTrigger>
            <TabsTrigger value="estrangeiro">Estrangeiro</TabsTrigger>
            <TabsTrigger value="upload">Upload de Documentos</TabsTrigger>
            <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
          </TabsList>

          <TabsContent value="pessoais">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nome</Label><div>{employee.employee_data.informacoes_pessoais.nome}</div></div>
                <div><Label>CPF</Label><div>{employee.employee_data.informacoes_pessoais.cpf}</div></div>
                <div><Label>RG</Label><div>{employee.employee_data.informacoes_pessoais.rg}</div></div>
                <div><Label>CTPS</Label><div>{employee.employee_data.informacoes_pessoais.ctps}</div></div>
                <div><Label>Email</Label><div>{employee.employee_data.informacoes_pessoais.email}</div></div>
                <div><Label>Celular</Label><div>{employee.employee_data.informacoes_pessoais.celular}</div></div>
                <div><Label>PIS/NIS</Label><div>{employee.employee_data.informacoes_pessoais.pis_nis}</div></div>
                <div><Label>Órgão Emissor RG</Label><div>{employee.employee_data.informacoes_pessoais.orgao_emissor_rg}</div></div>
                <div><Label>Data de Nascimento</Label><div>{employee.employee_data.informacoes_pessoais.data_nascimento}</div></div>
                <div><Label>Nome da Mãe</Label><div>{employee.employee_data.informacoes_pessoais.nome_mae}</div></div>
                <div><Label>Nome do Pai</Label><div>{employee.employee_data.informacoes_pessoais.nome_pai}</div></div>
                <div><Label>Cidade de Nascimento</Label><div>{employee.employee_data.informacoes_pessoais.cidade_nascimento}</div></div>
                <div><Label>Celular de Parente</Label><div>{employee.employee_data.informacoes_pessoais.celular_parente}</div></div>
                <div><Label>Quantidade de Filhos até 14 anos</Label><div>{employee.employee_data.informacoes_pessoais.quant_filhos_ate_14}</div></div>
                <div><Label>Necessita Vale Transporte</Label><div>{employee.employee_data.informacoes_pessoais.necessita_vale_transporte ? 'Sim' : 'Não'}</div></div>
                <div className="col-span-2"><Label>Endereço</Label><div>{employee.employee_data.informacoes_pessoais.endereco.logradouro}, {employee.employee_data.informacoes_pessoais.endereco.cidade} - {employee.employee_data.informacoes_pessoais.endereco.estado}, CEP: {employee.employee_data.informacoes_pessoais.endereco.cep}</div></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profissionais">
            <Card>
              <CardHeader>
                <CardTitle>Dados Profissionais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Cargo/Função</Label><div>{employee.employee_data.dados_registro.cargo_funcao}</div></div>
                <div><Label>Departamento</Label><div>{employee.employee_data.dados_registro.departamento}</div></div>
                <div><Label>Turno</Label><div>{employee.employee_data.dados_registro.turno}</div></div>
                <div><Label>Salário</Label><div>{employee.employee_data.dados_registro.salario}</div></div>
                <div><Label>Carga Horária</Label><div>{employee.employee_data.dados_registro.carga_horaria}</div></div>
                <div><Label>Data de Contratação</Label><div>{employee.employee_data.dados_registro.data_contratacao}</div></div>
                <div><Label>Descanso Semanal</Label><div>{employee.employee_data.dados_registro.descanso_semanal}</div></div>
                <div><Label>Data do Exame Admissional</Label><div>{employee.employee_data.dados_registro.data_exame_admissional}</div></div>
                <div><Label>Número Registro eSocial</Label><div>{employee.employee_data.dados_registro.numero_registro_esocial}</div></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="declaracoes">
            <Card>
              <CardHeader>
                <CardTitle>Declarações</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>EPIS</Label><div>{employee.employee_data.declaracoes_enviadas.epis}</div></div>
                <div><Label>Chave</Label><div>{employee.employee_data.declaracoes_enviadas.chave}</div></div>
                <div><Label>Uniforme</Label><div>{employee.employee_data.declaracoes_enviadas.uniforme}</div></div>
                <div><Label>Vale Transporte</Label><div>{employee.employee_data.declaracoes_enviadas.vale_transporte}</div></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bancarios">
            <Card>
              <CardHeader>
                <CardTitle>Dados Bancários</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>PIX</Label><div>{employee.employee_data.dados_bancarios.pix}</div></div>
                <div><Label>Banco</Label><div>{employee.employee_data.dados_bancarios.banco}</div></div>
                <div><Label>Conta</Label><div>{employee.employee_data.dados_bancarios.conta}</div></div>
                <div><Label>Agência</Label><div>{employee.employee_data.dados_bancarios.agencia}</div></div>
                <div><Label>Tipo de Conta</Label><div>{employee.employee_data.dados_bancarios.tipo_conta}</div></div>
                <div><Label>Número do Banco</Label><div>{employee.employee_data.dados_bancarios.numero_banco}</div></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uniformes">
            <Card>
              <CardHeader>
                <CardTitle>Uniformes</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Camiseta</Label><div>{employee.employee_data.tamanhos_uniformes.camiseta}</div></div>
                <div><Label>Calça</Label><div>{employee.employee_data.tamanhos_uniformes.calca}</div></div>
                <div><Label>Luva</Label><div>{employee.employee_data.tamanhos_uniformes.luva}</div></div>
                <div><Label>Bota/Sapato</Label><div>{employee.employee_data.tamanhos_uniformes.bota_sapato}</div></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estrangeiro">
            <Card>
              <CardHeader>
                <CardTitle>Estrangeiro</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Cor</Label><div>{employee.employee_data.informacoes_estrangeiro.cor}</div></div>
                <div><Label>Peso</Label><div>{employee.employee_data.informacoes_estrangeiro.peso}</div></div>
                <div><Label>Olhos</Label><div>{employee.employee_data.informacoes_estrangeiro.olhos}</div></div>
                <div><Label>Altura</Label><div>{employee.employee_data.informacoes_estrangeiro.altura}</div></div>
                <div><Label>Sinais</Label><div>{employee.employee_data.informacoes_estrangeiro.sinais}</div></div>
                <div><Label>Cabelos</Label><div>{employee.employee_data.informacoes_estrangeiro.cabelos}</div></div>
                <div><Label>Naturalizado</Label><div>{employee.employee_data.informacoes_estrangeiro.naturalizado}</div></div>
                <div><Label>Nome do Cônjuge</Label><div>{employee.employee_data.informacoes_estrangeiro.nome_conjuge}</div></div>
                <div><Label>Cartão Modelo 19</Label><div>{employee.employee_data.informacoes_estrangeiro.cartao_modelo_19}</div></div>
                <div><Label>Data de Chegada ao Brasil</Label><div>{employee.employee_data.informacoes_estrangeiro.data_chegada_brasil}</div></div>
                <div><Label>Casado com Brasileiro(a)</Label><div>{employee.employee_data.informacoes_estrangeiro.casado_com_brasileiro}</div></div>
                <div><Label>Número Registro Cartório</Label><div>{employee.employee_data.informacoes_estrangeiro.numero_registro_cartorio}</div></div>
                <div><Label>Quantidade de Filhos no Brasil</Label><div>{employee.employee_data.informacoes_estrangeiro.quantidade_filhos_brasil}</div></div>
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
                  <MultiFileUpload
                    employeeId={id}
                    employeeName={employee.employee_data.informacoes_pessoais.nome}
                    driveLink={employee.drive_link}
                    onUploadComplete={async (link: string) => {
                      await EmployeesService.updateEmployee(id, { drive_link: link })
                      employee.drive_link = link
                    }}
                    renderChecklist={setChecklist}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Checklist de Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tiposDocumentos.map(doc => (
                      <li key={doc.value} className="flex items-center gap-2">
                        {checklist && checklist[doc.value] ? (
                          <span className="text-green-500">●</span>
                        ) : (
                          <span className="text-muted-foreground">○</span>
                        )}
                        <span>{doc.label}</span>
                        {checklist && checklist[doc.value] && (
                          <a href={checklist[doc.value]} target="_blank" rel="noopener noreferrer" className="ml-2" title="Abrir documento">
                            <LinkIcon className="w-4 h-4 text-blue-500 hover:text-blue-700" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
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
        </Tabs>
      </div>

      <OcorrenciaModal
        open={showOcorrenciaModal || showEditOcorrenciaModal}
        onOpenChange={open => {
          setShowOcorrenciaModal(open);
          setShowEditOcorrenciaModal(open);
        }}
        ocorrencia={novaOcorrencia}
        setOcorrencia={setNovaOcorrencia}
        onSave={ocorrenciaToEdit !== null ? handleSaveEditOcorrencia : handleAddOcorrencia}
        isEditing={ocorrenciaToEdit !== null}
      />

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
    </DashboardLayout>
  )
} 