import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { CreateOfferForm } from '@/components/offers/CreateOfferForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type CreateOfferDialogProps = {
  company: string
  onCreated?: () => void
  triggerLabel?: string
}

export function CreateOfferDialog({
  company,
  onCreated,
  triggerLabel = 'Publier une offre',
}: CreateOfferDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon />
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publier une offre</DialogTitle>
          <DialogDescription>
            Publiée au nom de {company}. L'offre est archivée après 30 jours.
          </DialogDescription>
        </DialogHeader>
        <CreateOfferForm
          company={company}
          onCancel={() => setOpen(false)}
          onCreated={() => {
            setOpen(false)
            onCreated?.()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
