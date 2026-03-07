export type TransactionType = "income" | "expense" | "transfer" | "budget";

export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number;
  type: TransactionType;
  categoryId?: string;
  accountId: string; // Source account
  toAccountId?: string; // Destination account (for transfers)
  budgetId?: string; // Destination budget (for budget allocations)
  note?: string;
  createdAt: number;
}

export interface Account {
  id: string;
  name: string;
  groupId: string;
  initialBalance: number;
  excludeFromTotals: boolean;
  allowBudgeting?: boolean; // New field
  color?: string;
  dueDate?: number; // Day of month (1-31)
  cycleDate?: number; // Day of month (1-31)
}

export interface Group {
  id: string;
  name: string;
  type: "bank" | "credit" | "investment" | "cash" | "other";
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
}

export interface Budget {
  id: string;
  name: string;
  targetAmount: number;
  color?: string;
  createdAt: number;
}

export interface AppState {
  transactions: Transaction[];
  accounts: Account[];
  groups: Group[];
  categories: Category[];
  budgets: Budget[];
}
