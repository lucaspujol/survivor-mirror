import { OfferDetail } from '@/components/map/OfferDetail'
import { OfferList } from '@/components/map/OfferList'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Offer } from '@/lib/offers'

type MapPanelProps = {
  offers: Offer[]
  isLoading: boolean
  selected: Offer | null
  onSelect: (offer: Offer) => void
  onClearSelection: () => void
}

/** List of the offers in view, replaced by the detail of the selected one. */
export function MapPanel({
  offers,
  isLoading,
  selected,
  onSelect,
  onClearSelection,
}: MapPanelProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      {selected ? (
        <OfferDetail offer={selected} onBack={onClearSelection} />
      ) : (
        <OfferList
          offers={offers}
          isLoading={isLoading}
          selectedId={null}
          onSelect={onSelect}
        />
      )}
    </ScrollArea>
  )
}
