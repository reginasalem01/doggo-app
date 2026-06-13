import OwnerSidebar from './OwnerSidebar'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-doggo-dark">
      <OwnerSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {children}
      </main>
    </div>
  )
}
