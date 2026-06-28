export interface Bank {
  id: number;
  name: string;
  code: string;
  logo_url: string | null;
  active: boolean;
  supported_program_ids?: number[];
}

export interface CreateBankPayload {
  name: string;
  code: string;
  logo_url?: string;
  active?: boolean;
}

export type UpdateBankPayload = Partial<CreateBankPayload>;
