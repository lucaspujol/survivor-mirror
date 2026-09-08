import { DownloadIcon, FileTextIcon } from 'lucide-react'
import {
  DOCUMENT_LABELS,
  documentUrl,
  formatFileSize,
  type ApplicationDocument,
} from '@/lib/applications'

type DocumentListProps = {
  applicationId: number
  documents: ApplicationDocument[]
}

/**
 * The files attached to an application, as download links. A plain anchor, not
 * a fetch: the browser handles the save dialog, and the cookie rides along
 * because /api is same-origin.
 */
export function DocumentList({ applicationId, documents }: DocumentListProps) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun document joint.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {documents.map((document) => (
        <li key={document.id}>
          <a
            href={documentUrl(applicationId, document.id)}
            download={document.original_name}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="font-medium">{DOCUMENT_LABELS[document.kind]}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {document.original_name} · {formatFileSize(document.size_bytes)}
              </span>
            </span>
            <DownloadIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">Télécharger</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
