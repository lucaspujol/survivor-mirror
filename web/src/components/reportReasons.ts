export interface ReportReasonOption {
  value: string;
  label: string;
}

export const REPORT_REASONS: ReportReasonOption[] = [
  { value: 'fraudulent', label: 'Offre frauduleuse' },
  { value: 'non_compliant', label: 'Offre non conforme' },
  { value: 'expired', label: "Offre expirée / plus disponible" },
  { value: 'other', label: 'Autre motif' },
];
