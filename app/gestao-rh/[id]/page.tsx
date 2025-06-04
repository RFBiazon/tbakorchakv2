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
import { ArrowLeft, UploadCloud, CheckCircle, Circle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EmployeesService } from "@/lib/employees-service"
import lojasConfig from '../../../lojas.config.json'
import { useSelectedStore } from "@/hooks/useSelectedStore"

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
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

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
      setLoading(true)
      await EmployeesService.updateEmployee(id, form)
      router.push('/gestao-rh')
    } catch (err) {
      setError('Erro ao salvar alterações')
      console.error(err)
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl font-bold">Editar Colaborador</h1>
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

          <TabsContent value="declaracoes">
            <Card>
              <CardHeader>
                <CardTitle>Declarações</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(form.declaracoes_enviadas || {}).map(([key, value]) => (
                  <div key={key}>
                    <Label>{key.replace(/_/g, ' ')}</Label>
                    <Input value={value} onChange={e => updateForm(`declaracoes_enviadas.${key}`, e.target.value)} />
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
                    <Label>{key.replace(/_/g, ' ')}</Label>
                    <Input value={value} onChange={e => updateForm(`dados_bancarios.${key}`, e.target.value)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ocorrencias">
            <Card>
              <CardHeader>
                <CardTitle>Ocorrências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {form.ocorrencias?.map((ocorrencia: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Código</Label>
                            <Input value={ocorrencia.codigo} onChange={e => {
                              const novasOcorrencias = [...(form.ocorrencias || [])]
                              novasOcorrencias[index] = { ...ocorrencia, codigo: parseInt(e.target.value) }
                              updateForm("ocorrencias", novasOcorrencias)
                            }} />
                          </div>
                          <div>
                            <Label>Data</Label>
                            <Input value={ocorrencia.data} onChange={e => {
                              const novasOcorrencias = [...(form.ocorrencias || [])]
                              novasOcorrencias[index] = { ...ocorrencia, data: e.target.value }
                              updateForm("ocorrencias", novasOcorrencias)
                            }} />
                          </div>
                          <div>
                            <Label>Cidade</Label>
                            <Input value={ocorrencia.cidade} onChange={e => {
                              const novasOcorrencias = [...(form.ocorrencias || [])]
                              novasOcorrencias[index] = { ...ocorrencia, cidade: e.target.value }
                              updateForm("ocorrencias", novasOcorrencias)
                            }} />
                          </div>
                          <div>
                            <Label>Ocorrência</Label>
                            <Input value={ocorrencia.ocorrencia} onChange={e => {
                              const novasOcorrencias = [...(form.ocorrencias || [])]
                              novasOcorrencias[index] = { ...ocorrencia, ocorrencia: e.target.value }
                              updateForm("ocorrencias", novasOcorrencias)
                            }} />
                          </div>
                          <div>
                            <Label>Motivo</Label>
                            <Input value={ocorrencia.motivo} onChange={e => {
                              const novasOcorrencias = [...(form.ocorrencias || [])]
                              novasOcorrencias[index] = { ...ocorrencia, motivo: e.target.value }
                              updateForm("ocorrencias", novasOcorrencias)
                            }} />
                          </div>
                          <div>
                            <Label>Observação 2</Label>
                            <Input value={ocorrencia.observacao_2} onChange={e => {
                              const novasOcorrencias = [...(form.ocorrencias || [])]
                              novasOcorrencias[index] = { ...ocorrencia, observacao_2: e.target.value }
                              updateForm("ocorrencias", novasOcorrencias)
                            }} />
                          </div>
                          <div>
                            <Label>Observação 3</Label>
                            <Input value={ocorrencia.observacao_3} onChange={e => {
                              const novasOcorrencias = [...(form.ocorrencias || [])]
                              novasOcorrencias[index] = { ...ocorrencia, observacao_3: e.target.value }
                              updateForm("ocorrencias", novasOcorrencias)
                            }} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => router.push('/gestao-rh')}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </div>
      </div>
    </DashboardLayout>
  )
} 