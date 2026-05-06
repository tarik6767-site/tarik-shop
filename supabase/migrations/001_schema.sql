-- Enable UUID extension
create extension if not exists "uuid-ossp";

create table winkel (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  created_at timestamptz default now()
);

create table gebruiker (
  id uuid primary key references auth.users(id) on delete cascade,
  naam text not null,
  email text not null,
  winkel_id uuid references winkel(id)
);

create table medewerker (
  id uuid primary key default gen_random_uuid(),
  gebruiker_id uuid references gebruiker(id) on delete cascade,
  winkel_id uuid references winkel(id)
);

create table producten (
  id uuid primary key default gen_random_uuid(),
  winkel_id uuid references winkel(id),
  naam text not null,
  prijs numeric(10,2) not null,
  aantal int not null default 0,
  foto_url text,
  created_at timestamptz default now()
);

create table winkelmand (
  id uuid primary key default gen_random_uuid(),
  gebruiker_id uuid unique references gebruiker(id) on delete cascade
);

create table winkelmand_items (
  id uuid primary key default gen_random_uuid(),
  winkelmand_id uuid references winkelmand(id) on delete cascade,
  product_id uuid references producten(id),
  aantal int not null default 1
);

create table bestellingen (
  id uuid primary key default gen_random_uuid(),
  gebruiker_id uuid references gebruiker(id),
  status text not null default 'in_behandeling',
  created_at timestamptz default now()
);

create table bestelling_items (
  id uuid primary key default gen_random_uuid(),
  bestelling_id uuid references bestellingen(id) on delete cascade,
  product_id uuid references producten(id),
  aantal int not null,
  prijs_per_stuk numeric(10,2) not null
);

-- RLS policies
alter table gebruiker enable row level security;
alter table medewerker enable row level security;
alter table producten enable row level security;
alter table winkelmand enable row level security;
alter table winkelmand_items enable row level security;
alter table bestellingen enable row level security;
alter table bestelling_items enable row level security;

-- Producten: iedereen kan lezen
create policy "Producten zijn publiek leesbaar"
  on producten for select using (true);

-- Producten: medewerkers kunnen alles
create policy "Medewerkers kunnen producten beheren"
  on producten for all
  using (exists (select 1 from medewerker where gebruiker_id = auth.uid()));

-- Gebruiker: eigen record
create policy "Gebruiker ziet eigen record"
  on gebruiker for select using (id = auth.uid());

create policy "Gebruiker kan eigen record aanmaken"
  on gebruiker for insert with check (id = auth.uid());

create policy "Gebruiker kan eigen record bijwerken"
  on gebruiker for update using (id = auth.uid());

create policy "Gebruiker kan eigen record verwijderen"
  on gebruiker for delete using (id = auth.uid());

-- Medewerker: eigen record lezen
create policy "Medewerker ziet eigen record"
  on medewerker for select using (gebruiker_id = auth.uid());

-- Winkelmand: eigen winkelmand
create policy "Gebruiker ziet eigen winkelmand"
  on winkelmand for select using (gebruiker_id = auth.uid());

create policy "Gebruiker kan eigen winkelmand aanmaken"
  on winkelmand for insert with check (gebruiker_id = auth.uid());

-- Winkelmand items: via winkelmand
create policy "Gebruiker ziet eigen winkelmand items"
  on winkelmand_items for select
  using (exists (select 1 from winkelmand where id = winkelmand_id and gebruiker_id = auth.uid()));

create policy "Gebruiker kan winkelmand items beheren"
  on winkelmand_items for all
  using (exists (select 1 from winkelmand where id = winkelmand_id and gebruiker_id = auth.uid()));

-- Bestellingen: eigen bestellingen of medewerker
create policy "Gebruiker ziet eigen bestellingen"
  on bestellingen for select
  using (gebruiker_id = auth.uid() or exists (select 1 from medewerker where gebruiker_id = auth.uid()));

create policy "Gebruiker kan bestelling aanmaken"
  on bestellingen for insert with check (gebruiker_id = auth.uid());

create policy "Medewerker kan bestellingstatus bijwerken"
  on bestellingen for update
  using (exists (select 1 from medewerker where gebruiker_id = auth.uid()));

-- Bestelling items
create policy "Ziet bestelling items"
  on bestelling_items for select
  using (exists (
    select 1 from bestellingen
    where id = bestelling_id
    and (gebruiker_id = auth.uid() or exists (select 1 from medewerker where gebruiker_id = auth.uid()))
  ));

create policy "Gebruiker kan bestelling items aanmaken"
  on bestelling_items for insert
  with check (exists (
    select 1 from bestellingen where id = bestelling_id and gebruiker_id = auth.uid()
  ));

-- Storage bucket voor product fotos
insert into storage.buckets (id, name, public)
values ('product-fotos', 'product-fotos', true)
on conflict do nothing;

create policy "Publieke leestoegang product fotos"
  on storage.objects for select
  using (bucket_id = 'product-fotos');

create policy "Medewerkers kunnen fotos uploaden"
  on storage.objects for insert
  with check (
    bucket_id = 'product-fotos'
    and exists (select 1 from medewerker where gebruiker_id = auth.uid())
  );
