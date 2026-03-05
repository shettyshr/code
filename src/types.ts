export type Category = 'airline' | 'credit_card' | 'hotel';

export interface LoyaltyProgram {
  id: string;
  name: string;
  category: Category;
  points: number;
  accountNumber?: string;
  expirationDate?: string;
  lastUpdated: string;
}

export const CATEGORY_CONFIG: Record<
  Category,
  {label: string; color: string; icon: string}
> = {
  airline: {label: 'Airline', color: '#1a73e8', icon: '✈️'},
  credit_card: {label: 'Credit Card', color: '#7c4dff', icon: '💳'},
  hotel: {label: 'Hotel', color: '#ff6d00', icon: '🏨'},
};

export const CATEGORY_ORDER: Category[] = ['airline', 'credit_card', 'hotel'];
