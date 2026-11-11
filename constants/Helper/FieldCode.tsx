import type { AuthUser } from '@/@Types';

export type FieldCodePreview = {
  code: string;
  format: string;
};

type BuildFieldCodePreviewInput = {
  date?: Date;
  user?: Pick<AuthUser, 'firstName' | 'lastName'> | null;
  sequenceNumber?: number;
};

export const buildFieldCodePreview = (options: BuildFieldCodePreviewInput): FieldCodePreview => {
  const { date = new Date(), user, sequenceNumber = 1 } = options;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  const firstInitial = user?.firstName?.trim()?.charAt(0)?.toUpperCase() || 'G';
  const lastInitial = user?.lastName?.trim()?.charAt(0)?.toUpperCase() || 'T';
  const sequence = String(sequenceNumber).padStart(3, '0');

  return {
    code: `${dd}${mm}${yyyy}_${firstInitial}${lastInitial}${sequence}`,
    format: 'DDMMYYYY_InitialsNNN',
  };
};
