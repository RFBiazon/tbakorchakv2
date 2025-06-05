"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Construction, PackageSearch } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { useSelectedStore } from "@/hooks/useSelectedStore"
import lojasConfigData from '../../../lojas.config.json';
import { Textarea } from "@/components/ui/textarea"
import { salvarMovimentacaoSCM } from "@/lib/supabase"
import { toast } from "sonner"
import { SCMControleCaixa } from "@/components/scm"
import { Badge } from "@/components/ui/badge"
import { TableCell } from "@/components/ui/table"

function formatCPF(value: string) {
  return value.replace(/\D/g, '').slice(0, 11)
}

function isCPFValid(value: string) {
  return /^\d{11}$/.test(value)
}

function formatBRL(value: string) {
  const num = value.replace(/\D/g, '')
  const float = (parseInt(num, 10) / 100).toFixed(2)
  return isNaN(Number(float)) ? '' : Number(float).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const valorFields = [
  'debitoVisa', 'debitoMaster', 'debitoElo', 'debitoCabal',
  'creditoVisa', 'creditoMaster', 'creditoElo', 'creditoCabal', 'creditoAmex',
  'pixMaquininha', 'debitoSistema', 'creditoSistema',
  'aberturaCaixa', 'entradas', 'saidas', 'fechamento'
]

// Função para capitalizar o nome do operador
function titleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Função para formatar data/hora dd-MM-yyyy HH:mm:ss para dd/MM/yyyy HH:mm:ss
function formatarDataHoraBr(dataStr: string) {
  if (!dataStr) return '';
  // Troca - por /
  return dataStr.replace(/(\d{2})-(\d{2})-(\d{4})/, '$1/$2/$3');
}

// Função utilitária para formatar valores em Real Brasileiro
function formatarMoedaBR(valor: any) {
  if (valor === undefined || valor === null || valor === "") return "";
  const num = typeof valor === 'string' ? Number(valor.toString().replace(/[^\d\-,.]/g, '').replace(',', '.')) : Number(valor);
  if (isNaN(num)) return "";
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function isFilled(val: any) {
  if (val === undefined || val === null) return false;
  if (typeof val === "string") {
    const trimmed = val.replace(/\D/g, "");
    return trimmed !== "" && trimmed !== "0";
  }
  if (typeof val === "number") {
    return val !== 0;
  }
  return false;
}

// === NOVO: lista de campos monetários ===
const moneyFields = new Set<string>([
  'debitoVisa','debitoMaster','debitoElo','debitoCabal',
  'creditoVisa','creditoMaster','creditoElo','creditoCabal','creditoAmex',
  'pixMaquininha','debitoSistema','creditoSistema',
  'aberturaCaixa','entradas','saidas','fechamento','dinheiro','resultado'
]);

function parseBRNumber(value: any): number {
  if (value === undefined || value === null || value === "") return 0;
  const s = String(value).replace(/[^0-9\-,]/g, '').replace(',', '.');
  return Number(s) || 0;
}

export default function SCMPage() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedCaixa, setSelectedCaixa] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const { selectedStore } = useSelectedStore()
  const lojasConfig = lojasConfigData;
  const lojaNome = lojasConfig.find((l: any) => l.idInterno === selectedStore)?.nomeExibicao || "-"
  const operador = "" // Valor inicial do operador agora é vazio
  const now = new Date().toISOString();
  const [focusedField, setFocusedField] = useState<string>("")
  const [historico, setHistorico] = useState<any[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [modalControleCaixaOpen, setModalControleCaixaOpen] = useState(false)
  const [dadosCaixaSelecionado, setDadosCaixaSelecionado] = useState<any>(null)
  const [modalFechamentoOpen, setModalFechamentoOpen] = useState(false)
  const [formFechamento, setFormFechamento] = useState<any>({})
  const [caixaNumeroSelecionado, setCaixaNumeroSelecionado] = useState<string | null>(null);
  const [preFilledFields, setPreFilledFields] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleOpenForm = (caixa: string) => {
    setSelectedCaixa(caixa)
    setForm({
      dataHora: now,
      loja: lojaNome,
      operador: "", // Começa vazio
      caixa,
      caixaNumero: caixa,
      cpf: "",
      autorizacao: false,
      observacao: ""
    })
    setPreFilledFields(new Set())
    setOpen(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckbox = (checked: boolean) => {
    setForm({ ...form, autorizacao: checked })
  }

  const handleConfirm = async () => {
    try {
      // Converter campos de moeda para número
      const parseBRL = (v: string) => Number(String(v).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      const payload = {
        data_hora: form.dataHoraFechamento ? new Date(form.dataHoraFechamento).toISOString() : (form.dataHora ? new Date(form.dataHora).toISOString() : new Date().toISOString()),
        loja: form.loja || lojaNome,
        operador: form.operador,
        caixa: form.caixa || form.caixaNumero,
        cash_id: form.cash_id,
        historico_id: form.historico_id,
        debito_visa: parseBRL(form.debitoVisa),
        debito_master: parseBRL(form.debitoMaster),
        debito_elo: parseBRL(form.debitoElo),
        debito_cabal: parseBRL(form.debitoCabal),
        credito_visa: parseBRL(form.creditoVisa),
        credito_master: parseBRL(form.creditoMaster),
        credito_elo: parseBRL(form.creditoElo),
        credito_cabal: parseBRL(form.creditoCabal),
        credito_amex: parseBRL(form.creditoAmex),
        pix_maquininha: parseBRL(form.pixMaquininha),
        debito_sistema: parseBRL(form.debitoSistema),
        credito_sistema: parseBRL(form.creditoSistema),
        abertura_caixa: parseBRL(form.aberturaCaixa),
        entradas: parseBRL(form.entradas),
        saidas: parseBRL(form.saidas),
        fechamento: parseBRL(form.fechamento),
        resultado: parseBRL(form.resultado),
        dinheiro: parseBRL(form.dinheiro),
        observacao: form.observacao,
        autorizacao: form.autorizacao,
        cpf_operador: form.cpf,
        email_operador: form.email
      }
      console.log("Enviando SCM payload:", payload);
      await salvarMovimentacaoSCM(payload, selectedStore)
      console.log("Registro SCM inserido com sucesso no Supabase");
      toast.success("Movimentação salva com sucesso!")
      setOpen(false)
      // Atualiza histórico
      setTimeout(() => {
        // Força recarregar histórico após salvar
        setLoadingHistorico(true)
        setTimeout(() => setLoadingHistorico(false), 500)
      }, 500)
    } catch (e: any) {
      console.warn("Erro ao salvar SCM: ", e);
      toast.error("Erro ao salvar movimentação: " + (e.message || e))
    }
  }

  const isFormValid = () => {
    if (!form.operador || !isCPFValid(form.cpf) || !form.autorizacao) return false
    for (const field of valorFields) {
      if (!form[field]) return false
    }
    return true
  }

  // Carregar histórico ao abrir a página ou ao salvar
  useEffect(() => {
    if (!selectedStore) return
    async function fetchHistorico() {
      setLoadingHistorico(true)
      try {
        const supabase = await import("@/lib/supabase")
        const client = supabase.createSupabaseClient(selectedStore)
        const { data, error } = await client
          .from("scm_movimentacoes")
          .select("*")
          .eq("loja", lojaNome)
          .order("data_hora", { ascending: false })
        if (error) throw error
        setHistorico(data || [])
      } catch (e) {
        toast.error("Erro ao carregar histórico do caixa")
      } finally {
        setLoadingHistorico(false)
      }
    }
    fetchHistorico()
  }, [selectedStore, lojaNome, open])

  // Função para buscar dados do caixa selecionado
  async function buscarDadosCaixaPorId(caixaId: number) {
    // Buscar no histórico já carregado
    const caixa = historico.find((item: any) => item.id === caixaId);
    if (caixa) {
      setDadosCaixaSelecionado({
        data_hora: caixa.opened_at,
        loja: caixa.loja || '',
        operador: caixa.opened_user?.full_name || '',
        caixa: caixa.cash_id || '',
        abertura: caixa.amount_on_open,
        saidas: caixa.out_result,
        entradas: caixa.in_result,
        fechamento: caixa.amount_on_close,
        // Adicione outros campos conforme necessário
      });
    } else {
      setDadosCaixaSelecionado(null);
    }
    setModalFechamentoOpen(true);
  }

  // Atualizar formFechamento quando dadosCaixaSelecionado mudar
  useEffect(() => {
    if (dadosCaixaSelecionado) {
      setFormFechamento({ ...dadosCaixaSelecionado })
    }
  }, [dadosCaixaSelecionado])

  function handleChangeFechamento(e: any) {
    const { name, value } = e.target
    setFormFechamento((prev: any) => ({ ...prev, [name]: value }))
  }

  function isReadOnly(field: string) {
    return preFilledFields.has(field);
  }

  function handleFocus(field: string) {
    setEditingField(field);
  }

  function handleBlur(field: string) {
    setEditingField(null);
  }

  // Retorna o valor a ser exibido no input. Se for campo monetário e não estiver em edição, formata; caso contrário devolve cru.
  const getDisplayValue = (field: string) => {
    const v: any = (form as any)[field];
    if (!moneyFields.has(field)) return v ?? ""; // campos que não são money voltam como string pura
    return editingField === field ? (v ?? "") : formatarMoedaBR(v);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <div className="flex items-center gap-2">
            <PackageSearch className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold">SCM - Sistema de Controle de Movimentações</h1>
          </div>
          <Button variant="ghost" onClick={() => router.back()} className="text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
        <div className="border rounded-xl bg-card p-4 md:p-6 shadow-sm">
          <div className="mb-4">
            <span className="text-sm font-medium text-muted-foreground">Escolha seu caixa abaixo</span>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Button size="sm" className="w-full py-2" onClick={() => { setModalControleCaixaOpen(true); setCaixaNumeroSelecionado('01'); }}>Caixa 01</Button>
            <Button size="sm" className="w-full py-2" onClick={() => { setModalControleCaixaOpen(true); setCaixaNumeroSelecionado('02'); }}>Caixa 02</Button>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>SCM{selectedCaixa}</DialogTitle>
              <DialogDescription>Preencha os dados do caixa selecionado.</DialogDescription>
            </DialogHeader>
            <form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* 1. Data/Hora Abertura */}
                <div>
                  <label className="block text-xs font-medium mb-1">Data/Hora Abertura</label>
                  <Input name="dataHoraAbertura" value={formatarDataHoraBr(form.dataHoraAbertura) || ""} readOnly className="border-2 border-violet-400" />
                </div>
                {/* 2. Data/Hora Fechamento */}
                <div>
                  <label className="block text-xs font-medium mb-1">Data/Hora Fechamento</label>
                  <Input name="dataHoraFechamento" value={formatarDataHoraBr(form.dataHoraFechamento) || ""} readOnly className="border-2 border-violet-400" />
                </div>
                {/* 3. Caixa Número */}
                <div>
                  <label className="block text-xs font-medium mb-1">Caixa Número</label>
                  <Input name="caixaNumero" value={form.caixaNumero || selectedCaixa || ""} readOnly className="border-2 border-violet-400" />
                </div>
                {/* 4. Operador */}
                <div>
                  <label className="block text-xs font-medium mb-1">Operador</label>
                  <Input name="operador" value={form.operador || ""} readOnly className="border-2 border-violet-400" />
                </div>
                {/* 5. Débito - Visa */}
                <div>
                  <label className="block text-xs font-medium mb-1">Débito - Visa</label>
                  {isReadOnly('debitoVisa') ? (
                    <Input name="debitoVisa" value={getDisplayValue('debitoVisa')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="debitoVisa" value={getDisplayValue('debitoVisa')} onChange={handleChange} onFocus={() => handleFocus('debitoVisa')} onBlur={() => handleBlur('debitoVisa')} />
                  )}
                </div>
                {/* 6. Débito - Master */}
                <div>
                  <label className="block text-xs font-medium mb-1">Débito - Master</label>
                  {isReadOnly('debitoMaster') ? (
                    <Input name="debitoMaster" value={getDisplayValue('debitoMaster')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="debitoMaster" value={getDisplayValue('debitoMaster')} onChange={handleChange} onFocus={() => handleFocus('debitoMaster')} onBlur={() => handleBlur('debitoMaster')} />
                  )}
                </div>
                {/* 7. Débito - Elo */}
                <div>
                  <label className="block text-xs font-medium mb-1">Débito - Elo</label>
                  {isReadOnly('debitoElo') ? (
                    <Input name="debitoElo" value={getDisplayValue('debitoElo')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="debitoElo" value={getDisplayValue('debitoElo')} onChange={handleChange} onFocus={() => handleFocus('debitoElo')} onBlur={() => handleBlur('debitoElo')} />
                  )}
                </div>
                {/* 8. Débito - Cabal */}
                <div>
                  <label className="block text-xs font-medium mb-1">Débito - Cabal</label>
                  {isReadOnly('debitoCabal') ? (
                    <Input name="debitoCabal" value={getDisplayValue('debitoCabal')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="debitoCabal" value={getDisplayValue('debitoCabal')} onChange={handleChange} onFocus={() => handleFocus('debitoCabal')} onBlur={() => handleBlur('debitoCabal')} />
                  )}
                </div>
                {/* 9. Crédito - Visa */}
                <div>
                  <label className="block text-xs font-medium mb-1">Crédito - Visa</label>
                  {isReadOnly('creditoVisa') ? (
                    <Input name="creditoVisa" value={getDisplayValue('creditoVisa')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="creditoVisa" value={getDisplayValue('creditoVisa')} onChange={handleChange} onFocus={() => handleFocus('creditoVisa')} onBlur={() => handleBlur('creditoVisa')} />
                  )}
                </div>
                {/* 10. Crédito - Master */}
                <div>
                  <label className="block text-xs font-medium mb-1">Crédito - Master</label>
                  {isReadOnly('creditoMaster') ? (
                    <Input name="creditoMaster" value={getDisplayValue('creditoMaster')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="creditoMaster" value={getDisplayValue('creditoMaster')} onChange={handleChange} onFocus={() => handleFocus('creditoMaster')} onBlur={() => handleBlur('creditoMaster')} />
                  )}
                </div>
                {/* 11. Crédito - Elo */}
                <div>
                  <label className="block text-xs font-medium mb-1">Crédito - Elo</label>
                  {isReadOnly('creditoElo') ? (
                    <Input name="creditoElo" value={getDisplayValue('creditoElo')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="creditoElo" value={getDisplayValue('creditoElo')} onChange={handleChange} onFocus={() => handleFocus('creditoElo')} onBlur={() => handleBlur('creditoElo')} />
                  )}
                </div>
                {/* 12. Crédito - Cabal */}
                <div>
                  <label className="block text-xs font-medium mb-1">Crédito - Cabal</label>
                  {isReadOnly('creditoCabal') ? (
                    <Input name="creditoCabal" value={getDisplayValue('creditoCabal')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="creditoCabal" value={getDisplayValue('creditoCabal')} onChange={handleChange} onFocus={() => handleFocus('creditoCabal')} onBlur={() => handleBlur('creditoCabal')} />
                  )}
                </div>
                {/* 13. Crédito - Amex */}
                <div>
                  <label className="block text-xs font-medium mb-1">Crédito - Amex</label>
                  {isReadOnly('creditoAmex') ? (
                    <Input name="creditoAmex" value={getDisplayValue('creditoAmex')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="creditoAmex" value={getDisplayValue('creditoAmex')} onChange={handleChange} onFocus={() => handleFocus('creditoAmex')} onBlur={() => handleBlur('creditoAmex')} />
                  )}
                </div>
                {/* 14. Pix - Maquininha */}
                <div>
                  <label className="block text-xs font-medium mb-1">Pix - Maquininha</label>
                  {isReadOnly('pixMaquininha') ? (
                    <Input name="pixMaquininha" value={getDisplayValue('pixMaquininha')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="pixMaquininha" value={getDisplayValue('pixMaquininha')} onChange={handleChange} onFocus={() => handleFocus('pixMaquininha')} onBlur={() => handleBlur('pixMaquininha')} />
                  )}
                </div>
                {/* 15. Débito - Sistema */}
                <div>
                  <label className="block text-xs font-medium mb-1">Débito - Sistema</label>
                  {isReadOnly('debitoSistema') ? (
                    <Input name="debitoSistema" value={getDisplayValue('debitoSistema')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="debitoSistema" value={getDisplayValue('debitoSistema')} onChange={handleChange} onFocus={() => handleFocus('debitoSistema')} onBlur={() => handleBlur('debitoSistema')} />
                  )}
                </div>
                {/* 16. Crédito - Sistema */}
                <div>
                  <label className="block text-xs font-medium mb-1">Crédito - Sistema</label>
                  {isReadOnly('creditoSistema') ? (
                    <Input name="creditoSistema" value={getDisplayValue('creditoSistema')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="creditoSistema" value={getDisplayValue('creditoSistema')} onChange={handleChange} onFocus={() => handleFocus('creditoSistema')} onBlur={() => handleBlur('creditoSistema')} />
                  )}
                </div>
                {/* 17. Abertura de Caixa */}
                <div>
                  <label className="block text-xs font-medium mb-1">Abertura de Caixa</label>
                  {isReadOnly('aberturaCaixa') ? (
                    <Input name="aberturaCaixa" value={getDisplayValue('aberturaCaixa')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="aberturaCaixa" value={getDisplayValue('aberturaCaixa')} onChange={handleChange} onFocus={() => handleFocus('aberturaCaixa')} onBlur={() => handleBlur('aberturaCaixa')} />
                  )}
                </div>
                {/* 18. Entradas */}
                <div>
                  <label className="block text-xs font-medium mb-1">Entradas</label>
                  {isReadOnly('entradas') ? (
                    <Input name="entradas" value={getDisplayValue('entradas')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="entradas" value={getDisplayValue('entradas')} onChange={handleChange} onFocus={() => handleFocus('entradas')} onBlur={() => handleBlur('entradas')} />
                  )}
                </div>
                {/* 19. Saídas */}
                <div>
                  <label className="block text-xs font-medium mb-1">Saídas</label>
                  {isReadOnly('saidas') ? (
                    <Input name="saidas" value={getDisplayValue('saidas')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="saidas" value={getDisplayValue('saidas')} onChange={handleChange} onFocus={() => handleFocus('saidas')} onBlur={() => handleBlur('saidas')} />
                  )}
                </div>
                {/* 20. Fechamento */}
                <div>
                  <label className="block text-xs font-medium mb-1">Fechamento</label>
                  {isReadOnly('fechamento') ? (
                    <Input name="fechamento" value={getDisplayValue('fechamento')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="fechamento" value={getDisplayValue('fechamento')} onChange={handleChange} onFocus={() => handleFocus('fechamento')} onBlur={() => handleBlur('fechamento')} />
                  )}
                </div>
                {/* 21. Dinheiro */}
                <div>
                  <label className="block text-xs font-medium mb-1">Dinheiro</label>
                  {isReadOnly('dinheiro') ? (
                    <Input name="dinheiro" value={getDisplayValue('dinheiro')} readOnly className="border-2 border-violet-500 outline outline-2 outline-violet-400" />
                  ) : (
                    <Input name="dinheiro" value={getDisplayValue('dinheiro')} onChange={handleChange} onFocus={() => handleFocus('dinheiro')} onBlur={() => handleBlur('dinheiro')} />
                  )}
                </div>
                {/* 22. Resultado */}
                <div>
                  <label className="block text-xs font-medium mb-1">Resultado</label>
                  <div className="relative flex items-center">
                    {isReadOnly('resultado') ? (
                      <Input
                        name="resultado"
                        value={getDisplayValue('resultado')}
                        readOnly
                        className={`border-2 ${parseBRNumber(getDisplayValue('resultado')) < 0 ? 'border-red-500 outline outline-2 outline-red-400' : 'border-blue-500 outline outline-2 outline-blue-400'} pr-10`}
                      />
                    ) : (
                      <Input
                        name="resultado"
                        value={getDisplayValue('resultado')}
                        onChange={handleChange}
                        className="pr-10"
                        onFocus={() => handleFocus('resultado')}
                        onBlur={() => handleBlur('resultado')}
                      />
                    )}
                    {getDisplayValue('resultado') && parseBRNumber(getDisplayValue('resultado')) < 0 && (
                      <span className="absolute right-2 text-red-500 flex items-center">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 16V8M12 16l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                    {getDisplayValue('resultado') && parseBRNumber(getDisplayValue('resultado')) > 0 && (
                      <span className="absolute right-2 text-blue-500 flex items-center">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 8v8m0-8l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                  </div>
                </div>
                {/* 23. CPF do Operador */}
                <div>
                  <label className="block text-xs font-medium mb-1">CPF do Operador</label>
                  <Input name="cpf" value={form.cpf || ""} readOnly className="border-2 border-violet-400" />
                </div>
                {/* 24. Email do Operador */}
                <div>
                  <label className="block text-xs font-medium mb-1">Email do Operador</label>
                  <Input name="email" value={form.email || ""} readOnly className="border-2 border-violet-400" />
                </div>
                {/* 25. Observações / Motivo de Furo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">Observações / Motivo de Furo</label>
                  <Textarea
                    name="observacao"
                    placeholder="Digite aqui uma observação ou motivo de furo (opcional)"
                    onChange={handleChange}
                    value={form.observacao || ""}
                    onFocus={() => handleFocus('observacao')}
                    onBlur={() => handleBlur('observacao')}
                    className={
                      (focusedField === 'observacao' || (getDisplayValue('observacao') !== undefined && getDisplayValue('observacao') !== ''))
                        ? 'ring-2 ring-primary border-primary border-2 border-violet-500 outline outline-2 outline-violet-400'
                        : ''
                    }
                  />
                </div>
              </div>
              {/* Checkbox de autorização */}
              <div className="mt-6 flex items-center gap-2">
                <Checkbox checked={getDisplayValue('autorizacao')} onCheckedChange={handleCheckbox} id="autorizacao" />
                <label htmlFor="autorizacao" className="text-sm">
                  Eu <span className="font-semibold">{getDisplayValue('operador') || "Nome do Operador"}</span>, declaro, para os devidos fins, que autorizo a <span className="font-semibold">{getDisplayValue('loja') || lojaNome}</span> a efetuar o desconto de quaisquer diferenças apuradas durante a conferência do caixa sob minha responsabilidade.
                </label>
              </div>
              {/* Botão Enviar */}
              <DialogFooter className="mt-6">
                <Button onClick={handleConfirm} disabled={!isFormValid()} className="w-full">Enviar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Histórico dos caixas */}
        <div className="border rounded-xl bg-card p-4 md:p-6 shadow-sm mt-6">
          <h2 className="text-lg font-bold mb-4">Histórico de Movimentações</h2>
          {loadingHistorico ? (
            <div className="text-center text-muted-foreground">Carregando histórico...</div>
          ) : historico.length === 0 ? (
            <div className="text-center text-muted-foreground">Nenhuma movimentação encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-2 py-1 text-left">Data/Hora Fech.</th>
                    <th className="px-2 py-1 text-left">Operador</th>
                    <th className="px-2 py-1 text-left">Caixa</th>
                    <th className="px-2 py-1 text-right">Abertura</th>
                    <th className="px-2 py-1 text-right">Fechamento</th>
                    <th className="px-2 py-1 text-right">Resultado</th>
                    <th className="px-2 py-1 text-left">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((item, idx) => (
                    <tr key={item.id || idx} className="border-b last:border-0">
                      <td className="px-2 py-1 whitespace-nowrap">{new Date(item.data_hora).toLocaleString('pt-BR')}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{item.operador}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{item.caixa}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{item.abertura_caixa?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{item.fechamento?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{item.resultado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-2 py-1">{item.observacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Dialog open={modalControleCaixaOpen} onOpenChange={setModalControleCaixaOpen}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Controle de Caixa</DialogTitle>
              <DialogDescription>Filtre e selecione o caixa que deseja informar o fechamento.</DialogDescription>
            </DialogHeader>
            <SCMControleCaixa onSelecionarCaixa={(caixaObj: any) => {
              // Verifica se o caixa já foi conferido
              if (caixaObj.jaConferido) {
                toast.error("Este caixa já foi conferido e não pode ser selecionado novamente.");
                return;
              }

              const novoForm = {
                dataHoraAbertura: caixaObj.opened_at || '',
                dataHoraFechamento: caixaObj.closed_at || '',
                loja: caixaObj.loja || lojaNome,
                operador: caixaObj.opened_user?.name && caixaObj.opened_user?.last_name ? titleCase(`${caixaObj.opened_user.name} ${caixaObj.opened_user.last_name}`) : '',
                email: caixaObj.opened_user?.email || '',
                cpf: caixaObj.opened_user?.cpf || '',
                caixaNumero: caixaNumeroSelecionado || '',
                cash_id: caixaObj.cash_id,
                historico_id: caixaObj.id,
                debitoSistema: caixaObj.balance_history?.debit_card || '',
                creditoSistema: caixaObj.balance_history?.credit_card || '',
                pixMaquininha: caixaObj.balance_history?.pix || '',
                dinheiro: caixaObj.balance_history?.money || '',
                resultado: caixaObj.result_cash || '',
                aberturaCaixa: caixaObj.abertura_caixa || caixaObj.amount_on_open || '',
                entradas: caixaObj.entradas || caixaObj.in_result || '',
                saidas: caixaObj.saidas || caixaObj.out_result || '',
                fechamento: caixaObj.fechamento || caixaObj.amount_on_close || '',
                observacao: caixaObj.observation || '',
                autorizacao: false,
              };
              setForm(novoForm);
              setOpen(true);
              setModalControleCaixaOpen(false);
              const filledKeys = Object.keys(novoForm).filter(k => {
                const v: any = (novoForm as any)[k];
                return v !== undefined && v !== null && v !== '';
              });
              setPreFilledFields(new Set(filledKeys));
            }} />
          </DialogContent>
        </Dialog>
        <Dialog open={modalFechamentoOpen} onOpenChange={setModalFechamentoOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Fechamento do Caixa</DialogTitle>
              <DialogDescription>Preencha os dados do fechamento do caixa selecionado.</DialogDescription>
            </DialogHeader>
            {dadosCaixaSelecionado === null ? (
              <div className="text-center py-8">Carregando dados do caixa...</div>
            ) : (
              <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Data/Hora Abertura</label>
                    <Input name="dataHoraAbertura" value={formatarDataHoraBr(getDisplayValue('dataHoraAbertura')) || ""} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Data/Hora Fechamento</label>
                    <Input name="dataHoraFechamento" value={formatarDataHoraBr(getDisplayValue('dataHoraFechamento')) || ""} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Caixa Número</label>
                    <Input name="caixaNumero" value={getDisplayValue('caixaNumero')} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Nome do Operador</label>
                    <Input name="operador" value={getDisplayValue('operador')} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">CPF do Operador</label>
                    <Input name="cpf" value={getDisplayValue('cpf')} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Email do Operador</label>
                    <Input name="email" value={getDisplayValue('email')} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Dinheiro</label>
                    <Input name="dinheiro" value={getDisplayValue('dinheiro')} readOnly className={getDisplayValue('dinheiro') ? "border-2 border-violet-400" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Resultado</label>
                    <Input name="resultado" value={getDisplayValue('resultado')} readOnly className={`border-2 ${parseBRNumber(getDisplayValue('resultado')) < 0 ? 'border-red-500 outline outline-2 outline-red-400' : 'border-blue-500 outline outline-2 outline-blue-400'} pr-10`} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Débito - Sistema</label>
                    <Input name="debitoSistema" value={getDisplayValue('debitoSistema')} readOnly className={getDisplayValue('debitoSistema') ? "border-2 border-violet-400" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Crédito - Sistema</label>
                    <Input name="creditoSistema" value={getDisplayValue('creditoSistema')} readOnly className={getDisplayValue('creditoSistema') ? "border-2 border-violet-400" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Pix - Maquininha</label>
                    <Input name="pixMaquininha" value={getDisplayValue('pixMaquininha')} readOnly className={getDisplayValue('pixMaquininha') ? "border-2 border-violet-400" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Abertura de Caixa</label>
                    <Input name="aberturaCaixa" value={getDisplayValue('aberturaCaixa')} readOnly className={getDisplayValue('aberturaCaixa') ? "border-2 border-violet-400" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Entradas</label>
                    <Input name="entradas" value={getDisplayValue('entradas')} readOnly className={getDisplayValue('entradas') ? "border-2 border-violet-400" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Saídas</label>
                    <Input name="saidas" value={getDisplayValue('saidas')} readOnly className={getDisplayValue('saidas') ? "border-2 border-violet-400" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Fechamento</label>
                    <Input name="fechamento" value={getDisplayValue('fechamento')} readOnly className={getDisplayValue('fechamento') ? "border-2 border-violet-400" : ""} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1">Observações / Motivo de Furo</label>
                    <Textarea
                      name="observacao"
                      placeholder="Digite aqui uma observação ou motivo de furo (opcional)"
                      onChange={handleChange}
                      value={getDisplayValue('observacao')}
                      onFocus={() => handleFocus('observacao')}
                      onBlur={() => handleBlur('observacao')}
                      className={`${focusedField === 'observacao' || (getDisplayValue('observacao') !== undefined && getDisplayValue('observacao') !== '') ? 'ring-2 ring-primary border-primary' : ''}`}
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <Checkbox checked={getDisplayValue('autorizacao')} onCheckedChange={handleCheckbox} id="autorizacao" />
                  <label htmlFor="autorizacao" className="text-sm">
                    Eu <span className="font-semibold">{getDisplayValue('operador') || "Nome do Operador"}</span>, autorizo a loja <span className="font-semibold">{getDisplayValue('loja') || lojaNome}</span> o desconto de eventuais furos constatados na conferência deste caixa operado por mim.
                  </label>
                </div>
                <DialogFooter className="mt-6">
                  <Button onClick={handleConfirm} disabled={!isFormValid()} className="w-full">Enviar</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
} 