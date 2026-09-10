import { PlusIcon, TrashIcon } from 'lucide-react'
import { CONTRACT_TYPES } from '@/components/contractTypes'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_EXPERIENCES,
  emptyExperience,
  type SeekerExperience,
} from '@/lib/profile'

type ExperienceEditorProps = {
  experiences: SeekerExperience[]
  onChange: (experiences: SeekerExperience[]) => void
}

/**
 * Work experience as one block per position rather than a single paragraph:
 * a career with several jobs stays readable, and one entry can be corrected
 * without retyping the rest.
 */
export function ExperienceEditor({ experiences, onChange }: ExperienceEditorProps) {
  const full = experiences.length >= MAX_EXPERIENCES

  const update = (index: number, patch: Partial<SeekerExperience>) => {
    onChange(
      experiences.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry,
      ),
    )
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

      <ul className="flex flex-col gap-4">
        {experiences.map((experience, index) => (
          // Entries have no stable id before they are saved, and the list is
          // only ever appended to or filtered, so the index is the identity
          // the form needs here.
          <li key={index} className="rounded-lg border p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium">Poste {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() =>
                    onChange(experiences.filter((_, position) => position !== index))
                  }
                >
                  <TrashIcon />
                  Retirer
                  <span className="sr-only">
                    {experience.position || `le poste ${index + 1}`}
                  </span>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`xp-${index}-position`}>Intitulé du poste</FieldLabel>
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
                  <FieldLabel htmlFor={`xp-${index}-contract`}>Type de contrat</FieldLabel>
                  <select
                    id={`xp-${index}-contract`}
                    value={experience.contract_type}
                    onChange={(event) => update(index, { contract_type: event.target.value })}
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
                      onChange={(event) => update(index, { start_date: event.target.value })}
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
                  <span className="font-normal text-muted-foreground"> (facultatif)</span>
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
            </div>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={full}
        onClick={() => onChange([...experiences, emptyExperience()])}
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
