CREATE TABLE IF NOT EXISTS BalanceHistory (
  id INTEGER PRIMARY KEY,
  cash_history_id INTEGER REFERENCES Caixa(id),
  total NUMERIC,
  total_store NUMERIC,
  money NUMERIC,
  credit_card NUMERIC,
  debit_card NUMERIC,
  online NUMERIC,
  pix NUMERIC,
  ticket NUMERIC,
  created_at TIMESTAMP

ALTER TABLE Caixa
  ADD CONSTRAINT fk_caixa_balancehistory
  FOREIGN KEY (balance_history_id) REFERENCES BalanceHistory(id);

ALTER TABLE BalanceHistory
  ADD CONSTRAINT fk_balancehistory_caixa
  FOREIGN KEY (cash_history_id) REFERENCES Caixa(id);

); 

