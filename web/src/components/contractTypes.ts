export interface ContractTypeOption {
  value: string;
  label: string;
  hasDuration: boolean;
}

export const CONTRACT_TYPES: ContractTypeOption[] = [
  { value: 'cdi', label: 'CDI', hasDuration: false },
  { value: 'cdd', label: 'CDD', hasDuration: true },
  { value: 'stage', label: 'Stage', hasDuration: true },
  { value: 'alternance', label: 'Alternance', hasDuration: true },
  { value: 'interim', label: 'Intérim', hasDuration: true },
  { value: 'freelance', label: 'Freelance', hasDuration: false },
];
