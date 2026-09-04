import { cn } from '@/lib/utils'

type PageShellProps = React.ComponentProps<'div'> & {
  title: string
  description?: string
  actions?: React.ReactNode
}

/** Padded page frame: heading block on the left, page actions on the right. */
export function PageShell({
  title,
  description,
  actions,
  className,
  children,
  ...props
}: PageShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-5xl px-4 py-6 md:px-6', className)} {...props}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  )
}
