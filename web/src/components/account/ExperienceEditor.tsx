import { useState } from 'react'
import { CheckIcon, PencilIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { CONTRACT_TYPES } from '@/components/contractTypes'
import { ContractBadge } from '@/components/offers/ContractBadge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_EXPERIENCES,
  emptyExperience,
  experienceProblem,
  formatPeriod,
  type SeekerExperience,
} from '@/lib/profile'

type ExperienceEditorProps = {
  experiences: SeekerExperience[]
  onChange: (experiences: SeekerExperience[]) => void
}

/**
 * Work experience as one block per position. A finished entry is folded down
 * to a summary — a career of six jobs stays readable — and reopens on the
 * pencil. Nothing here writes: the card's own button saves the whole profile.
 */
export function ExperienceEditor({ experiences, onChange }: ExperienceEditorProps) {
  // Indices being edited. A new entry opens straight away; everything loaded
  // from the API starts folded.
  const [editing, setEditing] = useState<Set<number>>(new Set())
  // Only shown once someone tried to validate: an entry being filled in
  // should not be scolded for being incomplete.
  const [showProblem, setShowProblem] = useState<Set<number>>(new Set())

  const full = experiences.length >= MAX_EXPERIENCES

  const setFlag = (
    apply: (next: Set<number>) => void,
    setter: typeof setEditing,
  ) => setter((current) => {
    const next = new Set(current)
    apply(next)
    return next
  })

  const update = (index: number, patch: Partial<SeekerExperience>) => {
    onChange(
      experiences.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry,
      ),
    )
  }

  const remove = (index: number) => {
    onChange(experiences.filter((_, position) => position !== index))
    // Indices shift down: rebuild both sets around the removed one.
    const shift = (current: Set<number>) =>
      new Set(
        [...current]
          .filter((position) => position !== index)
          .map((position) => (position > index ? position - 1 : position)),
      )
    setEditing(shift)
    setShowProblem(shift)
  }

  const validate = (index: number) => {
    if (experienceProblem(experiences[index])) {
      setFlag((next) => next.add(index), setShowProblem)
      return
    }
    setFlag((next) => next.delete(index), setEditing)
    setFlag((next) => next.delete(index), setShowProblem)
  }

  const add = () => {
    onChange([...experiences, emptyExperience()])
    setFlag((next) => next.add(experiences.length), setEditing)
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium">Expériences professionnelles</h3>
        <p className="text-sm text-muted-foreground">
          Un bloc par poste occupé. Laissez la date de fin vide s'il s'agit de
          votre poste actuel.
        </p>
      </div>

      {experiences.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucune expérience renseignée pour le moment.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {experiences.map((experience, index) => {
          const isEditing = editing.has(index)
          const problem = showProblem.has(index) ? experienceProblem(experience) : null

          if (!isEditing) {
            return (
              // Entries have no stable id before they are saved, and the list
              // is only appended to or filtered, so the index is the identity
              // this form needs.
              <li key={index} className="flex items-start gap-2 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium">{experience.position}</span>
                    <ContractBadge type={experience.contract_type} duration={null} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {experience.company} · {formatPeriod(experience)}
                  </p>
                  {experience.description && (
                    <p className="mt-1 line-clamp-2 text-sm">{experience.description}</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFlag((next) => next.add(index), setEditing)}
                >
                  <PencilIcon />
                  <span className="sr-only">Modifier {experience.position}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => remove(index)}
                >
                  <TrashIcon />
                  <span className="sr-only">Supprimer {experience.position}</span>
                </Button>
              </li>
            )
          }

          return (
            <li key={index} className="rounded-lg border p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium">
                    {experience.position.trim() || `Poste ${index + 1}`}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => remove(index)}
                  >
                    <TrashIcon />
                    Retirer
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`xp-${index}-position`}>
                      Intitulé du poste
                    </FieldLabel>
                    <Input
                      id={`xp-${index}-position`}
                      value={experience.position}
                      onChange={(event) => update(index, { position: event.target.value })}
                      placeholder="ex : Technicien de maintenance"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`xp-${index}-company`}>Entreprise</FieldLabel>
                    <Input
                      id={`xp-${index}-company`}
                      value={experience.company}
                      onChange={(event) => update(index, { company: event.target.value })}
                      placeholder="ex : Fonderie du Val"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`xp-${index}-contract`}>
                      Type de contrat
                    </FieldLabel>
                    <select
                      id={`xp-${index}-contract`}
                      value={experience.contract_type}
                      onChange={(event) =>
                        update(index, { contract_type: event.target.value })
                      }
                      className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {CONTRACT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel htmlFor={`xp-${index}-start`}>Début</FieldLabel>
                      <Input
                        id={`xp-${index}-start`}
                        type="date"
                        value={experience.start_date}
                        onChange={(event) =>
                          update(index, { start_date: event.target.value })
                        }
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`xp-${index}-end`}>Fin</FieldLabel>
                      <Input
                        id={`xp-${index}-end`}
                        type="date"
                        value={experience.end_date ?? ''}
                        min={experience.start_date || undefined}
                        onChange={(event) =>
                          update(index, { end_date: event.target.value || null })
                        }
                      />
                      <FieldDescription>Vide = poste actuel</FieldDescription>
                    </Field>
                  </div>
                </div>

                <Field>
                  <FieldLabel htmlFor={`xp-${index}-description`}>
                    Description
                    <span className="font-normal text-muted-foreground">
                      {' '}
                      (facultatif)
                    </span>
                  </FieldLabel>
                  <Textarea
                    id={`xp-${index}-description`}
                    value={experience.description ?? ''}
                    onChange={(event) =>
                      update(index, { description: event.target.value || null })
                    }
                    rows={3}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    placeholder="Vos missions principales sur ce poste."
                  />
                </Field>

                {problem && <FieldError>{problem}</FieldError>}

                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-fit"
                    onClick={() => validate(index)}
                  >
                    <CheckIcon />
                    Valider ce poste
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={full}
        onClick={add}
      >
        <PlusIcon />
        Ajouter une expérience
      </Button>
      {full && (
        <p className="text-sm text-muted-foreground">
          {MAX_EXPERIENCES} expériences maximum.
        </p>
      )}
    </div>
  )
}
