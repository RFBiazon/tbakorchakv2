-- Tabela principal
CREATE TABLE IF NOT EXISTS public.scm_movimentacoes (
    id                bigserial PRIMARY KEY,
    data_hora         timestamptz        NOT NULL,
    loja              text               NOT NULL,
    operador          text,
    cpf_operador      varchar(11),
    email_operador    text,
    caixa             varchar(10),

    debito_visa       numeric(14,2) DEFAULT 0,
    debito_master     numeric(14,2) DEFAULT 0,
    debito_elo        numeric(14,2) DEFAULT 0,
    debito_cabal      numeric(14,2) DEFAULT 0,

    credito_visa      numeric(14,2) DEFAULT 0,
    credito_master    numeric(14,2) DEFAULT 0,
    credito_elo       numeric(14,2) DEFAULT 0,
    credito_cabal     numeric(14,2) DEFAULT 0,
    credito_amex      numeric(14,2) DEFAULT 0,

    pix_maquininha    numeric(14,2) DEFAULT 0,
    debito_sistema    numeric(14,2) DEFAULT 0,
    credito_sistema   numeric(14,2) DEFAULT 0,

    abertura_caixa    numeric(14,2) DEFAULT 0,
    entradas          numeric(14,2) DEFAULT 0,
    saidas            numeric(14,2) DEFAULT 0,
    fechamento        numeric(14,2) DEFAULT 0,

    dinheiro          numeric(14,2) DEFAULT 0,
    resultado         numeric(14,2) DEFAULT 0,

    observacao        text,
    autorizacao       boolean         DEFAULT false,

    criado_em         timestamptz     DEFAULT now()
);

-- Para quem já tem a tabela e só precisa acrescentar campos novos:
ALTER TABLE public.scm_movimentacoes
    ADD COLUMN IF NOT EXISTS email_operador   text,
    ADD COLUMN IF NOT EXISTS credito_amex     numeric(14,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS resultado        numeric(14,2) DEFAULT 0;