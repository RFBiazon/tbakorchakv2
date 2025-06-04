import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega as variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_TOLEDO01;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY_TOLEDO01;

if (!supabaseUrl || !supabaseKey) {
  console.error('Credenciais do Supabase não encontradas no ambiente');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testEmployee = {
  nome: "ALESSANDRO PAULO DA SILVA",
  unidade: "Toledo 01",
  razao_social: "Empresa Exemplo Ltda",
  cnpj: "00.000.000/0001-00",
  dados_registro: {
    numero_registro_esocial: "",
    data_contratacao: "01/01/2020",
    cargo_funcao: "Operador de Caixa",
    departamento: "Financeiro",
    turno: "08:00 - 17:00",
    carga_horaria: "44h semanais",
    data_exame_admissional: "01/01/2020",
    salario: "R$ 2.000,00",
    descanso_semanal: "Domingo"
  },
  informacoes_pessoais: {
    nome: "ALESSANDRO PAULO DA SILVA",
    situacao: "ATIVO",
    nome_pai: "Fulano da Silva",
    nome_mae: "Fulana de Tal",
    cidade_nascimento: "Cidade Exemplo - PR",
    rg: "0.000.000",
    orgao_emissor_rg: "SSP/PR",
    cpf: "000.000.000-00",
    data_nascimento: "01/01/1990",
    ctps: "123456/000-0 PR",
    pis_nis: "123.45678.90-1",
    celular: "44 9 0000-0000",
    email: "alessandro@email.com",
    necessita_vale_transporte: true,
    quant_filhos_ate_14: 0,
    celular_parente: "",
    endereco: {
      logradouro: "Rua Exemplo, 123",
      cidade: "Jaraguá do Sul",
      estado: "SC",
      cep: "89255-000"
    }
  },
  tamanhos_uniformes: {
    camiseta: "M",
    luva: "M",
    calca: "40",
    bota_sapato: "40"
  },
  declaracoes_enviadas: {
    chave: "OK",
    uniforme: "OK",
    epis: "OK",
    vale_transporte: "OK"
  },
  documentos_em_anexo: {
    rg: "OK",
    cpf: "OK",
    habilitacao: "N/A",
    comprovante_residencia: "OK",
    ctps: "OK",
    nis: "OK",
    foto_3x4: "OK",
    documentos_filhos_menores_14: "N/A",
    exame_admissional: "OK",
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
  ocorrencias: [
    {
      codigo: 101,
      data: "06/02/2024",
      cidade: "Jaraguá do Sul",
      ocorrencia: "Advertência Escrita",
      motivo: "Advertência por falta injustificada no dia 05/02/2024",
      observacao_2: "",
      observacao_3: ""
    },
    {
      codigo: 102,
      data: "05/02/2024",
      cidade: "Jaraguá do Sul",
      ocorrencia: "Falta Descontada",
      motivo: "Falta sem justificativa",
      observacao_2: "",
      observacao_3: ""
    }
  ]
};

async function testCreateEmployee() {
  try {
    console.log('Iniciando teste de cadastro de funcionário...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey?.substring(0, 10) + '...');
    
    const { data, error } = await supabase
      .from('employees')
      .insert([
        {
          store_id: 'toledo01',
          employee_data: testEmployee
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Funcionário cadastrado com sucesso:', data);
  } catch (error) {
    console.error('Erro ao cadastrar funcionário:', error);
  }
}

testCreateEmployee(); 