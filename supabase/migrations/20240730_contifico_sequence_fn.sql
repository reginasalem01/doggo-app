-- Función atómica para incrementar el contador de secuencia de Contífico
-- Evita race conditions entre pedidos entregados simultáneamente
CREATE OR REPLACE FUNCTION increment_contifico_sequence()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  current_val integer;
  next_val integer;
BEGIN
  -- Upsert ensures row exists, then lock it for update
  INSERT INTO business_settings (key, value)
  VALUES ('contifico_sequence', '0')
  ON CONFLICT (key) DO NOTHING;

  SELECT (value::integer) INTO current_val
  FROM business_settings
  WHERE key = 'contifico_sequence'
  FOR UPDATE;

  next_val := current_val + 1;

  UPDATE business_settings
  SET value = next_val::text
  WHERE key = 'contifico_sequence';

  RETURN next_val;
END;
$$;
