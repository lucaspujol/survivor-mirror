import { useId, useRef, type ChangeEvent } from 'react'
import { FileTextIcon, UploadIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import {
  ACCEPTED_FILE_LABEL,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_LABEL,
  formatFileSize,
} from '@/lib/applications'

type FileFieldProps = {
  label: string
  file: File | null
  onChange: (file: File | null) => void
  required?: boolean
  error?: string
}

/**
 * One document to attach. The native file input is kept in the DOM and only
 * visually hidden: it stays the thing that opens the picker and that a screen
 * reader announces, while the button and the chosen-file row are what is seen.
 */
export function FileField({ label, file, onChange, required, error }: FileFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null)
  }

  const clear = () => {
    onChange(null)
    // The input keeps the cleared file otherwise, so picking the same one
    // again would fire no change event.
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={inputId}>
        {label}
        {!required && <span className="font-normal text-muted-foreground"> (facultatif)</span>}
      </FieldLabel>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        required={required && !file}
        onChange={handleChange}
        aria-describedby={`${inputId}-hint`}
        aria-invalid={error ? true : undefined}
        className="sr-only"
      />

      {file ? (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={clear}
          >
            <XIcon />
            <span className="sr-only">Retirer {file.name}</span>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon />
          Choisir un fichier
        </Button>
      )}

      <FieldDescription id={`${inputId}-hint`}>
        {ACCEPTED_FILE_LABEL}, {MAX_FILE_SIZE_LABEL} maximum.
      </FieldDescription>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
