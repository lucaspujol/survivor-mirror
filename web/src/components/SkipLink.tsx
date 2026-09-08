type SkipLinkProps = {
  /** id of the element to jump to; it needs tabIndex={-1} to accept focus. */
  targetId: string
  children: React.ReactNode
}

/**
 * Jumps keyboard users past a long block of controls. It stays in the flow and
 * collapses to nothing until focused, so it pushes the block down when it
 * appears rather than covering the heading underneath.
 */
export function SkipLink({ targetId, children }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="block h-0 overflow-hidden rounded-md border border-transparent text-sm font-medium text-primary opacity-0 focus-visible:mb-3 focus-visible:h-auto focus-visible:border-primary focus-visible:bg-background focus-visible:px-3 focus-visible:py-2 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </a>
  )
}
