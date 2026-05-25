export interface Contact {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  company: string;
  notes: string;
  createdAt: string;
}

export type Screen =
  | { name: 'rolodex' }
  | { name: 'detail'; contactId: string }
  | { name: 'addEdit'; contactId?: string };
