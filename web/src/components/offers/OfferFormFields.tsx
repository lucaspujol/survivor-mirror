import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { CONTRACT_TYPES } from '@/components/contractTypes'
import { TIME_COMMITMENTS } from '@/components/timeCommitments'
import { WORK_MODES } from '@/components/workModes'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export type OfferDraft = {
  title: string
  description: string
  contract_type: string
  contract_duration: string
  work_mode: string
  time_commitment: string
  address: string
}

type OfferFormFieldsProps = {
  /** Namespaces the input ids so several forms can coexist on one screen. */
  idPrefix: string
  draft: OfferDraft
  onChange: (patch: Partial<OfferDraft>) => void
}

function labelOf(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

export function hasDuration(contractType: string) {
  return CONTRACT_TYPES.find((type) => type.value === contractType)?.hasDuration ?? false
}

export function requiresAddress(workMode: string) {
  return WORK_MODES.find((mode) => mode.value === workMode)?.requiresAddress ?? false
}

/** The seven fields an offer is made of, shared by the create and edit dialogs. */
export function OfferFormFields({ idPrefix, draft, onChange }: OfferFormFieldsProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-title`}>Intitulé du poste</FieldLabel>
        <Input
          id={`${idPrefix}-title`}
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-description`}>Description</FieldLabel>
        <Textarea
          id={`${idPrefix}-description`}
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={4}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-contract-type`}>Type de contrat</FieldLabel>
        <Select
          value={draft.contract_type}
          onValueChange={(value) => onChange({ contract_type: value as string })}
        >
          <SelectTrigger id={`${idPrefix}-contract-type`} className="w-full">
            <SelectValue>{(value) => labelOf(CONTRACT_TYPES, value as string)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div aria-live="polite">
        {hasDuration(draft.contract_type) && (
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-contract-duration`}>Durée</FieldLabel>
            <Input
              id={`${idPrefix}-contract-duration`}
              value={draft.contract_duration}
              onChange={(event) => onChange({ contract_duration: event.target.value })}
              placeholder="ex : 3 mois, 6 mois, 1 an"
            />
          </Field>
        )}
      </div>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-work-mode`}>Mode de travail</FieldLabel>
        <Select
          value={draft.work_mode}
          onValueChange={(value) => onChange({ work_mode: value as string })}
        >
          <SelectTrigger id={`${idPrefix}-work-mode`} className="w-full">
            <SelectValue>{(value) => labelOf(WORK_MODES, value as string)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {WORK_MODES.map((mode) => (
              <SelectItem key={mode.value} value={mode.value}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-time-commitment`}>Temps de travail</FieldLabel>
        <Select
          value={draft.time_commitment}
          onValueChange={(value) => onChange({ time_commitment: value as string })}
        >
          <SelectTrigger id={`${idPrefix}-time-commitment`} className="w-full">
            <SelectValue>{(value) => labelOf(TIME_COMMITMENTS, value as string)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TIME_COMMITMENTS.map((commitment) => (
              <SelectItem key={commitment.value} value={commitment.value}>
                {commitment.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div aria-live="polite">
        {requiresAddress(draft.work_mode) ? (
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-address`}>Adresse</FieldLabel>
            <AddressAutocomplete
              id={`${idPrefix}-address`}
              value={draft.address}
              onChange={(address) => onChange({ address })}
            />
            <FieldDescription>
              L'adresse est géocodée pour placer l'offre sur la carte.
            </FieldDescription>
          </Field>
        ) : (
          <FieldDescription>
            Offre 100% télétravail : pas d'adresse, elle n'apparaîtra pas sur la carte.
          </FieldDescription>
        )}
      </div>
    </FieldGroup>
  )
}
