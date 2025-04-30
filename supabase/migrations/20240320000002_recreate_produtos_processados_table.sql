-- Drop existing table if it exists
drop table if exists public.produtos_processados;

-- Create produtos_processados table
create table if not exists public.produtos_processados (
  id bigint primary key generated always as identity,
  conferencia_id bigint not null references public.conferidos(id) on delete cascade,
  produtos_processados jsonb default '[]'::jsonb,
  data_processamento timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for faster lookups
create index if not exists produtos_processados_conferencia_id_idx 
  on public.produtos_processados(conferencia_id);
create index if not exists produtos_processados_jsonb_idx 
  on public.produtos_processados using gin (produtos_processados);

-- Enable Row Level Security
alter table public.produtos_processados enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Authenticated users can read produtos_processados" on public.produtos_processados;
drop policy if exists "Authenticated users can insert produtos_processados" on public.produtos_processados;
drop policy if exists "Authenticated users can update produtos_processados" on public.produtos_processados;

-- Create policies with more permissive access
create policy "Enable read access for authenticated users"
  on public.produtos_processados
  for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users"
  on public.produtos_processados
  for insert
  to authenticated
  with check (true);

create policy "Enable update access for authenticated users"
  on public.produtos_processados
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Enable delete access for authenticated users"
  on public.produtos_processados
  for delete
  to authenticated
  using (true);

-- Grant necessary permissions
grant all privileges on public.produtos_processados to authenticated;
grant usage on sequence public.produtos_processados_id_seq to authenticated;

-- Create function to automatically update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically update updated_at
create trigger handle_produtos_processados_updated_at
  before update on public.produtos_processados
  for each row
  execute procedure public.handle_updated_at();

-- Add table comment
comment on table public.produtos_processados is 
  'Tabela para rastrear produtos processados de cada conferência';

-- Add column comments
comment on column public.produtos_processados.produtos_processados is 
  'Array de objetos JSON contendo {nome: string, quantidade_processada: number} para cada produto';
comment on column public.produtos_processados.conferencia_id is 
  'ID da conferência relacionada';
comment on column public.produtos_processados.data_processamento is 
  'Data e hora do último processamento'; 