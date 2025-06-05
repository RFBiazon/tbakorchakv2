-- Adiciona a coluna cash_id na tabela scm_movimentacoes
ALTER TABLE scm_movimentacoes
ADD COLUMN cash_id INTEGER;

-- Adiciona um índice para melhorar a performance das consultas por cash_id
CREATE INDEX idx_scm_movimentacoes_cash_id ON scm_movimentacoes(cash_id);

-- Adiciona um comentário na coluna para documentação
COMMENT ON COLUMN scm_movimentacoes.cash_id IS 'ID do caixa no sistema de caixa, usado para verificar se o caixa já foi conferido';