import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { CreateOfferForm } from '@/components/Createofferform'
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
}

/** The map has no room for a permanent form, so publishing happens in a dialog. */
export function CreateOfferDialog({ company, onCreated }: CreateOfferDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon />
            Publier une offre
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publier une offre</DialogTitle>
          <DialogDescription>
            Publiée au nom de {company} et placée sur la carte.
          </DialogDescription>
        </DialogHeader>
        <CreateOfferForm
          onCreated={() => {
            setOpen(false)
            onCreated?.()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
