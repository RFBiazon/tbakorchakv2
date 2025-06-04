"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UploadCloud, CheckCircle, Circle } from "lucide-react"
import { EmployeesService } from "@/lib/employees-service"
import lojasConfig from '../../../lojas.config.json'
import { Textarea } from "@/components/ui/textarea"
import { useSelectedStore } from "@/hooks/useSelectedStore"
import { toast } from "sonner"

const lojas = lojasConfig.map(loja => ({ id: loja.idInterno, nome: loja.nomeExibicao }))

const initialEmployeeData = {
  nome: "",
  unidade: "",
  razao_social: "",
  cnpj: "",
  dados_registro: {
    numero_registro_esocial: "",
    data_contratacao: "",
    cargo_funcao: "",
    departamento: "",
    turno: "",
    carga_horaria: "",
    data_exame_admissional: "",
    salario: "",
    descanso_semanal: ""
  },
  informacoes_pessoais: {
    nome: "",
    situacao: "ATIVO",
    nome_pai: "",
    nome_mae: "",
    cidade_nascimento: "",
    rg: "",
    orgao_emissor_rg: "",
    cpf: "",
    data_nascimento: "",
    ctps: "",
    pis_nis: "",
    celular: "",
    email: "",
    necessita_vale_transporte: false,
    quant_filhos_ate_14: 0,
    celular_parente: "",
    endereco: {
      logradouro: "",
      cidade: "",
      estado: "",
      cep: ""
    }
  },
  tamanhos_uniformes: {
    camiseta: "",
    luva: "",
    calca: "",
    bota_sapato: ""
  },
  declaracoes_enviadas: {
    chave: "N/A",
    uniforme: "N/A",
    epis: "N/A",
    vale_transporte: "N/A"
  },
  documentos_em_anexo: {
    rg: "N/A",
    cpf: "N/A",
    habilitacao: "N/A",
    comprovante_residencia: "N/A",
    ctps: "N/A",
    nis: "N/A",
    foto_3x4: "N/A",
    documentos_filhos_menores_14: "N/A",
    exame_admissional: "N/A",
    carteirinha_vacinacao: "N/A"
  },
  dados_bancarios: {
    banco: "",
    numero_banco: "N/A",
    agencia: "N/A",
    conta: "N/A",
    tipo_conta: "",
    pix: ""
  },
  informacoes_estrangeiro: {
    cartao_modelo_19: "N/A",
    casado_com_brasileiro: "N/A",
    nome_conjuge: "N/A",
    data_chegada_brasil: "N/A",
    numero_registro_cartorio: "N/A",
    naturalizado: "N/A",
    quantidade_filhos_brasil: "N/A",
    cor: "N/A",
    altura: "N/A",
    peso: "N/A",
    olhos: "N/A",
    sinais: "N/A",
    cabelos: "N/A"
  },
  ocorrencias: []
}

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

export default function NovoColaboradorPage() {
  const router = useRouter()
  const { selectedStore } = useSelectedStore()
  const lojaAtual = lojasConfig.find(loja => loja.idInterno === selectedStore)
  const [tab, setTab] = useState("pessoais")
  const [form, setForm] = useState({
    ...initialEmployeeData,
    unidade: lojaAtual?.idInterno || "",
    razao_social: lojaAtual?.nome || "",
    cnpj: lojaAtual?.cnpj || ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  // Atualizar os campos travados se a loja mudar
  useEffect(() => {
    if (lojaAtual) {
      setForm(prev => ({
        ...prev,
        unidade: lojaAtual.idInterno,
        razao_social: lojaAtual.nome,
        cnpj: lojaAtual.cnpj
      }))
    }
  }, [selectedStore])

  function updateForm(path: string, value: any) {
    setForm(prev => {
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

  async function handleSubmit() {
    try {
      setLoading(true)
      setError(null)
      
      // Validar dados obrigatórios
      if (!form.informacoes_pessoais.nome || !form.informacoes_pessoais.cpf || !form.unidade) {
        throw new Error('Nome, CPF e Unidade são obrigatórios')
      }

      // Criar novo colaborador
      await EmployeesService.createEmployee(form)
      
      toast.success('Colaborador cadastrado com sucesso!')
      router.push('/gestao-rh')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar colaborador')
      toast.error(err instanceof Error ? err.message : 'Erro ao criar colaborador')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => router.push('/gestao-rh')} size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Novo Colaborador</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="profissionais">Dados Profissionais</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="declaracoes">Declarações</TabsTrigger>
            <TabsTrigger value="bancarios">Dados Bancários</TabsTrigger>
            <TabsTrigger value="uniformes">Uniformes</TabsTrigger>
            <TabsTrigger value="estrangeiro">Estrangeiro</TabsTrigger>
            <TabsTrigger value="upload">Upload de Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="pessoais">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input 
                    value={form.informacoes_pessoais.nome} 
                    onChange={e => updateForm("informacoes_pessoais.nome", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Situação</Label>
                  <Select 
                    value={form.informacoes_pessoais.situacao} 
                    onValueChange={v => updateForm("informacoes_pessoais.situacao", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Input 
                    type="date"
                    value={form.informacoes_pessoais.data_nascimento} 
                    onChange={e => updateForm("informacoes_pessoais.data_nascimento", e.target.value)}
                  />
                </div>
                <div>
                  <Label>CPF</Label>
                  <Input 
                    value={form.informacoes_pessoais.cpf} 
                    onChange={e => updateForm("informacoes_pessoais.cpf", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>RG</Label>
                  <Input 
                    value={form.informacoes_pessoais.rg} 
                    onChange={e => updateForm("informacoes_pessoais.rg", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Órgão Emissor</Label>
                  <Input 
                    value={form.informacoes_pessoais.orgao_emissor_rg} 
                    onChange={e => updateForm("informacoes_pessoais.orgao_emissor_rg", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Nome do Pai</Label>
                  <Input 
                    value={form.informacoes_pessoais.nome_pai} 
                    onChange={e => updateForm("informacoes_pessoais.nome_pai", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Nome da Mãe</Label>
                  <Input 
                    value={form.informacoes_pessoais.nome_mae} 
                    onChange={e => updateForm("informacoes_pessoais.nome_mae", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cidade de Nascimento</Label>
                  <Input 
                    value={form.informacoes_pessoais.cidade_nascimento} 
                    onChange={e => updateForm("informacoes_pessoais.cidade_nascimento", e.target.value)}
                  />
                </div>
                <div>
                  <Label>CTPS</Label>
                  <Input 
                    value={form.informacoes_pessoais.ctps} 
                    onChange={e => updateForm("informacoes_pessoais.ctps", e.target.value)}
                  />
                </div>
                <div>
                  <Label>PIS/NIS</Label>
                  <Input 
                    value={form.informacoes_pessoais.pis_nis} 
                    onChange={e => updateForm("informacoes_pessoais.pis_nis", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Celular</Label>
                  <Input 
                    value={form.informacoes_pessoais.celular} 
                    onChange={e => updateForm("informacoes_pessoais.celular", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={form.informacoes_pessoais.email} 
                    onChange={e => updateForm("informacoes_pessoais.email", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Celular de Parente</Label>
                  <Input 
                    value={form.informacoes_pessoais.celular_parente} 
                    onChange={e => updateForm("informacoes_pessoais.celular_parente", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Quantidade de Filhos até 14 anos</Label>
                  <Input 
                    type="number"
                    value={form.informacoes_pessoais.quant_filhos_ate_14} 
                    onChange={e => updateForm("informacoes_pessoais.quant_filhos_ate_14", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={form.informacoes_pessoais.necessita_vale_transporte}
                    onCheckedChange={checked => updateForm("informacoes_pessoais.necessita_vale_transporte", checked)}
                  />
                  <Label>Necessita Vale Transporte</Label>
                </div>

                <div className="col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Endereço</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Logradouro</Label>
                        <Input 
                          value={form.informacoes_pessoais.endereco.logradouro} 
                          onChange={e => updateForm("informacoes_pessoais.endereco.logradouro", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input 
                          value={form.informacoes_pessoais.endereco.cidade} 
                          onChange={e => updateForm("informacoes_pessoais.endereco.cidade", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Input 
                          value={form.informacoes_pessoais.endereco.estado} 
                          onChange={e => updateForm("informacoes_pessoais.endereco.estado", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>CEP</Label>
                        <Input 
                          value={form.informacoes_pessoais.endereco.cep} 
                          onChange={e => updateForm("informacoes_pessoais.endereco.cep", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
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
                  <Input value={form.unidade} disabled readOnly />
                </div>
                <div>
                  <Label>Razão Social *</Label>
                  <Input value={form.razao_social} disabled readOnly />
                </div>
                <div>
                  <Label>CNPJ *</Label>
                  <Input value={form.cnpj} disabled readOnly />
                </div>
                <div>
                  <Label>Número de Registro eSocial</Label>
                  <Input 
                    value={form.dados_registro.numero_registro_esocial} 
                    onChange={e => updateForm("dados_registro.numero_registro_esocial", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Data de Contratação</Label>
                  <Input 
                    type="date"
                    value={form.dados_registro.data_contratacao} 
                    onChange={e => updateForm("dados_registro.data_contratacao", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cargo/Função</Label>
                  <Input 
                    value={form.dados_registro.cargo_funcao} 
                    onChange={e => updateForm("dados_registro.cargo_funcao", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Input 
                    value={form.dados_registro.departamento} 
                    onChange={e => updateForm("dados_registro.departamento", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Turno</Label>
                  <Input 
                    value={form.dados_registro.turno} 
                    onChange={e => updateForm("dados_registro.turno", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Carga Horária</Label>
                  <Input 
                    value={form.dados_registro.carga_horaria} 
                    onChange={e => updateForm("dados_registro.carga_horaria", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Data do Exame Admissional</Label>
                  <Input 
                    type="date"
                    value={form.dados_registro.data_exame_admissional} 
                    onChange={e => updateForm("dados_registro.data_exame_admissional", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Salário</Label>
                  <Input 
                    type="number"
                    value={form.dados_registro.salario} 
                    onChange={e => updateForm("dados_registro.salario", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Descanso Semanal</Label>
                  <Input 
                    value={form.dados_registro.descanso_semanal} 
                    onChange={e => updateForm("dados_registro.descanso_semanal", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <Card>
              <CardHeader>
                <CardTitle>Documentos em Anexo</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>RG</Label>
                  <Select 
                    value={form.documentos_em_anexo.rg}
                    onValueChange={value => updateForm("documentos_em_anexo.rg", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CPF</Label>
                  <Select 
                    value={form.documentos_em_anexo.cpf}
                    onValueChange={value => updateForm("documentos_em_anexo.cpf", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Habilitação</Label>
                  <Select 
                    value={form.documentos_em_anexo.habilitacao}
                    onValueChange={value => updateForm("documentos_em_anexo.habilitacao", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Comprovante de Residência</Label>
                  <Select 
                    value={form.documentos_em_anexo.comprovante_residencia}
                    onValueChange={value => updateForm("documentos_em_anexo.comprovante_residencia", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CTPS</Label>
                  <Select 
                    value={form.documentos_em_anexo.ctps}
                    onValueChange={value => updateForm("documentos_em_anexo.ctps", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>NIS</Label>
                  <Select 
                    value={form.documentos_em_anexo.nis}
                    onValueChange={value => updateForm("documentos_em_anexo.nis", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Foto 3x4</Label>
                  <Select 
                    value={form.documentos_em_anexo.foto_3x4}
                    onValueChange={value => updateForm("documentos_em_anexo.foto_3x4", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Documentos dos Filhos Menores de 14 anos</Label>
                  <Select 
                    value={form.documentos_em_anexo.documentos_filhos_menores_14}
                    onValueChange={value => updateForm("documentos_em_anexo.documentos_filhos_menores_14", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Exame Admissional</Label>
                  <Select 
                    value={form.documentos_em_anexo.exame_admissional}
                    onValueChange={value => updateForm("documentos_em_anexo.exame_admissional", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Carteirinha de Vacinação</Label>
                  <Select 
                    value={form.documentos_em_anexo.carteirinha_vacinacao}
                    onValueChange={value => updateForm("documentos_em_anexo.carteirinha_vacinacao", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
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

          <TabsContent value="declaracoes">
            <Card>
              <CardHeader>
                <CardTitle>Declarações Enviadas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label>EPIs</Label>
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
                  <Label>Banco</Label>
                  <Input 
                    value={form.dados_bancarios.banco} 
                    onChange={e => updateForm("dados_bancarios.banco", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Número do Banco</Label>
                  <Input 
                    value={form.dados_bancarios.numero_banco} 
                    onChange={e => updateForm("dados_bancarios.numero_banco", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Agência</Label>
                  <Input 
                    value={form.dados_bancarios.agencia} 
                    onChange={e => updateForm("dados_bancarios.agencia", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Conta</Label>
                  <Input 
                    value={form.dados_bancarios.conta} 
                    onChange={e => updateForm("dados_bancarios.conta", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tipo de Conta</Label>
                  <Select 
                    value={form.dados_bancarios.tipo_conta}
                    onValueChange={value => updateForm("dados_bancarios.tipo_conta", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de conta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORRENTE">Conta Corrente</SelectItem>
                      <SelectItem value="POUPANCA">Conta Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>PIX</Label>
                  <Input 
                    value={form.dados_bancarios.pix} 
                    onChange={e => updateForm("dados_bancarios.pix", e.target.value)}
                  />
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

          <TabsContent value="estrangeiro">
            <Card>
              <CardHeader>
                <CardTitle>Informações para Estrangeiros</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cartão Modelo 19</Label>
                  <Select 
                    value={form.informacoes_estrangeiro.cartao_modelo_19}
                    onValueChange={value => updateForm("informacoes_estrangeiro.cartao_modelo_19", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Casado com Brasileiro</Label>
                  <Select 
                    value={form.informacoes_estrangeiro.casado_com_brasileiro}
                    onValueChange={value => updateForm("informacoes_estrangeiro.casado_com_brasileiro", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="SIM">Sim</SelectItem>
                      <SelectItem value="NAO">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nome do Cônjuge</Label>
                  <Input 
                    value={form.informacoes_estrangeiro.nome_conjuge} 
                    onChange={e => updateForm("informacoes_estrangeiro.nome_conjuge", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Data de Chegada ao Brasil</Label>
                  <Input 
                    type="date"
                    value={form.informacoes_estrangeiro.data_chegada_brasil} 
                    onChange={e => updateForm("informacoes_estrangeiro.data_chegada_brasil", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Número de Registro no Cartório</Label>
                  <Input 
                    value={form.informacoes_estrangeiro.numero_registro_cartorio} 
                    onChange={e => updateForm("informacoes_estrangeiro.numero_registro_cartorio", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Naturalizado</Label>
                  <Select 
                    value={form.informacoes_estrangeiro.naturalizado}
                    onValueChange={value => updateForm("informacoes_estrangeiro.naturalizado", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não Aplicável</SelectItem>
                      <SelectItem value="SIM">Sim</SelectItem>
                      <SelectItem value="NAO">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantidade de Filhos no Brasil</Label>
                  <Input 
                    type="number"
                    value={form.informacoes_estrangeiro.quantidade_filhos_brasil} 
                    onChange={e => updateForm("informacoes_estrangeiro.quantidade_filhos_brasil", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input 
                    value={form.informacoes_estrangeiro.cor} 
                    onChange={e => updateForm("informacoes_estrangeiro.cor", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Altura</Label>
                  <Input 
                    value={form.informacoes_estrangeiro.altura} 
                    onChange={e => updateForm("informacoes_estrangeiro.altura", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Peso</Label>
                  <Input 
                    value={form.informacoes_estrangeiro.peso} 
                    onChange={e => updateForm("informacoes_estrangeiro.peso", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Olhos</Label>
                  <Input 
                    value={form.informacoes_estrangeiro.olhos} 
                    onChange={e => updateForm("informacoes_estrangeiro.olhos", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Sinais</Label>
                  <Input 
                    value={form.informacoes_estrangeiro.sinais} 
                    onChange={e => updateForm("informacoes_estrangeiro.sinais", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cabelos</Label>
                  <Input 
                    value={form.informacoes_estrangeiro.cabelos} 
                    onChange={e => updateForm("informacoes_estrangeiro.cabelos", e.target.value)}
                  />
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
                      const anexado = uploadedDocs.some(d => d.tipo === doc.value)
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

        <div className="flex justify-end gap-2 mt-6 px-4 pb-4">
          <Button variant="outline" onClick={() => router.push('/gestao-rh')}>Cancelar</Button>
          <Button 
            variant="default" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
} 