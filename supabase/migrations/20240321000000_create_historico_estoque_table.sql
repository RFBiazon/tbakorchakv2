-- Create historico_estoque table
create table if not exists public.historico_estoque (
  id bigint primary key generated always as identity,
  conferencia_id bigint not null references public.conferidos(id) on delete cascade,
  produto_nome text not null,
  categoria text not null,
  produto_id bigint not null,
  quantidade_pedida integer not null,
  quantidade_recebida integer not null,
  quantidade_faltante integer not null,
  data_atualizacao timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes
create index if not exists historico_estoque_conferencia_id_idx 
  on public.historico_estoque(conferencia_id);
create index if not exists historico_estoque_produto_id_categoria_idx 
  on public.historico_estoque(produto_id, categoria);

-- Enable RLS
alter table public.historico_estoque enable row level security;

-- Create policies
create policy "Enable read access for authenticated users"
  on public.historico_estoque
  for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users"
  on public.historico_estoque
  for insert
  to authenticated
  with check (true);

create policy "Enable update access for authenticated users"
  on public.historico_estoque
  for update
  to authenticated
  using (true)
  with check (true);

-- Create trigger for updated_at
create trigger handle_historico_estoque_updated_at
  before update on public.historico_estoque
  for each row
  execute procedure public.handle_updated_at(); 