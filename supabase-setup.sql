-- =============================================
-- DOGGO · Setup completo de base de datos
-- Pega esto en Supabase → SQL Editor → Run
-- =============================================

-- Categorías
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int default 0,
  created_at timestamp with time zone default now()
);

-- Productos
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  available boolean default true,
  sort_order int default 0,
  created_at timestamp with time zone default now()
);

-- Pedidos
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_type text not null check (delivery_type in ('pickup','delivery','dine_in')),
  address text,
  lat numeric,
  lng numeric,
  notes text,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  total numeric(10,2) not null,
  status text default 'new' check (status in ('new','accepted','preparing','ready','delivered','cancelled')),
  payment_status text default 'pending' check (payment_status in ('pending','paid','failed')),
  points_awarded boolean default false,
  created_at timestamp with time zone default now()
);

-- Items del pedido
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity int not null,
  unit_price numeric(10,2) not null,
  total numeric(10,2) not null,
  notes text
);

-- Reservas
create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  reservation_date date not null,
  reservation_time time not null,
  party_size int not null,
  notes text,
  status text default 'pending' check (status in ('pending','confirmed','cancelled','modified')),
  created_at timestamp with time zone default now()
);

-- Clientes
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  name text not null,
  phone text,
  email text unique,
  points int default 0,
  created_at timestamp with time zone default now()
);

-- Recompensas
create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  points_required int not null,
  discount_type text check (discount_type in ('percentage','fixed','none')),
  discount_value numeric(10,2),
  active boolean default true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Canjes de recompensas
create table if not exists reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  reward_id uuid references rewards(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  points_used int not null,
  status text default 'applied' check (status in ('pending','applied','cancelled')),
  created_at timestamp with time zone default now()
);

-- Transacciones de puntos
create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  points int not null,
  type text not null check (type in ('earned','redeemed')),
  description text,
  created_at timestamp with time zone default now()
);

-- Pagos
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  provider text,
  provider_reference text,
  amount numeric(10,2),
  status text default 'pending' check (status in ('pending','paid','failed')),
  payment_url text,
  created_at timestamp with time zone default now()
);

-- Promociones
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  active boolean default true,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- =============================================
-- STORAGE BUCKET para imágenes
-- =============================================
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict do nothing;

-- Política: cualquiera puede leer imágenes
create policy "images_public_read" on storage.objects
  for select using (bucket_id = 'images');

-- Política: solo autenticados pueden subir
create policy "images_auth_upload" on storage.objects
  for insert with check (bucket_id = 'images' and auth.role() = 'authenticated');

-- Política: solo autenticados pueden eliminar
create policy "images_auth_delete" on storage.objects
  for delete using (bucket_id = 'images' and auth.role() = 'authenticated');

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reservations enable row level security;
alter table customers enable row level security;
alter table rewards enable row level security;
alter table reward_redemptions enable row level security;
alter table loyalty_transactions enable row level security;
alter table payments enable row level security;
alter table promotions enable row level security;

-- Lectura pública de catálogo
create policy "categories_public_read" on categories for select using (true);
create policy "products_public_read" on products for select using (true);
create policy "promotions_public_read" on promotions for select using (true);
create policy "rewards_public_read" on rewards for select using (true);

-- Pedidos: crear sin login, ver propio por ID
create policy "orders_insert_anon" on orders for insert with check (true);
create policy "orders_select_anon" on orders for select using (true);
create policy "order_items_insert_anon" on order_items for insert with check (true);
create policy "order_items_select_anon" on order_items for select using (true);

-- Reservas: crear sin login
create policy "reservations_insert_anon" on reservations for insert with check (true);

-- Clientes: ver y editar el propio
create policy "customers_select_own" on customers for select
  using (auth.uid() = auth_user_id);
create policy "customers_insert_own" on customers for insert
  with check (auth.uid() = auth_user_id);
create policy "customers_update_own" on customers for update
  using (auth.uid() = auth_user_id);

-- Loyalty: ver las propias
create policy "loyalty_select_own" on loyalty_transactions for select
  using (customer_id in (select id from customers where auth_user_id = auth.uid()));

-- Reward redemptions: ver las propias
create policy "redemptions_select_own" on reward_redemptions for select
  using (customer_id in (select id from customers where auth_user_id = auth.uid()));

-- Payments: cualquiera puede insertar (para crear el pago al checkout)
create policy "payments_insert_anon" on payments for insert with check (true);
create policy "payments_select_anon" on payments for select using (true);

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

-- Categorías
insert into categories (name, sort_order) values
  ('Clásicos', 1),
  ('Especiales', 2),
  ('Bebidas', 3),
  ('Combos', 4)
on conflict do nothing;

-- Productos
insert into products (category_id, name, description, price, available, sort_order)
select c.id, p.name, p.description, p.price, true, p.sort_order
from (values
  ('Clásicos',   'Hot Dog Clásico',    'Salchicha premium, mostaza, ketchup, cebolla',        3.50, 1),
  ('Clásicos',   'Hot Dog con Queso',  'Salchicha premium, queso fundido, mostaza',            4.00, 2),
  ('Especiales', 'Hot Dog Hawaiano',   'Salchicha, piña grillada, salsa especial de la casa',  4.25, 1),
  ('Especiales', 'Hot Dog BBQ',        'Salchicha, cebolla caramelizada, salsa BBQ, cheddar',  4.75, 2),
  ('Bebidas',    'Limonada',           'Limonada natural con hielo',                           1.75, 1),
  ('Bebidas',    'Gaseosa',            'Coca-Cola, Sprite o Fanta · 400ml',                   1.50, 2),
  ('Combos',     'Combo Doggo',        'Hot Dog Clásico + gaseosa + papas fritas',             5.99, 1),
  ('Combos',     'Combo Especial',     'Hot Dog Especial + limonada + papas fritas',           6.99, 2)
) as p(cat_name, name, description, price, sort_order)
join categories c on c.name = p.cat_name
on conflict do nothing;

-- Recompensas
insert into rewards (name, description, points_required, discount_type, discount_value, active) values
  ('Hot Dog Clásico gratis', 'Canjea por un Hot Dog Clásico sin costo', 35, 'fixed', 3.50, true),
  ('Combo Doggo gratis',     'Canjea por un Combo Doggo completo',      75, 'fixed', 5.99, true),
  ('10% de descuento',       'Descuento en tu próximo pedido',          20, 'percentage', 10, true)
on conflict do nothing;
