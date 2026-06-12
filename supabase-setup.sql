-- =============================================
-- DOGGO · Setup inicial de base de datos
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
  total numeric(10,2) not null,
  status text default 'new' check (status in ('new','accepted','preparing','ready','delivered','cancelled')),
  payment_status text default 'pending' check (payment_status in ('pending','paid','failed')),
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
  status text default 'pending' check (status in ('pending','confirmed','cancelled')),
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
  active boolean default true,
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

-- Productos (usa los IDs de las categorías que se acaban de crear)
insert into products (category_id, name, description, price, available, sort_order)
select c.id, p.name, p.description, p.price, true, p.sort_order
from (values
  ('Clásicos', 'Hot Dog Clásico',     'Salchicha premium, mostaza, ketchup, cebolla',       3.50, 1),
  ('Clásicos', 'Hot Dog con Queso',   'Salchicha premium, queso fundido, mostaza',           4.00, 2),
  ('Especiales', 'Hot Dog Hawaiano',  'Salchicha, piña grillada, salsa especial de la casa', 4.25, 1),
  ('Especiales', 'Hot Dog BBQ',       'Salchicha, cebolla caramelizada, salsa BBQ, cheddar', 4.75, 2),
  ('Bebidas',  'Limonada',            'Limonada natural con hielo',                          1.75, 1),
  ('Bebidas',  'Gaseosa',             'Coca-Cola, Sprite o Fanta · 400ml',                  1.50, 2),
  ('Combos',   'Combo Doggo',         'Hot Dog Clásico + gaseosa + papas fritas',            5.99, 1),
  ('Combos',   'Combo Especial',      'Hot Dog Especial + limonada + papas fritas',          6.99, 2)
) as p(cat_name, name, description, price, sort_order)
join categories c on c.name = p.cat_name
on conflict do nothing;

-- Recompensas de prueba
insert into rewards (name, description, points_required, active) values
  ('Hot Dog Clásico gratis', 'Canjea por un Hot Dog Clásico sin costo', 35, true),
  ('Combo Doggo gratis',     'Canjea por un Combo Doggo completo',      75, true),
  ('10% de descuento',       'Descuento en tu próximo pedido',          20, true)
on conflict do nothing;

-- =============================================
-- ROW LEVEL SECURITY (básico para empezar)
-- =============================================
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reservations enable row level security;

-- Cualquiera puede leer categorías y productos
create policy "categories_public_read" on categories for select using (true);
create policy "products_public_read" on products for select using (true);

-- Cualquiera puede crear un pedido (sin login)
create policy "orders_insert_anon" on orders for insert with check (true);
create policy "order_items_insert_anon" on order_items for insert with check (true);

-- Cualquiera puede crear una reserva
create policy "reservations_insert_anon" on reservations for insert with check (true);

-- Ver pedidos propios (por ahora abierto, cerrar cuando haya auth)
create policy "orders_select_anon" on orders for select using (true);
create policy "order_items_select_anon" on order_items for select using (true);
