type FilterOptionProps = {
  label: string
  count: number
  checked: boolean
  onToggle: () => void
}

/** One tick box of a filter section, with the number of offers behind it. */
export function FilterOption({ label, count, checked, onToggle }: FilterOptionProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 px-4 py-2 text-sm hover:bg-primary/5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
      <span className="flex-1">{label}</span>
      <span className="text-muted-foreground tabular-nums">({count})</span>
    </label>
  )
}
