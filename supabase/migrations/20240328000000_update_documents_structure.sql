-- Adicionar novas colunas à tabela documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS numero_pedido VARCHAR,
ADD COLUMN IF NOT EXISTS data_pedido TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS produtos JSONB DEFAULT '[]'::jsonb;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_documents_numero_pedido ON documents(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_documents_data_pedido ON documents(data_pedido);
CREATE INDEX IF NOT EXISTS idx_documents_produtos ON documents USING gin (produtos);

-- Atualizar comentários das colunas
COMMENT ON COLUMN documents.numero_pedido IS 'Número do pedido extraído do CSV';
COMMENT ON COLUMN documents.data_pedido IS 'Data do pedido';
COMMENT ON COLUMN documents.produtos IS 'Array de objetos JSON contendo {nome: string, quantidade: number} para cada produto'; 