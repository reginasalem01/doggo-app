-- Doggo Cash loyalty system
-- $5 gastados → 1 estrella
-- Bronce (0-10 estrellas): $0.50/estrella
-- Plata (11-25 estrellas): $0.75/estrella
-- Oro (26+ estrellas): $1.00/estrella

-- customers: agregar estrellas acumuladas y saldo Doggo Cash
ALTER TABLE customers ADD COLUMN IF NOT EXISTS estrellas int NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS doggo_cash numeric(10,2) NOT NULL DEFAULT 0.00;

-- orders: registrar cuánto Doggo Cash se usó al hacer el pedido
ALTER TABLE orders ADD COLUMN IF NOT EXISTS doggo_cash_used numeric(10,2) DEFAULT 0.00;

-- loyalty_transactions: registrar el monto en dólares (no solo puntos)
ALTER TABLE loyalty_transactions ADD COLUMN IF NOT EXISTS doggo_cash_amount numeric(10,2);
