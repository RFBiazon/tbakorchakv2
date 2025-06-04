import { createSupabaseClient } from './supabase'

interface Operador {
  id: number
  parent_id: number
  name: string
  last_name: string
  username: string
  email: string
  phone: string
  cpf: string
  level: number
  is_profile: boolean
  profile_permission: string | null
  image: string | null
  image_key: string | null
  full_name: string
  pin_code: string | null
}

interface BalanceHistory {
  id: number
  cash_history_id: number
  store_sale: number
  total_sales: number
  total_sales_with_cpf: number
  total_sales_without_cpf: number
  total_percent_with_cpf: string
  total_percent_without_cpf: string
  delivery_sale: number
  total: string
  total_store: string
  total_delivery: string
  total_ifood: string
  total_app: string
  total_others: string
  money: string
  credit_card: string
  debit_card: string
  online: string
  pix: string
  ticket: string
  change_amount: string
  created_at: string
  deleted_at: string | null
  qr_code: string | null
}

interface Caixa {
  id: number
  cash_id: number
  cash: number
  store_id: number
  backup_url: string | null
  opened_at: string
  opened_by: number
  amount_on_open: string
  closed_at: string
  closed_by: number
  amount_on_close: string
  amount_on_cash: string
  in_result: string
  out_result: string
  result_cash: string
  observation: string | null
  created_at: string
  deleted_at: string | null
  balance_history_id: number
  usd_exchange_rate: string | null
  ars_exchange_rate: string | null
  pyg_exchange_rate: string | null
  local_opened_at: string
  local_closed_at: string
  opened_user: Operador
  balance_history: BalanceHistory
}

// Função auxiliar para converter datas
function convertDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  
  // Se já estiver no formato YYYY-MM-DD, retorna como está
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr
  }
  
  // Converte de DD-MM-YYYY HH:mm:ss para YYYY-MM-DD HH:mm:ss
  const [datePart, timePart] = dateStr.split(' ')
  if (datePart && timePart) {
    const [day, month, year] = datePart.split(/[-\/]/)
    if (day && month && year) {
      return `${year}-${month}-${day} ${timePart}`
    }
  }
  
  return dateStr
}

export async function syncCaixaData(apiData: Caixa[], lojaId: string) {
  const supabase = createSupabaseClient(lojaId)
  try {
    // Primeiro, vamos sincronizar todos os operadores únicos
    const uniqueOperators = new Map<number, Operador>()
    apiData.forEach(caixa => {
      if (caixa.opened_user) {
        uniqueOperators.set(caixa.opened_user.id, caixa.opened_user)
      }
      if (caixa.closed_by && caixa.opened_user && caixa.opened_user.id !== caixa.closed_by) {
        console.log(`Operador que fechou (ID: ${caixa.closed_by}) precisa ser sincronizado`)
      }
    })

    console.log(`Sincronizando ${uniqueOperators.size} operadores únicos...`)

    // Sincronizar operadores únicos
    for (const operador of uniqueOperators.values()) {
      try {
        const { error: operadorError } = await supabase
          .from('Operador')
          .upsert({
            id: operador.id,
            parent_id: operador.parent_id,
            name: operador.name,
            last_name: operador.last_name,
            username: operador.username,
            email: operador.email,
            phone: operador.phone,
            cpf: operador.cpf,
            level: operador.level,
            is_profile: operador.is_profile,
            profile_permission: operador.profile_permission,
            image: operador.image,
            image_key: operador.image_key,
            full_name: operador.full_name,
            pin_code: operador.pin_code
          }, {
            onConflict: 'id'
          })

        if (operadorError) {
          console.error('Erro ao sincronizar operador:', {
            operadorId: operador.id,
            error: operadorError
          })
          throw operadorError
        }
      } catch (error) {
        console.error('Erro ao processar operador:', {
          operadorId: operador.id,
          error
        })
        throw error
      }
    }

    console.log(`Sincronizando ${apiData.length} caixas...`)

    // Agora vamos sincronizar cada caixa e seu balance history
    for (const caixa of apiData) {
      try {
        // 1. Primeiro sincronizamos o Caixa sem o balance_history_id
        console.log('Tentando sincronizar caixa:', {
          id: caixa.id,
          cash_id: caixa.cash_id,
          store_id: caixa.store_id
        })

        // Garantir que não estamos enviando o balance_history_id no primeiro insert
        const { balance_history_id, local_opened_at, local_closed_at, ...caixaDataWithoutBalanceHistory } = {
          id: caixa.id,
          cash_id: caixa.cash_id,
          cash: caixa.cash,
          store_id: caixa.store_id,
          backup_url: caixa.backup_url,
          opened_at: convertDate(caixa.opened_at),
          opened_by: caixa.opened_by,
          amount_on_open: caixa.amount_on_open,
          closed_at: convertDate(caixa.closed_at),
          closed_by: caixa.closed_by,
          amount_on_close: caixa.amount_on_close,
          amount_on_cash: caixa.amount_on_cash,
          in_result: caixa.in_result,
          out_result: caixa.out_result,
          result_cash: caixa.result_cash,
          observation: caixa.observation,
          created_at: convertDate(caixa.created_at),
          deleted_at: convertDate(caixa.deleted_at),
          usd_exchange_rate: caixa.usd_exchange_rate,
          ars_exchange_rate: caixa.ars_exchange_rate,
          pyg_exchange_rate: caixa.pyg_exchange_rate,
          balance_history_id: caixa.balance_history_id // Será removido pelo spread operator
        }

        console.log('Dados do caixa para inserção:', caixaDataWithoutBalanceHistory)

        const { data: caixaResult, error: caixaError } = await supabase
          .from('Caixa')
          .upsert(caixaDataWithoutBalanceHistory, {
            onConflict: 'id'
          })

        if (caixaError) {
          console.error('Erro ao sincronizar caixa:', {
            caixaId: caixa.id,
            error: caixaError,
            data: caixaDataWithoutBalanceHistory,
            result: caixaResult
          })
          throw caixaError
        }

        console.log('Caixa sincronizado com sucesso:', {
          id: caixa.id,
          result: caixaResult
        })

        // 2. Depois sincronizamos o BalanceHistory
        console.log('Tentando sincronizar balance history:', {
          id: caixa.balance_history.id,
          cash_history_id: caixa.id
        })

        const balanceHistoryData = {
          id: caixa.balance_history.id,
          cash_history_id: caixa.id,
          store_sale: caixa.balance_history.store_sale,
          total_sales: caixa.balance_history.total_sales,
          total_sales_with_cpf: caixa.balance_history.total_sales_with_cpf,
          total_sales_without_cpf: caixa.balance_history.total_sales_without_cpf,
          total_percent_with_cpf: caixa.balance_history.total_percent_with_cpf,
          total_percent_without_cpf: caixa.balance_history.total_percent_without_cpf,
          delivery_sale: caixa.balance_history.delivery_sale,
          total: caixa.balance_history.total,
          total_store: caixa.balance_history.total_store,
          total_delivery: caixa.balance_history.total_delivery,
          total_ifood: caixa.balance_history.total_ifood,
          total_app: caixa.balance_history.total_app,
          total_others: caixa.balance_history.total_others,
          money: caixa.balance_history.money,
          credit_card: caixa.balance_history.credit_card,
          debit_card: caixa.balance_history.debit_card,
          online: caixa.balance_history.online,
          pix: caixa.balance_history.pix,
          ticket: caixa.balance_history.ticket,
          change_amount: caixa.balance_history.change_amount,
          created_at: convertDate(caixa.balance_history.created_at),
          deleted_at: convertDate(caixa.balance_history.deleted_at),
          qr_code: caixa.balance_history.qr_code
        }

        const { data: balanceHistoryResult, error: balanceHistoryError } = await supabase
          .from('BalanceHistory')
          .upsert(balanceHistoryData, {
            onConflict: 'id'
          })

        if (balanceHistoryError) {
          console.error('Erro ao sincronizar balance history:', {
            balanceHistoryId: caixa.balance_history.id,
            error: balanceHistoryError,
            data: balanceHistoryData,
            result: balanceHistoryResult
          })
          throw balanceHistoryError
        }

        console.log('Balance history sincronizado com sucesso:', {
          id: caixa.balance_history.id,
          result: balanceHistoryResult
        })

        // 3. Por fim, atualizamos o Caixa com o balance_history_id
        const { error: updateError } = await supabase
          .from('Caixa')
          .update({ balance_history_id: caixa.balance_history.id })
          .eq('id', caixa.id)

        if (updateError) {
          console.error('Erro ao atualizar caixa com balance_history_id:', {
            caixaId: caixa.id,
            balanceHistoryId: caixa.balance_history.id,
            error: updateError
          })
          throw updateError
        }

        console.log('Caixa atualizado com balance_history_id com sucesso:', {
          id: caixa.id,
          balanceHistoryId: caixa.balance_history.id
        })
      } catch (error) {
        console.error('Erro ao processar caixa:', {
          caixaId: caixa.id,
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          errorDetails: error
        })
        throw error
      }
    }

    return { success: true, message: 'Data synchronized successfully' }
  } catch (error) {
    console.error('Error syncing data:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
} 