// ── Shared enums / literals ──────────────────────────────────────

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus = 'pending' | 'paid' | 'failed'

export type DeliveryType = 'pickup' | 'delivery' | 'dine_in'

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

export type LoyaltyType = 'earned' | 'redeemed'

// ── Database row types ───────────────────────────────────────────

export interface Category {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  available: boolean
  sort_order: number
  created_at: string
  // joined
  category?: Category
}

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_type: DeliveryType
  address: string | null
  lat: number | null
  lng: number | null
  notes: string | null
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus
  payment_status: PaymentStatus
  created_at: string
  // joined
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  total: number
  notes: string | null
}

export interface Reservation {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  reservation_date: string   // 'YYYY-MM-DD'
  reservation_time: string   // 'HH:MM:SS'
  party_size: number
  notes: string | null
  status: ReservationStatus
  created_at: string
}

export interface Customer {
  id: string
  auth_user_id: string | null
  name: string
  phone: string | null
  email: string | null
  points: number
  created_at: string
}

export interface Reward {
  id: string
  name: string
  description: string | null
  points_required: number
  active: boolean
  created_at: string
}

export interface LoyaltyTransaction {
  id: string
  customer_id: string
  order_id: string | null
  points: number
  type: LoyaltyType
  description: string | null
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  provider: string | null
  provider_reference: string | null
  amount: number
  status: PaymentStatus
  payment_url: string | null
  created_at: string
}

// ── Cart / UI types ──────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
  notes?: string
}

export interface CheckoutForm {
  name: string
  phone: string
  email?: string
  delivery_type: DeliveryType
  address?: string
  notes?: string
}
