export interface WorkModeOption {
  value: string;
  label: string;
  requiresAddress: boolean;
}

export const WORK_MODES: WorkModeOption[] = [
  { value: 'on_site', label: 'Sur site', requiresAddress: true },
  { value: 'hybrid', label: 'Hybride', requiresAddress: true },
  { value: 'remote', label: 'Télétravail à 100%', requiresAddress: false },
];
