import { Link, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Button variant="ghost" size="sm" render={<Link to="/" />}>
          <ArrowLeftIcon />
          Retour
        </Button>
      </div>
      <div className="w-full max-w-sm md:max-w-3xl">
        <Outlet />
      </div>
    </div>
  )
}
