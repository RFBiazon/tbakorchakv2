-- Adiciona a coluna documents_jsonb para armazenar os documentos anexados
ALTER TABLE employees ADD COLUMN IF NOT EXISTS documents_jsonb JSONB;

COMMENT ON COLUMN employees.documents_jsonb IS 'Armazena informações dos documentos anexados (nome, tipo, data, link, etc) em formato JSONB.'; 