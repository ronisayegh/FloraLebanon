export type SubmitResultState = {
  kind: 'success' | 'queued' | 'error';
  title: string;
  message: string;
  queueReasonCode?: string;
  detailRows: Array<{ label: string; value: string }>;
};
