import { BetaTestersAdmin } from '@/components/sections/beta-testers-admin'
import { useAdminCheck } from '@/hooks/use-roles'
import { redirect } from 'next/navigation'

export default function BetaTestersPage() {
  // Verificar que sea administrador
  const { isAdmin, loading } = useAdminCheck()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto p-6">
      <BetaTestersAdmin />
    </div>
  )
}
