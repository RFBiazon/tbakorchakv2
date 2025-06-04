import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export interface EmployeeCadastro {
  unidade: string;
  razao_social: string;
  cnpj: string;
  dados_registro: {
    numero_registro_esocial: string;
    data_contratacao: string;
    cargo_funcao: string;
    departamento: string;
    turno: string;
    carga_horaria: string;
    data_exame_admissional: string;
    salario: string;
    descanso_semanal: string;
  };
  informacoes_pessoais: {
    nome: string;
    situacao: string;
    nome_pai: string;
    nome_mae: string;
    cidade_nascimento: string;
    rg: string;
    orgao_emissor_rg: string;
    cpf: string;
    data_nascimento: string;
    ctps: string;
    pis_nis: string;
    celular: string;
    email: string;
    necessita_vale_transporte: boolean;
    quant_filhos_ate_14: number;
    celular_parente: string;
    endereco: {
      logradouro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
  };
  tamanhos_uniformes: {
    camiseta: string;
    luva: string;
    calca: string;
    bota_sapato: string;
  };
  declaracoes_enviadas: {
    chave: string;
    uniforme: string;
    epis: string;
    vale_transporte: string;
  };
  documentos_em_anexo: {
    rg: string;
    cpf: string;
    habilitacao: string;
    comprovante_residencia: string;
    ctps: string;
    nis: string;
    foto_3x4: string;
    documentos_filhos_menores_14: string;
    exame_admissional: string;
    carteirinha_vacinacao: string;
  };
  dados_bancarios: {
    banco: string;
    numero_banco: string;
    agencia: string;
    conta: string;
    tipo_conta: string;
    pix: string;
  };
  informacoes_estrangeiro: {
    cartao_modelo_19: string;
    casado_com_brasileiro: string;
    nome_conjuge: string;
    data_chegada_brasil: string;
    numero_registro_cartorio: string;
    naturalizado: string;
    quantidade_filhos_brasil: string;
    cor: string;
    altura: string;
    peso: string;
    olhos: string;
    sinais: string;
    cabelos: string;
  };
  ocorrencias?: Array<{
    codigo: number;
    data: string;
    cidade: string;
    ocorrencia: string;
    motivo: string;
    observacao_2?: string;
    observacao_3?: string;
  }>;
}

export interface EmployeeFullCardProps {
  employee: EmployeeCadastro;
  employeeId: string;
}

export function EmployeeFullCard({ employee, employeeId }: EmployeeFullCardProps) {
  const router = useRouter()
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  const statusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ATIVO": return "bg-green-500"
      case "DESLIGADO": return "bg-red-500"
      case "FÉRIAS": return "bg-blue-500"
      case "AFASTADO": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/gestao-rh/${employeeId}/view`)}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalhes de ${employee.informacoes_pessoais.nome}`}
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarFallback>{getInitials(employee.informacoes_pessoais.nome)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-lg">{employee.informacoes_pessoais.nome}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{employee.dados_registro.cargo_funcao}</Badge>
            <Badge className={statusColor(employee.informacoes_pessoais.situacao)}>{employee.informacoes_pessoais.situacao}</Badge>
          </div>
          <span className="text-xs text-muted-foreground mt-1">{employee.unidade}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Departamento:</span> {employee.dados_registro.departamento}</div>
          <div><span className="text-muted-foreground">Admissão:</span> {employee.dados_registro.data_contratacao}</div>
          <div><span className="text-muted-foreground">Horário:</span> {employee.dados_registro.carga_horaria}</div>
          <div><span className="text-muted-foreground">Celular:</span> {employee.informacoes_pessoais.celular}</div>
          <div><span className="text-muted-foreground">E-mail:</span> {employee.informacoes_pessoais.email}</div>
          <div><span className="text-muted-foreground">Salário:</span> {employee.dados_registro.salario}</div>
        </div>
      </CardContent>
    </Card>
  )
} 