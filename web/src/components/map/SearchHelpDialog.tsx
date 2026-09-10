import { useState } from 'react'
import { CircleQuestionMarkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type SearchHelpDialogProps = {
  /** Names the field this help belongs to, for screen readers. */
  field: string
  title: string
  intro: string
  examples: { label: string; value: string }[]
  outro: string
}

/**
 * The "?" next to a search field. The advice is what makes the field usable -
 * which is why it sits one click away rather than in a hover tooltip: a
 * dialog is reachable by keyboard and readable on touch.
 */
export function SearchHelpDialog({ field, title, intro, examples, outro }: SearchHelpDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Aide : ${field}`}
            className="size-6 shrink-0 rounded-full text-primary hover:bg-primary/10"
          >
            <CircleQuestionMarkIcon className="size-5" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>{intro}</DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          {examples.map((example) => (
            <li key={example.label}>
              {example.label} : <strong className="font-semibold">{example.value}</strong>
            </li>
          ))}
        </ul>

        <p className="text-sm text-muted-foreground">{outro}</p>
      </DialogContent>
    </Dialog>
  )
}
