'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import KanbanBoard, { type Order } from './KanbanBoard'

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch { /* browser bloqueó AudioContext */ }
}

export default function RealtimeKanban({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [alert, setAlert] = useState(false)

  function optimisticUpdate(id: string, newStatus: string) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o))
  }

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(product_name, quantity, notes)')
      .in('status', ['new', 'accepted', 'preparing', 'ready'])
      .order('created_at', { ascending: true })
    if (data) setOrders(data as Order[])
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          fetchOrders()
          playBeep()
          setAlert(true)
          setTimeout(() => setAlert(false), 4000)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as { id: string; status: string }
          const kanbanStatuses = ['new', 'accepted', 'preparing', 'ready']
          if (kanbanStatuses.includes(updated.status)) {
            setOrders((prev) =>
              prev.map((o) => o.id === updated.id ? { ...o, status: updated.status } : o)
            )
          } else {
            setOrders((prev) => prev.filter((o) => o.id !== updated.id))
          }
        }
      )
      .subscribe()

    // Polling de respaldo cada 15s por si Realtime falla
    const prevCountRef = { current: 0 }
    const poll = setInterval(async () => {
      const supabasePoll = createClient()
      const { data } = await supabasePoll
        .from('orders')
        .select('*, order_items(product_name, quantity, notes)')
        .in('status', ['new', 'accepted', 'preparing', 'ready'])
        .order('created_at', { ascending: true })
      if (data) {
        const newCount = data.filter((o) => o.status === 'new').length
        if (newCount > prevCountRef.current) {
          playBeep()
          setAlert(true)
          setTimeout(() => setAlert(false), 4000)
        }
        prevCountRef.current = newCount
        setOrders(data as Order[])
      }
    }, 15000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [fetchOrders])

  return (
    <div className="h-full flex flex-col relative">
      {/* Banner pedido nuevo */}
      {alert && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-doggo-red text-white px-6 py-2.5 rounded-full font-black text-sm shadow-xl animate-bounce pointer-events-none">
          🌭 ¡Nuevo pedido!
        </div>
      )}
      <KanbanBoard orders={orders} onOptimisticUpdate={optimisticUpdate} onRefresh={fetchOrders} />
    </div>
  )
}
