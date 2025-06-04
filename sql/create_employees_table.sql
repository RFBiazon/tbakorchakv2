-- Criar a tabela de funcionários sem store_id
CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar índice para busca por CPF (dentro do JSONB)
CREATE INDEX idx_employees_cpf ON employees((employee_data->'informacoes_pessoais'->>'cpf'));

-- Criar índice para busca por nome (dentro do JSONB)
CREATE INDEX idx_employees_nome ON employees((employee_data->>'nome'));

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar o updated_at
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar políticas de acesso (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Política para leitura (todos os usuários autenticados podem ler)
CREATE POLICY "Usuários autenticados podem ler funcionários"
ON employees FOR SELECT
TO authenticated
USING (true);

-- Política para inserção (apenas usuários autenticados podem inserir)
CREATE POLICY "Usuários autenticados podem inserir funcionários"
ON employees FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para atualização (apenas usuários autenticados podem atualizar)
CREATE POLICY "Usuários autenticados podem atualizar funcionários"
ON employees FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para deleção (apenas usuários autenticados podem deletar funcionários)
CREATE POLICY "Usuários autenticados podem deletar funcionários"
ON employees FOR DELETE
TO authenticated
USING (true);