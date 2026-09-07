export interface TimeCommitmentOption {
  value: string;
  label: string;
}

export const TIME_COMMITMENTS: TimeCommitmentOption[] = [
  { value: 'full_time', label: 'Temps plein' },
  { value: 'part_time', label: 'Temps partiel' },
];
