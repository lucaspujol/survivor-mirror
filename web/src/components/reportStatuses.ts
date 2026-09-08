export interface ReportStatusOption {
  value: string;
  label: string;
}

export const REPORT_STATUSES: ReportStatusOption[] = [
  { value: 'pending', label: 'À traiter' },
  { value: 'reviewed', label: 'Examiné' },
  { value: 'dismissed', label: 'Classé sans suite' },
];
