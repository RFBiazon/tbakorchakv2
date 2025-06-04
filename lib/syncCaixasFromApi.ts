import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function syncCaixasFromApi(apiData: any[]) {
  for (const caixa of apiData) {
    // 1. Upsert Operador
    const operador = caixa.opened_user;
    if (operador) {
      await supabase
        .from('Operador')
        .upsert([{
          id: operador.id,
          parent_id: operador.parent_id,
          name: operador.name,
          last_name: operador.last_name,
          username: operador.username,
          email: operador.email,
          phone: operador.phone,
          cpf: operador.cpf,
          profile: operador.profile,
          created_at: operador.created_at
        }], { onConflict: 'id' });
    }

    // 2. Upsert BalanceHistory
    const bh = caixa.balance_history;
    if (bh) {
      await supabase
        .from('BalanceHistory')
        .upsert([{
          id: bh.id,
          cash_history_id: bh.cash_history_id,
          total: bh.total,
          total_store: bh.total_store,
          money: bh.money,
          credit_card: bh.credit_card,
          debit_card: bh.debit_card,
          online: bh.online,
          pix: bh.pix,
          ticket: bh.ticket,
          created_at: bh.created_at
        }], { onConflict: 'id' });
    }

    // 3. Upsert Caixa
    await supabase
      .from('Caixa')
      .upsert([{
        id: caixa.id,
        cash_id: caixa.cash_id,
        opened_at: caixa.opened_at,
        opened_by: operador?.id,
        amount_on_open: caixa.amount_on_open,
        closed_by: caixa.closed_by,
        amount_on_close: caixa.amount_on_close,
        amount_on_cash: caixa.amount_on_cash,
        in_result: caixa.in_result,
        out_result: caixa.out_result,
        result_cash: caixa.result_cash,
        observation: caixa.observation,
        created_at: caixa.created_at,
        balance_history_id: bh?.id
      }], { onConflict: 'id' });
  }
} 