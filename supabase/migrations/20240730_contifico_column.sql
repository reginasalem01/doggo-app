-- Adds contifico_doc_id to orders for idempotent sync tracking
-- Run this in Supabase SQL Editor

alter table orders
  add column if not exists contifico_doc_id text;

-- Index for quick lookup (e.g., to check if an order was already synced)
create index if not exists orders_contifico_doc_id_idx on orders (contifico_doc_id)
  where contifico_doc_id is not null;
