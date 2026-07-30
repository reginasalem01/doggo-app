-- Customizations per order item (hotdog options)
-- Stores: salsas (free), extras (free), paidToppings (charged), notes (quitar/remove)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS customizations jsonb;
