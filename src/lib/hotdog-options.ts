// Options that apply to all Hotdogs and Hotdogs Especiales
export const HOTDOG_CATEGORY_NAMES = ['Hotdogs', 'Hotdogs Especiales']

// Products that require BOTH hotdog especial + cola selection
export const COMBO_CHOICES_PRODUCT_NAMES = ['Combo Especial']

// Products that require ONLY cola selection (hotdog already defined by combo name)
export const COMBO_COLA_ONLY_NAMES = ['Combo Clásico', 'Combo Doggo + Cola']

// Only the "especiales" — shown in Combo Especial chooser
export const ESPECIALES_OPTIONS = [
  'Doggo',
  'Hawaiano',
  'Chilidoggo',
  'Sweetdoggo',
  'Guayaco',
  'Doggito',
]

export const COLA_OPTIONS = ['Coca Cola', 'Fanta', 'Sprite', 'Fioravanti']

export const FREE_SALSAS = [
  'Mayonesa',
  'Salsa de Tomate',
  'Mostaza',
  'Salsa Doggo Verde',
  'Salsa Doggo',
  'Salsa Jalapeña',
]

export const FREE_EXTRAS = ['Cebolla', 'Mermelada de Piña', 'Relish']

export interface PaidTopping { name: string; price: number }

export const PAID_TOPPINGS: PaidTopping[] = [
  { name: 'Mermelada de Cebolla', price: 1.25 },
  { name: 'Piña Doggo',           price: 1.25 },
  { name: 'Chili',                price: 1.25 },
  { name: 'Salsa Cheddar',        price: 1.25 },
]

export const TOPPING_PRICE = 1.25
