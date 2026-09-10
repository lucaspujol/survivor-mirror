/**
 * Marks a clause still pending legal sign-off - kept visually distinct
 * rather than blended into approved text, so a document never implies more
 * certainty than it actually has.
 */
export function ToValidate({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <strong>À valider : </strong>
      {children}
    </p>
  )
}

export function LegalArticle({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-primary">
        {number}. {title}
      </h2>
      <div className="flex flex-col gap-2 text-sm">{children}</div>
    </section>
  )
}
