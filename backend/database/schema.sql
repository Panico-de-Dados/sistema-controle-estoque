-- =============================================================
-- Controle de Estoque / Arquivo Morto - schema inicial
-- Supabase PostgreSQL
-- Execute este arquivo inteiro no SQL Editor do Supabase.
-- Somente a API Express usa a chave service_role do backend/.env.
-- =============================================================

create extension if not exists "pgcrypto";

create table if not exists public.familias (
  id uuid primary key default gen_random_uuid(),
  codigo varchar(3) not null unique check (codigo ~ '^[0-9]{3}$'),
  nome text not null check (length(btrim(nome)) between 1 and 120),
  descricao text,
  created_at timestamptz not null default now()
);

create table if not exists public.tipos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias(id) on delete restrict,
  codigo varchar(3) not null check (codigo ~ '^[0-9]{3}$'),
  nome text not null check (length(btrim(nome)) between 1 and 120),
  descricao text,
  created_at timestamptz not null default now(),
  unique (familia_id, codigo),
  unique (id, familia_id)
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias(id) on delete restrict,
  tipo_id uuid not null,
  familia_codigo varchar(3) not null check (familia_codigo ~ '^[0-9]{3}$'),
  tipo_codigo varchar(3) not null check (tipo_codigo ~ '^[0-9]{3}$'),
  produto_codigo varchar(4) not null check (produto_codigo ~ '^[0-9]{4}$'),
  codigo_completo text generated always as
    (familia_codigo || '.' || tipo_codigo || '.' || produto_codigo) stored,
  nome text not null check (length(btrim(nome)) between 1 and 160),
  descricao text,
  localizacao text,
  quantidade integer not null default 0 check (quantidade >= 0),
  estoque_minimo integer not null default 0 check (estoque_minimo >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint produtos_tipo_da_familia_fk foreign key (tipo_id, familia_id)
    references public.tipos(id, familia_id) on delete restrict,
  unique (familia_codigo, tipo_codigo, produto_codigo),
  unique (codigo_completo)
);

create table if not exists public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete restrict,
  tipo text not null check (tipo in ('entrada', 'saida')),
  quantidade integer not null check (quantidade > 0),
  responsavel text not null check (length(btrim(responsavel)) between 1 and 120),
  motivo text,
  saldo_anterior integer not null check (saldo_anterior >= 0),
  saldo_novo integer not null check (saldo_novo >= 0),
  created_at timestamptz not null default now(),
  constraint movimentacao_saida_com_motivo check (
    tipo = 'entrada' or nullif(btrim(motivo), '') is not null
  )
);

-- Corrige a exclusao em cascata de versoes anteriores do schema.
alter table public.movimentacoes drop constraint if exists movimentacoes_produto_id_fkey;
alter table public.movimentacoes add constraint movimentacoes_produto_id_fkey
  foreign key (produto_id) references public.produtos(id) on delete restrict;

-- Atualiza bancos criados por versoes anteriores sem remover dados.
-- PostgreSQL nao oferece ADD CONSTRAINT IF NOT EXISTS, portanto cada
-- restricao e conferida no catalogo antes de ser adicionada.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'familias_codigo_check'
      and conrelid = 'public.familias'::regclass
  ) then
    alter table public.familias
      add constraint familias_codigo_check check (codigo ~ '^[0-9]{3}$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'familias_nome_check'
      and conrelid = 'public.familias'::regclass
  ) then
    alter table public.familias
      add constraint familias_nome_check
      check (length(btrim(nome)) between 1 and 120) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'tipos_codigo_check'
      and conrelid = 'public.tipos'::regclass
  ) then
    alter table public.tipos
      add constraint tipos_codigo_check check (codigo ~ '^[0-9]{3}$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'tipos_nome_check'
      and conrelid = 'public.tipos'::regclass
  ) then
    alter table public.tipos
      add constraint tipos_nome_check
      check (length(btrim(nome)) between 1 and 120) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'tipos_id_familia_id_key'
      and conrelid = 'public.tipos'::regclass
  ) then
    alter table public.tipos
      add constraint tipos_id_familia_id_key unique (id, familia_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'produtos_familia_codigo_check'
      and conrelid = 'public.produtos'::regclass
  ) then
    alter table public.produtos
      add constraint produtos_familia_codigo_check
      check (familia_codigo ~ '^[0-9]{3}$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'produtos_tipo_codigo_check'
      and conrelid = 'public.produtos'::regclass
  ) then
    alter table public.produtos
      add constraint produtos_tipo_codigo_check
      check (tipo_codigo ~ '^[0-9]{3}$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'produtos_produto_codigo_check'
      and conrelid = 'public.produtos'::regclass
  ) then
    alter table public.produtos
      add constraint produtos_produto_codigo_check
      check (produto_codigo ~ '^[0-9]{4}$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'produtos_nome_check'
      and conrelid = 'public.produtos'::regclass
  ) then
    alter table public.produtos
      add constraint produtos_nome_check
      check (length(btrim(nome)) between 1 and 160) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'produtos_codigo_completo_key'
      and conrelid = 'public.produtos'::regclass
  ) then
    alter table public.produtos
      add constraint produtos_codigo_completo_key unique (codigo_completo);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'produtos_tipo_da_familia_fk'
      and conrelid = 'public.produtos'::regclass
  ) then
    alter table public.produtos
      add constraint produtos_tipo_da_familia_fk
      foreign key (tipo_id, familia_id)
      references public.tipos(id, familia_id) on delete restrict not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'movimentacoes_responsavel_check'
      and conrelid = 'public.movimentacoes'::regclass
  ) then
    alter table public.movimentacoes
      add constraint movimentacoes_responsavel_check
      check (length(btrim(responsavel)) between 1 and 120) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'movimentacoes_saldo_anterior_check'
      and conrelid = 'public.movimentacoes'::regclass
  ) then
    alter table public.movimentacoes
      add constraint movimentacoes_saldo_anterior_check
      check (saldo_anterior >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'movimentacoes_saldo_novo_check'
      and conrelid = 'public.movimentacoes'::regclass
  ) then
    alter table public.movimentacoes
      add constraint movimentacoes_saldo_novo_check
      check (saldo_novo >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'movimentacao_saida_com_motivo'
      and conrelid = 'public.movimentacoes'::regclass
  ) then
    alter table public.movimentacoes
      add constraint movimentacao_saida_com_motivo check (
        tipo = 'entrada' or nullif(btrim(motivo), '') is not null
      ) not valid;
  end if;
end;
$$;

-- Garante que a exclusao de uma familia seja bloqueada quando houver tipos.
do $$
declare v_definicao text;
begin
  select pg_get_constraintdef(oid) into v_definicao
  from pg_constraint
  where conname = 'tipos_familia_id_fkey'
    and conrelid = 'public.tipos'::regclass;

  if v_definicao is null or v_definicao not like '%ON DELETE RESTRICT%' then
    alter table public.tipos drop constraint if exists tipos_familia_id_fkey;
    alter table public.tipos add constraint tipos_familia_id_fkey
      foreign key (familia_id) references public.familias(id)
      on delete restrict not valid;
  end if;
end;
$$;

alter table public.familias validate constraint familias_codigo_check;
alter table public.familias validate constraint familias_nome_check;
alter table public.tipos validate constraint tipos_codigo_check;
alter table public.tipos validate constraint tipos_nome_check;
alter table public.tipos validate constraint tipos_familia_id_fkey;
alter table public.produtos validate constraint produtos_familia_codigo_check;
alter table public.produtos validate constraint produtos_tipo_codigo_check;
alter table public.produtos validate constraint produtos_produto_codigo_check;
alter table public.produtos validate constraint produtos_nome_check;
alter table public.produtos validate constraint produtos_tipo_da_familia_fk;
alter table public.movimentacoes validate constraint movimentacoes_responsavel_check;
alter table public.movimentacoes validate constraint movimentacoes_saldo_anterior_check;
alter table public.movimentacoes validate constraint movimentacoes_saldo_novo_check;
alter table public.movimentacoes validate constraint movimentacao_saida_com_motivo;

create index if not exists idx_produtos_codigo_completo on public.produtos (codigo_completo);
create index if not exists idx_produtos_nome
  on public.produtos using gin (to_tsvector('portuguese', nome));
create index if not exists idx_produtos_familia_tipo on public.produtos (familia_id, tipo_id);
create index if not exists idx_movimentacoes_produto on public.movimentacoes (produto_id);
create index if not exists idx_movimentacoes_created_at on public.movimentacoes (created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_produtos_updated_at on public.produtos;
create trigger trg_produtos_updated_at before update on public.produtos
for each row execute function public.set_updated_at();

-- Geracao atomica do codigo FFF.
create or replace function public.criar_familia(p_nome text, p_descricao text default null)
returns setof public.familias language plpgsql security invoker set search_path = public as $$
declare v_proximo integer;
begin
  if nullif(btrim(p_nome), '') is null then
    raise exception 'O nome da familia e obrigatorio.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('familias_codigo'));
  select coalesce(max(codigo::integer), 0) + 1 into v_proximo from public.familias;
  if v_proximo > 999 then
    raise exception 'Limite de codigos de familia atingido.' using errcode = '22003';
  end if;
  return query insert into public.familias (codigo, nome, descricao)
  values (lpad(v_proximo::text, 3, '0'), btrim(p_nome), nullif(btrim(p_descricao), ''))
  returning *;
end;
$$;

-- Geracao atomica do codigo TTT dentro da familia.
create or replace function public.criar_tipo(
  p_familia_id uuid, p_nome text, p_descricao text default null
)
returns setof public.tipos language plpgsql security invoker set search_path = public as $$
declare v_proximo integer;
begin
  if not exists (select 1 from public.familias where id = p_familia_id) then
    raise exception 'Familia nao encontrada.' using errcode = 'P0002';
  end if;
  if nullif(btrim(p_nome), '') is null then
    raise exception 'O nome do tipo e obrigatorio.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('tipos:' || p_familia_id::text, 0));
  select coalesce(max(codigo::integer), 0) + 1 into v_proximo
  from public.tipos where familia_id = p_familia_id;
  if v_proximo > 999 then
    raise exception 'Limite de codigos de tipo atingido.' using errcode = '22003';
  end if;
  return query insert into public.tipos (familia_id, codigo, nome, descricao)
  values (p_familia_id, lpad(v_proximo::text, 3, '0'), btrim(p_nome), nullif(btrim(p_descricao), ''))
  returning *;
end;
$$;

-- Cadastro atomico e validado do produto/SKU.
create or replace function public.criar_produto(
  p_familia_id uuid, p_tipo_id uuid, p_nome text,
  p_descricao text default null, p_localizacao text default null,
  p_quantidade integer default 0, p_estoque_minimo integer default 0
)
returns setof public.produtos language plpgsql security invoker set search_path = public as $$
declare
  v_familia_codigo varchar(3);
  v_tipo_codigo varchar(3);
  v_proximo integer;
begin
  select f.codigo, t.codigo into v_familia_codigo, v_tipo_codigo
  from public.familias f join public.tipos t on t.familia_id = f.id
  where f.id = p_familia_id and t.id = p_tipo_id;
  if not found then
    raise exception 'Familia/tipo invalidos ou incompativeis.' using errcode = '22023';
  end if;
  if nullif(btrim(p_nome), '') is null then
    raise exception 'O nome do produto e obrigatorio.' using errcode = '22023';
  end if;
  if p_quantidade < 0 or p_estoque_minimo < 0 then
    raise exception 'Quantidade e estoque minimo devem ser inteiros nao negativos.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(
    hashtextextended('produtos:' || p_familia_id::text || ':' || p_tipo_id::text, 0)
  );
  select coalesce(max(produto_codigo::integer), 0) + 1 into v_proximo
  from public.produtos where familia_id = p_familia_id and tipo_id = p_tipo_id;
  if v_proximo > 9999 then
    raise exception 'Limite de codigos de produto atingido.' using errcode = '22003';
  end if;
  return query insert into public.produtos (
    familia_id, tipo_id, familia_codigo, tipo_codigo, produto_codigo,
    nome, descricao, localizacao, quantidade, estoque_minimo
  ) values (
    p_familia_id, p_tipo_id, v_familia_codigo, v_tipo_codigo,
    lpad(v_proximo::text, 4, '0'), btrim(p_nome), nullif(btrim(p_descricao), ''),
    nullif(btrim(p_localizacao), ''), p_quantidade, p_estoque_minimo
  ) returning *;
end;
$$;

-- Entrada/saida atomica: saldo e historico na mesma transacao.
create or replace function public.registrar_movimentacao(
  p_codigo_completo text, p_tipo text, p_quantidade integer,
  p_responsavel text, p_motivo text default null
)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_produto public.produtos%rowtype;
  v_saldo_novo integer;
  v_movimentacao public.movimentacoes%rowtype;
begin
  if p_tipo not in ('entrada', 'saida') then
    raise exception 'Tipo de movimentacao invalido.' using errcode = '22023';
  end if;
  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'A quantidade deve ser um inteiro maior que zero.' using errcode = '22023';
  end if;
  if nullif(btrim(p_responsavel), '') is null then
    raise exception 'O responsavel e obrigatorio.' using errcode = '22023';
  end if;
  if p_tipo = 'saida' and nullif(btrim(p_motivo), '') is null then
    raise exception 'O motivo da retirada e obrigatorio.' using errcode = '22023';
  end if;
  select * into v_produto from public.produtos
  where codigo_completo = p_codigo_completo for update;
  if not found then
    raise exception 'Produto nao encontrado.' using errcode = 'P0002';
  end if;
  if p_tipo = 'saida' and p_quantidade > v_produto.quantidade then
    raise exception 'Saldo insuficiente. Saldo atual: %.', v_produto.quantidade using errcode = 'P0001';
  end if;
  v_saldo_novo := case when p_tipo = 'entrada'
    then v_produto.quantidade + p_quantidade else v_produto.quantidade - p_quantidade end;
  update public.produtos set quantidade = v_saldo_novo where id = v_produto.id;
  insert into public.movimentacoes (
    produto_id, tipo, quantidade, responsavel, motivo, saldo_anterior, saldo_novo
  ) values (
    v_produto.id, p_tipo, p_quantidade, btrim(p_responsavel),
    case when p_tipo = 'saida' then btrim(p_motivo) else null end,
    v_produto.quantidade, v_saldo_novo
  ) returning * into v_movimentacao;
  return jsonb_build_object(
    'movimentacao', to_jsonb(v_movimentacao), 'saldo_novo', v_saldo_novo,
    'produto', to_jsonb(v_produto) || jsonb_build_object('quantidade', v_saldo_novo)
  );
end;
$$;

-- Dados de demonstracao idempotentes.
insert into public.familias (codigo, nome, descricao)
values ('001', 'Documentos', 'Arquivos e documentacao administrativa')
on conflict (codigo) do nothing;
insert into public.tipos (familia_id, codigo, nome, descricao)
select id, '001', 'Caixas de Arquivo', 'Caixas padrao de arquivo morto'
from public.familias where codigo = '001'
on conflict (familia_id, codigo) do nothing;

-- Data API fechada para clientes publicos; apenas o backend e autorizado.
alter table public.familias enable row level security;
alter table public.tipos enable row level security;
alter table public.produtos enable row level security;
alter table public.movimentacoes enable row level security;
revoke all on table public.familias, public.tipos, public.produtos, public.movimentacoes
  from anon, authenticated;
grant select, insert, update, delete
  on table public.familias, public.tipos, public.produtos, public.movimentacoes to service_role;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.criar_familia(text, text) from public, anon, authenticated;
revoke execute on function public.criar_tipo(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.criar_produto(uuid, uuid, text, text, text, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.registrar_movimentacao(text, text, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.criar_familia(text, text) to service_role;
grant execute on function public.criar_tipo(uuid, text, text) to service_role;
grant execute on function public.criar_produto(uuid, uuid, text, text, text, integer, integer)
  to service_role;
grant execute on function public.registrar_movimentacao(text, text, integer, text, text)
  to service_role;
