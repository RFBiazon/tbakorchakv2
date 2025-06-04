CREATE TABLE IF NOT EXISTS Caixa (
  id INTEGER PRIMARY KEY,
  cash_id INTEGER,
  opened_at TIMESTAMP,
  opened_by INTEGER REFERENCES Operador(id),
  amount_on_open NUMERIC,
  closed_by INTEGER REFERENCES Operador(id),
  amount_on_close NUMERIC,
  amount_on_cash NUMERIC,
  in_result NUMERIC,
  out_result NUMERIC,
  result_cash NUMERIC,
  observation TEXT,
  created_at TIMESTAMP,
  balance_history_id INTEGER REFERENCES BalanceHistory(id)
); 