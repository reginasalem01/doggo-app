// Options that apply to all Hotdogs and Hotdogs Especiales

export const HOTDOG_CATEGORY_NAMES = ['Hotdogs', 'Hotdogs Especiales']

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
