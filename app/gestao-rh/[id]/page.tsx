"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { EmployeeCadastro } from "@/components/rh/employee-full-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UploadCloud, CheckCircle, Circle, Plus, Pencil, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EmployeesService } from "@/lib/employees-service"
import lojasConfig from '../../../lojas.config.json'
import { useSelectedStore } from "@/hooks/useSelectedStore"
import { MultiFileUpload } from '@/components/rh/multi-file-upload'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { OcorrenciaModal, Ocorrencia } from '@/components/rh/ocorrencia-modal'

const lojas = lojasConfig.map(loja => ({ id: loja.idInterno, nome: loja.nomeExibicao }))

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

export default function EmployeeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { selectedStore } = useSelectedStore()
  const lojaAtual = lojasConfig.find(loja => loja.idInterno === selectedStore)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employee, setEmployee] = useState<any>(null)
  const [tab, setTab] = useState("pessoais")
  const [form, setForm] = useState<EmployeeCadastro | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<{ file: File; tipo: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [checklist, setChecklist] = useState<Record<string, string>>({})
  const [showOcorrenciaModal, setShowOcorrenciaModal] = useState(false)
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
  const [ocorrenciaToEdit, setOcorrenciaToEdit] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadEmployee()
  }, [id])

  useEffect(() => {
    if (lojaAtual && form) {
      setForm(prev => prev ? ({
        ...prev,
        unidade: lojaAtual.idInterno,
        razao_social: lojaAtual.nome,
        cnpj: lojaAtual.cnpj
      }) : prev)
    }
  }, [selectedStore])

  async function loadEmployee() {
    try {
      setLoading(true)
      const data = await EmployeesService.getEmployeeById(id)
      setEmployee(data)
      setForm(data.employee_data)
      console.log('=== Shape Comparison ===')
      console.log('Banco employee_data:', JSON.stringify(data.employee_data, null, 2))
      console.log('Dados bancários do banco:', JSON.stringify(data.employee_data.dados_bancarios, null, 2))
      console.log('Form após setForm:', JSON.stringify(form, null, 2))
    } catch (err) {
      setError('Erro ao carregar funcionário')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form) return;
    try {
      await EmployeesService.updateEmployee(id, form)
      await loadEmployee()
      setShowEditModal(false)
      toast.success('Colaborador atualizado com sucesso!')
      router.push(`/gestao-rh/${id}/view`)
    } catch (err) {
      toast.error('Erro ao atualizar colaborador')
      console.error(err)
    }
  }

  function updateForm(path: string, value: any) {
    setForm(prev => {
      if (!prev) return prev
      const keys = path.split('.')
      let obj: any = { ...prev }
      let ref = obj
      for (let i = 0; i < keys.length - 1; i++) {
        ref[keys[i]] = { ...ref[keys[i]] }
        ref = ref[keys[i]]
      }
      ref[keys[keys.length - 1]] = value
      return obj
    })
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

  async function handleAddOcorrencia() {
    if (!form) return;
    try {
      const novasOcorrencias = [...(form.ocorrencias || []), novaOcorrencia];
      await EmployeesService.updateEmployee(id, { ...form, ocorrencias: novasOcorrencias });
      setForm(prev => prev ? { ...prev, ocorrencias: novasOcorrencias } : prev);
      setShowOcorrenciaModal(false);
      setNovaOcorrencia({
        codigo: 101,
        tipo: "Medida Disciplinar",
        data: new Date().toLocaleDateString('pt-BR'),
        cidade: "",
        ocorrencia: "",
        motivo: "",
        observacao_2: "",
        observacao_3: ""
      });
    } catch (err) {
      // Tratar erro
    }
  }

  function handleEditOcorrencia(index: number) {
    if (!form || !form.ocorrencias) return;
    const ocorrencia = form.ocorrencias[index];
    setOcorrenciaToEdit(index);
    setNovaOcorrencia({
      codigo: ocorrencia.codigo,
      tipo: 'tipo' in ocorrencia ? (ocorrencia as any).tipo || '' : '',
      data: ocorrencia.data,
      cidade: ocorrencia.cidade,
      ocorrencia: ocorrencia.ocorrencia,
      motivo: ocorrencia.motivo,
      observacao_2: ocorrencia.observacao_2 || '',
      observacao_3: ocorrencia.observacao_3 || '',
    });
    setShowOcorrenciaModal(true);
  }

  async function handleSaveEditOcorrencia() {
    if (!form || ocorrenciaToEdit === null) return;
    try {
      const novasOcorrencias = [...(form.ocorrencias || [])];
      novasOcorrencias[ocorrenciaToEdit] = novaOcorrencia;
      await EmployeesService.updateEmployee(id, { ...form, ocorrencias: novasOcorrencias });
      setForm(prev => prev ? { ...prev, ocorrencias: novasOcorrencias } : prev);
      setShowOcorrenciaModal(false);
      setOcorrenciaToEdit(null);
      setNovaOcorrencia({
        codigo: 101,
        tipo: "Medida Disciplinar",
        data: new Date().toLocaleDateString('pt-BR'),
        cidade: "",
        ocorrencia: "",
        motivo: "",
        observacao_2: "",
        observacao_3: ""
      });
    } catch (err) {
      // Tratar erro
    }
  }

  async function handleDeleteOcorrencia(index: number) {
    if (!form || !form.ocorrencias) return;
    try {
      const novasOcorrencias = form.ocorrencias.filter((_: any, i: number) => i !== index);
      await EmployeesService.updateEmployee(id, { ...form, ocorrencias: novasOcorrencias });
      setForm(prev => prev ? { ...prev, ocorrencias: novasOcorrencias } : prev);
      setShowDeleteDialog(false);
    } catch (err) {
      // Tratar erro
    }
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

  if (error || !employee || !form) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <h2 className="text-xl font-bold text-red-500">{error || 'Colaborador não encontrado.'}</h2>
          <Button className="mt-4" onClick={() => router.push('/gestao-rh')}>Voltar para a lista</Button>
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
          <h1 className="text-2xl font-bold">Detalhes do Colaborador</h1>
          <Button 
            variant="outline" 
            className="ml-auto"
            onClick={() => {
              setForm(employee.employee_data);
              setShowEditModal(true);
            }}
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
                <div>
                  <Label>Nome</Label>
                  <Input value={form.informacoes_pessoais.nome} onChange={e => updateForm("informacoes_pessoais.nome", e.target.value)} />
                </div>
                <div>
                  <Label>Situação</Label>
                  <Select value={form.informacoes_pessoais.situacao} onValueChange={v => updateForm("informacoes_pessoais.situacao", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO">ATIVO</SelectItem>
                      <SelectItem value="INATIVO">INATIVO</SelectItem>
                      <SelectItem value="DESLIGADO">DESLIGADO</SelectItem>
                      <SelectItem value="FÉRIAS">FÉRIAS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input value={form.informacoes_pessoais.data_nascimento} onChange={e => updateForm("informacoes_pessoais.data_nascimento", e.target.value)} />
                </div>
                <div>
                  <Label>CPF</Label>
                  <Input value={form.informacoes_pessoais.cpf} onChange={e => updateForm("informacoes_pessoais.cpf", e.target.value)} />
                </div>
                <div>
                  <Label>RG</Label>
                  <Input value={form.informacoes_pessoais.rg} onChange={e => updateForm("informacoes_pessoais.rg", e.target.value)} />
                </div>
                <div>
                  <Label>Órgão Emissor RG</Label>
                  <Input value={form.informacoes_pessoais.orgao_emissor_rg} onChange={e => updateForm("informacoes_pessoais.orgao_emissor_rg", e.target.value)} />
                </div>
                <div>
                  <Label>CTPS</Label>
                  <Input value={form.informacoes_pessoais.ctps} onChange={e => updateForm("informacoes_pessoais.ctps", e.target.value)} />
                </div>
                <div>
                  <Label>PIS/NIS</Label>
                  <Input value={form.informacoes_pessoais.pis_nis} onChange={e => updateForm("informacoes_pessoais.pis_nis", e.target.value)} />
                </div>
                <div>
                  <Label>Celular</Label>
                  <Input value={form.informacoes_pessoais.celular} onChange={e => updateForm("informacoes_pessoais.celular", e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.informacoes_pessoais.email} onChange={e => updateForm("informacoes_pessoais.email", e.target.value)} />
                </div>
                <div>
                  <Label>Nome do Pai</Label>
                  <Input value={form.informacoes_pessoais.nome_pai} onChange={e => updateForm("informacoes_pessoais.nome_pai", e.target.value)} />
                </div>
                <div>
                  <Label>Nome da Mãe</Label>
                  <Input value={form.informacoes_pessoais.nome_mae} onChange={e => updateForm("informacoes_pessoais.nome_mae", e.target.value)} />
                </div>
                <div>
                  <Label>Cidade de Nascimento</Label>
                  <Input value={form.informacoes_pessoais.cidade_nascimento} onChange={e => updateForm("informacoes_pessoais.cidade_nascimento", e.target.value)} />
                </div>
                <div>
                  <Label>Necessita Vale Transporte</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={form.informacoes_pessoais.necessita_vale_transporte}
                      onCheckedChange={v => updateForm("informacoes_pessoais.necessita_vale_transporte", v)}
                    />
                    <Label>{form.informacoes_pessoais.necessita_vale_transporte ? "Sim" : "Não"}</Label>
                  </div>
                </div>
                <div>
                  <Label>Quantidade de Filhos até 14 anos</Label>
                  <Input
                    type="number"
                    value={form.informacoes_pessoais.quant_filhos_ate_14}
                    onChange={e => updateForm("informacoes_pessoais.quant_filhos_ate_14", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Celular de Parente</Label>
                  <Input value={form.informacoes_pessoais.celular_parente} onChange={e => updateForm("informacoes_pessoais.celular_parente", e.target.value)} />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input value={form.informacoes_pessoais.endereco.logradouro} onChange={e => updateForm("informacoes_pessoais.endereco.logradouro", e.target.value)} />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={form.informacoes_pessoais.endereco.cidade} onChange={e => updateForm("informacoes_pessoais.endereco.cidade", e.target.value)} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input value={form.informacoes_pessoais.endereco.estado} onChange={e => updateForm("informacoes_pessoais.endereco.estado", e.target.value)} />
                </div>
                <div>
                  <Label>CEP</Label>
                  <Input value={form.informacoes_pessoais.endereco.cep} onChange={e => updateForm("informacoes_pessoais.endereco.cep", e.target.value)} />
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
                  <Label>Unidade *</Label>
                  <Input value={form?.unidade || ""} disabled readOnly />
                </div>
                <div>
                  <Label>Razão Social *</Label>
                  <Input value={form?.razao_social || ""} disabled readOnly />
                </div>
                <div>
                  <Label>CNPJ *</Label>
                  <Input value={form?.cnpj || ""} disabled readOnly />
                </div>
                <div>
                  <Label>Cargo/Função</Label>
                  <Input value={form.dados_registro.cargo_funcao} onChange={e => updateForm("dados_registro.cargo_funcao", e.target.value)} />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Input value={form.dados_registro.departamento} onChange={e => updateForm("dados_registro.departamento", e.target.value)} />
                </div>
                <div>
                  <Label>Data Contratação</Label>
                  <Input value={form.dados_registro.data_contratacao} onChange={e => updateForm("dados_registro.data_contratacao", e.target.value)} />
                </div>
                <div>
                  <Label>Turno</Label>
                  <Input value={form.dados_registro.turno} onChange={e => updateForm("dados_registro.turno", e.target.value)} />
                </div>
                <div>
                  <Label>Carga Horária</Label>
                  <Input value={form.dados_registro.carga_horaria} onChange={e => updateForm("dados_registro.carga_horaria", e.target.value)} />
                </div>
                <div>
                  <Label>Descanso Semanal</Label>
                  <Input value={form.dados_registro.descanso_semanal} onChange={e => updateForm("dados_registro.descanso_semanal", e.target.value)} />
                </div>
                <div>
                  <Label>Salário</Label>
                  <Input value={form.dados_registro.salario} onChange={e => updateForm("dados_registro.salario", e.target.value)} />
                </div>
                <div>
                  <Label>Data Exame Admissional</Label>
                  <Input value={form.dados_registro.data_exame_admissional} onChange={e => updateForm("dados_registro.data_exame_admissional", e.target.value)} />
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
                <div>
                  <Label>EPIS</Label>
                  <Select 
                    value={form.declaracoes_enviadas.epis}
                    onValueChange={value => updateForm("declaracoes_enviadas.epis", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status da declaração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Chave</Label>
                  <Select 
                    value={form.declaracoes_enviadas.chave}
                    onValueChange={value => updateForm("declaracoes_enviadas.chave", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status da declaração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Uniforme</Label>
                  <Select 
                    value={form.declaracoes_enviadas.uniforme}
                    onValueChange={value => updateForm("declaracoes_enviadas.uniforme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status da declaração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vale Transporte</Label>
                  <Select 
                    value={form.declaracoes_enviadas.vale_transporte}
                    onValueChange={value => updateForm("declaracoes_enviadas.vale_transporte", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status da declaração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bancarios">
            <Card>
              <CardHeader>
                <CardTitle>Dados Bancários</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>PIX</Label>
                  <Input value={form.dados_bancarios.pix} onChange={e => updateForm("dados_bancarios.pix", e.target.value)} />
                </div>
                <div>
                  <Label>Banco</Label>
                  <Input value={form.dados_bancarios.banco} onChange={e => updateForm("dados_bancarios.banco", e.target.value)} />
                </div>
                <div>
                  <Label>Conta</Label>
                  <Input value={form.dados_bancarios.conta} onChange={e => updateForm("dados_bancarios.conta", e.target.value)} />
                </div>
                <div>
                  <Label>Agência</Label>
                  <Input value={form.dados_bancarios.agencia} onChange={e => updateForm("dados_bancarios.agencia", e.target.value)} />
                </div>
                <div>
                  <Label>Tipo de Conta</Label>
                  <Input value={form.dados_bancarios.tipo_conta} onChange={e => updateForm("dados_bancarios.tipo_conta", e.target.value)} />
                </div>
                <div>
                  <Label>Número do Banco</Label>
                  <Input value={form.dados_bancarios.numero_banco} onChange={e => updateForm("dados_bancarios.numero_banco", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estrangeiro">
            <Card>
              <CardHeader>
                <CardTitle>Dados de Estrangeiro</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cartão Modelo 19</Label>
                  <Input value={form.informacoes_estrangeiro.cartao_modelo_19} onChange={e => updateForm("informacoes_estrangeiro.cartao_modelo_19", e.target.value)} />
                </div>
                <div>
                  <Label>Casado com Brasileiro(a)</Label>
                  <Input value={form.informacoes_estrangeiro.casado_com_brasileiro} onChange={e => updateForm("informacoes_estrangeiro.casado_com_brasileiro", e.target.value)} />
                </div>
                <div>
                  <Label>Nome do Cônjuge</Label>
                  <Input value={form.informacoes_estrangeiro.nome_conjuge} onChange={e => updateForm("informacoes_estrangeiro.nome_conjuge", e.target.value)} />
                </div>
                <div>
                  <Label>Data de Chegada ao Brasil</Label>
                  <Input type="date" value={form.informacoes_estrangeiro.data_chegada_brasil} onChange={e => updateForm("informacoes_estrangeiro.data_chegada_brasil", e.target.value)} />
                </div>
                <div>
                  <Label>Número Registro Cartório</Label>
                  <Input value={form.informacoes_estrangeiro.numero_registro_cartorio} onChange={e => updateForm("informacoes_estrangeiro.numero_registro_cartorio", e.target.value)} />
                </div>
                <div>
                  <Label>Naturalizado</Label>
                  <Input value={form.informacoes_estrangeiro.naturalizado} onChange={e => updateForm("informacoes_estrangeiro.naturalizado", e.target.value)} />
                </div>
                <div>
                  <Label>Quantidade de Filhos no Brasil</Label>
                  <Input value={form.informacoes_estrangeiro.quantidade_filhos_brasil} onChange={e => updateForm("informacoes_estrangeiro.quantidade_filhos_brasil", e.target.value)} />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input value={form.informacoes_estrangeiro.cor} onChange={e => updateForm("informacoes_estrangeiro.cor", e.target.value)} />
                </div>
                <div>
                  <Label>Altura</Label>
                  <Input value={form.informacoes_estrangeiro.altura} onChange={e => updateForm("informacoes_estrangeiro.altura", e.target.value)} />
                </div>
                <div>
                  <Label>Peso</Label>
                  <Input value={form.informacoes_estrangeiro.peso} onChange={e => updateForm("informacoes_estrangeiro.peso", e.target.value)} />
                </div>
                <div>
                  <Label>Olhos</Label>
                  <Input value={form.informacoes_estrangeiro.olhos} onChange={e => updateForm("informacoes_estrangeiro.olhos", e.target.value)} />
                </div>
                <div>
                  <Label>Sinais</Label>
                  <Input value={form.informacoes_estrangeiro.sinais} onChange={e => updateForm("informacoes_estrangeiro.sinais", e.target.value)} />
                </div>
                <div>
                  <Label>Cabelos</Label>
                  <Input value={form.informacoes_estrangeiro.cabelos} onChange={e => updateForm("informacoes_estrangeiro.cabelos", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uniformes">
            <Card>
              <CardHeader>
                <CardTitle>Tamanhos de Uniforme</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Camiseta</Label>
                  <Select 
                    value={form.tamanhos_uniformes.camiseta}
                    onValueChange={value => updateForm("tamanhos_uniformes.camiseta", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PP">PP</SelectItem>
                      <SelectItem value="P">P</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="GG">GG</SelectItem>
                      <SelectItem value="XG">XG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Luva</Label>
                  <Select 
                    value={form.tamanhos_uniformes.luva}
                    onValueChange={value => updateForm("tamanhos_uniformes.luva", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P">P</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Calça</Label>
                  <Select 
                    value={form.tamanhos_uniformes.calca}
                    onValueChange={value => updateForm("tamanhos_uniformes.calca", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="38">38</SelectItem>
                      <SelectItem value="40">40</SelectItem>
                      <SelectItem value="42">42</SelectItem>
                      <SelectItem value="44">44</SelectItem>
                      <SelectItem value="46">46</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bota/Sapato</Label>
                  <Select 
                    value={form.tamanhos_uniformes.bota_sapato}
                    onValueChange={value => updateForm("tamanhos_uniformes.bota_sapato", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="36">36</SelectItem>
                      <SelectItem value="37">37</SelectItem>
                      <SelectItem value="38">38</SelectItem>
                      <SelectItem value="39">39</SelectItem>
                      <SelectItem value="40">40</SelectItem>
                      <SelectItem value="41">41</SelectItem>
                      <SelectItem value="42">42</SelectItem>
                      <SelectItem value="43">43</SelectItem>
                      <SelectItem value="44">44</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <MultiFileUpload
                    employeeId={id}
                    employeeName={form.informacoes_pessoais.nome}
                    driveLink={employee.drive_link}
                    onUploadComplete={async (link: string) => {
                      await EmployeesService.updateEmployee(id, { drive_link: link })
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
                          <span className="ml-2"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 13v3a1 1 0 001 1h3m-4-4l6-6m0 0l-6 6m6-6v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v6z" /></svg></span>
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
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Ocorrências</CardTitle>
                <Button onClick={() => { setShowOcorrenciaModal(true); setOcorrenciaToEdit(null); }}>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Ocorrência
                </Button>
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
                              onClick={e => { e.preventDefault(); handleEditOcorrencia(index); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={e => { e.preventDefault(); setOcorrenciaToEdit(index); setShowDeleteDialog(true); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="text-muted-foreground group-open:rotate-180 transition-transform">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="6 9 12 15 18 9" /></svg>
                            </div>
                          </div>
                        </summary>
                        <div className="p-4 pt-0 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Cidade</Label>
                              <div>{ocorrencia.cidade}</div>
                            </div>
                            <div>
                              <Label>Ocorrência</Label>
                              <div>{ocorrencia.ocorrencia}</div>
                            </div>
                            <div className="col-span-2">
                              <Label>Motivo</Label>
                              <div>{ocorrencia.motivo}</div>
                            </div>
                            {ocorrencia.observacao_2 && (
                              <div className="col-span-2">
                                <Label>Observação 2</Label>
                                <div>{ocorrencia.observacao_2}</div>
                              </div>
                            )}
                            {ocorrencia.observacao_3 && (
                              <div className="col-span-2">
                                <Label>Observação 3</Label>
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
            <OcorrenciaModal
              open={showOcorrenciaModal}
              onOpenChange={setShowOcorrenciaModal}
              ocorrencia={novaOcorrencia}
              setOcorrencia={setNovaOcorrencia}
              onSave={ocorrenciaToEdit !== null ? handleSaveEditOcorrencia : handleAddOcorrencia}
              isEditing={ocorrenciaToEdit !== null}
            />
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remover Ocorrência</DialogTitle>
                </DialogHeader>
                <div>Tem certeza que deseja remover esta ocorrência?</div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
                  <Button variant="destructive" onClick={() => handleDeleteOcorrencia(ocorrenciaToEdit!)}>Remover</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => router.push('/gestao-rh')}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </div>

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-8">
                  <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="profissionais">Dados Profissionais</TabsTrigger>
                  <TabsTrigger value="declaracoes">Declarações</TabsTrigger>
                  <TabsTrigger value="bancarios">Dados Bancários</TabsTrigger>
                  <TabsTrigger value="uniformes">Uniformes</TabsTrigger>
                  <TabsTrigger value="estrangeiro">Estrangeiro</TabsTrigger>
                  <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
                </TabsList>

                <TabsContent value="pessoais">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dados Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome</Label>
                        <Input value={form.informacoes_pessoais.nome} onChange={e => updateForm("informacoes_pessoais.nome", e.target.value)} />
                      </div>
                      <div>
                        <Label>Situação</Label>
                        <Select value={form.informacoes_pessoais.situacao} onValueChange={v => updateForm("informacoes_pessoais.situacao", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ATIVO">ATIVO</SelectItem>
                            <SelectItem value="INATIVO">INATIVO</SelectItem>
                            <SelectItem value="DESLIGADO">DESLIGADO</SelectItem>
                            <SelectItem value="FÉRIAS">FÉRIAS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Data de Nascimento</Label>
                        <Input value={form.informacoes_pessoais.data_nascimento} onChange={e => updateForm("informacoes_pessoais.data_nascimento", e.target.value)} />
                      </div>
                      <div>
                        <Label>CPF</Label>
                        <Input value={form.informacoes_pessoais.cpf} onChange={e => updateForm("informacoes_pessoais.cpf", e.target.value)} />
                      </div>
                      <div>
                        <Label>RG</Label>
                        <Input value={form.informacoes_pessoais.rg} onChange={e => updateForm("informacoes_pessoais.rg", e.target.value)} />
                      </div>
                      <div>
                        <Label>Órgão Emissor RG</Label>
                        <Input value={form.informacoes_pessoais.orgao_emissor_rg} onChange={e => updateForm("informacoes_pessoais.orgao_emissor_rg", e.target.value)} />
                      </div>
                      <div>
                        <Label>CTPS</Label>
                        <Input value={form.informacoes_pessoais.ctps} onChange={e => updateForm("informacoes_pessoais.ctps", e.target.value)} />
                      </div>
                      <div>
                        <Label>PIS/NIS</Label>
                        <Input value={form.informacoes_pessoais.pis_nis} onChange={e => updateForm("informacoes_pessoais.pis_nis", e.target.value)} />
                      </div>
                      <div>
                        <Label>Celular</Label>
                        <Input value={form.informacoes_pessoais.celular} onChange={e => updateForm("informacoes_pessoais.celular", e.target.value)} />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={form.informacoes_pessoais.email} onChange={e => updateForm("informacoes_pessoais.email", e.target.value)} />
                      </div>
                      <div>
                        <Label>Nome do Pai</Label>
                        <Input value={form.informacoes_pessoais.nome_pai} onChange={e => updateForm("informacoes_pessoais.nome_pai", e.target.value)} />
                      </div>
                      <div>
                        <Label>Nome da Mãe</Label>
                        <Input value={form.informacoes_pessoais.nome_mae} onChange={e => updateForm("informacoes_pessoais.nome_mae", e.target.value)} />
                      </div>
                      <div>
                        <Label>Cidade de Nascimento</Label>
                        <Input value={form.informacoes_pessoais.cidade_nascimento} onChange={e => updateForm("informacoes_pessoais.cidade_nascimento", e.target.value)} />
                      </div>
                      <div>
                        <Label>Necessita Vale Transporte</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={form.informacoes_pessoais.necessita_vale_transporte}
                            onCheckedChange={v => updateForm("informacoes_pessoais.necessita_vale_transporte", v)}
                          />
                          <Label>{form.informacoes_pessoais.necessita_vale_transporte ? "Sim" : "Não"}</Label>
                        </div>
                      </div>
                      <div>
                        <Label>Quantidade de Filhos até 14 anos</Label>
                        <Input
                          type="number"
                          value={form.informacoes_pessoais.quant_filhos_ate_14}
                          onChange={e => updateForm("informacoes_pessoais.quant_filhos_ate_14", parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Celular de Parente</Label>
                        <Input value={form.informacoes_pessoais.celular_parente} onChange={e => updateForm("informacoes_pessoais.celular_parente", e.target.value)} />
                      </div>
                      <div>
                        <Label>Endereço</Label>
                        <Input value={form.informacoes_pessoais.endereco.logradouro} onChange={e => updateForm("informacoes_pessoais.endereco.logradouro", e.target.value)} />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input value={form.informacoes_pessoais.endereco.cidade} onChange={e => updateForm("informacoes_pessoais.endereco.cidade", e.target.value)} />
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Input value={form.informacoes_pessoais.endereco.estado} onChange={e => updateForm("informacoes_pessoais.endereco.estado", e.target.value)} />
                      </div>
                      <div>
                        <Label>CEP</Label>
                        <Input value={form.informacoes_pessoais.endereco.cep} onChange={e => updateForm("informacoes_pessoais.endereco.cep", e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bancarios">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dados Bancários</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>PIX</Label>
                        <Input value={form.dados_bancarios.pix} onChange={e => updateForm("dados_bancarios.pix", e.target.value)} />
                      </div>
                      <div>
                        <Label>Banco</Label>
                        <Input value={form.dados_bancarios.banco} onChange={e => updateForm("dados_bancarios.banco", e.target.value)} />
                      </div>
                      <div>
                        <Label>Conta</Label>
                        <Input value={form.dados_bancarios.conta} onChange={e => updateForm("dados_bancarios.conta", e.target.value)} />
                      </div>
                      <div>
                        <Label>Agência</Label>
                        <Input value={form.dados_bancarios.agencia} onChange={e => updateForm("dados_bancarios.agencia", e.target.value)} />
                      </div>
                      <div>
                        <Label>Tipo de Conta</Label>
                        <Input value={form.dados_bancarios.tipo_conta} onChange={e => updateForm("dados_bancarios.tipo_conta", e.target.value)} />
                      </div>
                      <div>
                        <Label>Número do Banco</Label>
                        <Input value={form.dados_bancarios.numero_banco} onChange={e => updateForm("dados_bancarios.numero_banco", e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="estrangeiro">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dados de Estrangeiro</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Cartão Modelo 19</Label>
                        <Input value={form.informacoes_estrangeiro.cartao_modelo_19} onChange={e => updateForm("informacoes_estrangeiro.cartao_modelo_19", e.target.value)} />
                      </div>
                      <div>
                        <Label>Casado com Brasileiro(a)</Label>
                        <Input value={form.informacoes_estrangeiro.casado_com_brasileiro} onChange={e => updateForm("informacoes_estrangeiro.casado_com_brasileiro", e.target.value)} />
                      </div>
                      <div>
                        <Label>Nome do Cônjuge</Label>
                        <Input value={form.informacoes_estrangeiro.nome_conjuge} onChange={e => updateForm("informacoes_estrangeiro.nome_conjuge", e.target.value)} />
                      </div>
                      <div>
                        <Label>Data de Chegada ao Brasil</Label>
                        <Input type="date" value={form.informacoes_estrangeiro.data_chegada_brasil} onChange={e => updateForm("informacoes_estrangeiro.data_chegada_brasil", e.target.value)} />
                      </div>
                      <div>
                        <Label>Número Registro Cartório</Label>
                        <Input value={form.informacoes_estrangeiro.numero_registro_cartorio} onChange={e => updateForm("informacoes_estrangeiro.numero_registro_cartorio", e.target.value)} />
                      </div>
                      <div>
                        <Label>Naturalizado</Label>
                        <Input value={form.informacoes_estrangeiro.naturalizado} onChange={e => updateForm("informacoes_estrangeiro.naturalizado", e.target.value)} />
                      </div>
                      <div>
                        <Label>Quantidade de Filhos no Brasil</Label>
                        <Input value={form.informacoes_estrangeiro.quantidade_filhos_brasil} onChange={e => updateForm("informacoes_estrangeiro.quantidade_filhos_brasil", e.target.value)} />
                      </div>
                      <div>
                        <Label>Cor</Label>
                        <Input value={form.informacoes_estrangeiro.cor} onChange={e => updateForm("informacoes_estrangeiro.cor", e.target.value)} />
                      </div>
                      <div>
                        <Label>Altura</Label>
                        <Input value={form.informacoes_estrangeiro.altura} onChange={e => updateForm("informacoes_estrangeiro.altura", e.target.value)} />
                      </div>
                      <div>
                        <Label>Peso</Label>
                        <Input value={form.informacoes_estrangeiro.peso} onChange={e => updateForm("informacoes_estrangeiro.peso", e.target.value)} />
                      </div>
                      <div>
                        <Label>Olhos</Label>
                        <Input value={form.informacoes_estrangeiro.olhos} onChange={e => updateForm("informacoes_estrangeiro.olhos", e.target.value)} />
                      </div>
                      <div>
                        <Label>Sinais</Label>
                        <Input value={form.informacoes_estrangeiro.sinais} onChange={e => updateForm("informacoes_estrangeiro.sinais", e.target.value)} />
                      </div>
                      <div>
                        <Label>Cabelos</Label>
                        <Input value={form.informacoes_estrangeiro.cabelos} onChange={e => updateForm("informacoes_estrangeiro.cabelos", e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
} 