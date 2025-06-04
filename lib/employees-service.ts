import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

export interface EmployeeData {
  nome: string;
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
  tamanhos_uniformes?: {
    camiseta: string;
    luva: string;
    calca: string;
    bota_sapato: string;
  };
  declaracoes_enviadas?: {
    chave: string;
    uniforme: string;
    epis: string;
    vale_transporte: string;
  };
  documentos_em_anexo?: {
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
  dados_bancarios?: {
    banco: string;
    numero_banco: string;
    agencia: string;
    conta: string;
    tipo_conta: string;
    pix: string;
  };
  informacoes_estrangeiro?: {
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

export class EmployeesService {
  static async getEmployeesByStore(storeId: string) {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('employees')
      .select('*');

    if (storeId) {
      query = query.eq('employee_data->>unidade', storeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async getEmployeeById(id: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createEmployee(employeeData: EmployeeData) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('employees')
      .insert([
        {
          employee_data: employeeData
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateEmployee(id: string, employeeData: Partial<EmployeeData>) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('employees')
      .update({ employee_data: employeeData })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteEmployee(id: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async updateEmployeeStatus(id: string, status: string) {
    const { data: employee } = await this.getEmployeeById(id);
    if (!employee) throw new Error('Funcionário não encontrado');

    const updatedData = {
      ...employee.employee_data,
      informacoes_pessoais: {
        ...employee.employee_data.informacoes_pessoais,
        situacao: status
      }
    };

    return this.updateEmployee(id, updatedData);
  }

  static async addOcorrencia(id: string, ocorrencia: {
    codigo: number;
    data: string;
    cidade: string;
    ocorrencia: string;
    motivo: string;
    observacao_2?: string;
    observacao_3?: string;
  }) {
    const { data: employee } = await this.getEmployeeById(id);
    if (!employee) throw new Error('Funcionário não encontrado');

    const updatedData = {
      ...employee.employee_data,
      ocorrencias: [
        ...(employee.employee_data.ocorrencias || []),
        ocorrencia
      ]
    };

    return this.updateEmployee(id, updatedData);
  }

  static async searchEmployees(storeId: string, searchTerm: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_data->>unidade', storeId)
      .or(`employee_data->>'nome'.ilike.%${searchTerm}%,employee_data->'informacoes_pessoais'->>'cpf'.ilike.%${searchTerm}%`);

    if (error) throw error;
    return data;
  }
} 