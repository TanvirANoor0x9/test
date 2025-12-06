export interface Activity {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  isUrgent: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string; // e.g., Bkash, Nagad
  number: string;
  instructions: string;
}

export interface Transaction {
  id: string;
  methodName: string;
  trxId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  userNote?: string;
}

export interface Admin {
  id: string;
  name: string;
  accessCode: string; // Simple verification for demo purposes
}

export interface AppSettings {
  orgName: string;
  logoUrl: string;
  primaryColor: string; // Tailwind color class name part e.g., 'red', 'blue'
  welcomeMessage: string;
}

export type ThemeColor = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'black';
