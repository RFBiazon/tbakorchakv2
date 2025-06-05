-- Adiciona a coluna historico_id na tabela scm_movimentacoes
ALTER TABLE scm_movimentacoes
ADD COLUMN historico_id INTEGER;

-- Adiciona índice para melhorar a performance das consultas
CREATE INDEX idx_scm_movimentacoes_historico_id ON scm_movimentacoes(historico_id);

-- Adiciona comentário na coluna para documentação
COMMENT ON COLUMN scm_movimentacoes.historico_id IS 'ID único do histórico do caixa, usado para verificar se o caixa já foi conferido';