import { ChevronUpIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type FilterSectionProps = {
  title: string
  children: React.ReactNode
}

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <Collapsible defaultOpen className="rounded-lg border border-primary/10">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-t-lg bg-primary/5 px-4 py-3 text-left font-medium text-primary">
        {title}
        <ChevronUpIcon className="size-4 shrink-0 rotate-180 transition-transform group-data-[panel-open]:rotate-0" />
      </CollapsibleTrigger>
      <CollapsibleContent className="py-2">{children}</CollapsibleContent>
    </Collapsible>
  )
}
