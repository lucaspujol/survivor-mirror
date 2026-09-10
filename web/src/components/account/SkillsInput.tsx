import { useId, useState, type KeyboardEvent } from 'react'
import { XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { MAX_SKILLS } from '@/lib/profile'

type SkillsInputProps = {
  skills: string[]
  onChange: (skills: string[]) => void
}

/** Skills as a list of removable chips. Enter adds one, so the list can be
 * filled without ever reaching for the mouse; the button is there for anyone
 * who does not expect Enter to do that. */
export function SkillsInput({ skills, onChange }: SkillsInputProps) {
  const inputId = useId()
  const [draft, setDraft] = useState('')

  const full = skills.length >= MAX_SKILLS

  const add = () => {
    const skill = draft.trim()
    if (!skill || full) return
    // Compared case-insensitively, like the API does, so the interface never
    // shows a duplicate the server would silently drop.
    if (skills.some((entry) => entry.toLowerCase() === skill.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...skills, skill])
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Enter in a text field would otherwise submit the surrounding form.
      event.preventDefault()
      add()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={inputId}>Compétences</FieldLabel>

      {skills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <li key={skill}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {skill}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-4 rounded-full"
                  onClick={() => onChange(skills.filter((entry) => entry !== skill))}
                >
                  <XIcon className="size-3" />
                  <span className="sr-only">Retirer {skill}</span>
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={full}
          placeholder={full ? `${MAX_SKILLS} compétences maximum` : 'ex : Python, Anglais courant…'}
          aria-describedby={`${inputId}-hint`}
        />
        <Button type="button" variant="outline" onClick={add} disabled={full || !draft.trim()}>
          Ajouter
        </Button>
      </div>

      <FieldDescription id={`${inputId}-hint`}>
        {skills.length} / {MAX_SKILLS} — appuyez sur Entrée pour ajouter.
      </FieldDescription>
    </div>
  )
}
