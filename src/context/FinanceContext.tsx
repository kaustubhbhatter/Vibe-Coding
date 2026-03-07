import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { AppState, Transaction, Account, Group, Category, Budget } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { User } from "firebase/auth";

const initialState: AppState = {
  transactions: [],
  accounts: [],
  groups: [],
  categories: [],
  budgets: [],
};

type Action =
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_ACCOUNT"; payload: Account }
  | { type: "UPDATE_ACCOUNT"; payload: Account }
  | { type: "DELETE_ACCOUNT"; payload: string }
  | { type: "ADD_GROUP"; payload: Group }
  | { type: "UPDATE_GROUP"; payload: Group }
  | { type: "DELETE_GROUP"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "UPDATE_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "ADD_BUDGET"; payload: Budget }
  | { type: "UPDATE_BUDGET"; payload: Budget }
  | { type: "DELETE_BUDGET"; payload: string }
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "RESET_STATE" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_TRANSACTION":
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case "ADD_ACCOUNT":
      return { ...state, accounts: [...state.accounts, action.payload] };
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case "DELETE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.payload),
      };
    case "ADD_GROUP":
      return { ...state, groups: [...state.groups, action.payload] };
    case "UPDATE_GROUP":
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.id ? action.payload : g
        ),
      };
    case "DELETE_GROUP":
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.payload),
      };
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.payload] };
    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
      };
    case "ADD_BUDGET":
      return { ...state, budgets: [...state.budgets, action.payload] };
    case "UPDATE_BUDGET":
      return {
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case "DELETE_BUDGET":
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== action.payload),
      };
    case "LOAD_STATE":
      return {
        ...action.payload,
        budgets: action.payload.budgets || [], // Ensure budgets exists for migrated data
      };
    case "RESET_STATE":
      return {
        transactions: [],
        accounts: [],
        groups: [],
        categories: [],
        budgets: [],
      };
    default:
      return state;
  }
}

const FinanceContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (account: Omit<Account, "id">) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  addGroup: (group: Omit<Group, "id">) => void;
  updateGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addBudget: (budget: Omit<Budget, "id" | "createdAt">) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
} | null>(null);

const GUEST_STORAGE_KEY = "nebula_finance_guest_data";

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const prevUser = useRef<User | null | undefined>(undefined);
  const isRemoteUpdate = useRef(false);
  const dataLoadedForUser = useRef<string | null>(null);

  // Seed initial data for guests
  const seedInitialData = () => {
    const bankGroup = { id: uuidv4(), name: "Bank Accounts", type: "bank" as const };
    const creditGroup = { id: uuidv4(), name: "Credit Cards", type: "credit" as const };
    const cashGroup = { id: uuidv4(), name: "Cash", type: "cash" as const };

    const checkingAccount = {
      id: uuidv4(),
      name: "Checking",
      groupId: bankGroup.id,
      initialBalance: 2500,
      excludeFromTotals: false,
      color: "cyan",
      allowBudgeting: true,
    };
    
    const creditCard = {
      id: uuidv4(),
      name: "Primary Card",
      groupId: creditGroup.id,
      initialBalance: -450,
      excludeFromTotals: false,
      color: "fuchsia",
    };

    const cashAccount = {
      id: uuidv4(),
      name: "Wallet",
      groupId: cashGroup.id,
      initialBalance: 120,
      excludeFromTotals: false,
      color: "emerald",
    };

    const categories = [
      { id: uuidv4(), name: "Food & Dining", type: "expense" as const, color: "orange" },
      { id: uuidv4(), name: "Transportation", type: "expense" as const, color: "blue" },
      { id: uuidv4(), name: "Utilities", type: "expense" as const, color: "yellow" },
      { id: uuidv4(), name: "Entertainment", type: "expense" as const, color: "purple" },
      { id: uuidv4(), name: "Shopping", type: "expense" as const, color: "pink" },
      { id: uuidv4(), name: "Salary", type: "income" as const, color: "green" },
      { id: uuidv4(), name: "Investments", type: "income" as const, color: "indigo" },
      { id: uuidv4(), name: "Freelance", type: "income" as const, color: "teal" },
    ];

    const budgets = [
      { id: uuidv4(), name: "Vacation Fund", targetAmount: 2000, color: "cyan", createdAt: Date.now() },
    ];

    // Generate some dummy transactions
    const transactions: Transaction[] = [
      {
        id: uuidv4(),
        amount: 3200,
        type: "income",
        categoryId: categories[5].id, // Salary
        accountId: checkingAccount.id,
        date: new Date().toISOString(),
        note: "Monthly Salary",
        createdAt: Date.now(),
      },
      {
        id: uuidv4(),
        amount: 45,
        type: "expense",
        categoryId: categories[0].id, // Food
        accountId: creditCard.id,
        date: new Date(Date.now() - 86400000 * 1).toISOString(), // Yesterday
        note: "Grocery Store",
        createdAt: Date.now() - 86400000 * 1,
      },
      {
        id: uuidv4(),
        amount: 120,
        type: "expense",
        categoryId: categories[2].id, // Utilities
        accountId: checkingAccount.id,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        note: "Electric Bill",
        createdAt: Date.now() - 86400000 * 2,
      },
      {
        id: uuidv4(),
        amount: 15,
        type: "expense",
        categoryId: categories[1].id, // Transportation
        accountId: cashAccount.id,
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        note: "Uber Ride",
        createdAt: Date.now() - 86400000 * 3,
      },
      {
        id: uuidv4(),
        amount: 85,
        type: "expense",
        categoryId: categories[3].id, // Entertainment
        accountId: creditCard.id,
        date: new Date(Date.now() - 86400000 * 4).toISOString(),
        note: "Movie Night",
        createdAt: Date.now() - 86400000 * 4,
      },
      {
        id: uuidv4(),
        amount: 250,
        type: "income",
        categoryId: categories[7].id, // Freelance
        accountId: checkingAccount.id,
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        note: "Freelance Project",
        createdAt: Date.now() - 86400000 * 5,
      },
      {
        id: uuidv4(),
        amount: 120,
        type: "expense",
        categoryId: categories[4].id, // Shopping
        accountId: creditCard.id,
        date: new Date(Date.now() - 86400000 * 6).toISOString(),
        note: "New Sneakers",
        createdAt: Date.now() - 86400000 * 6,
      },
    ];

    dispatch({
      type: "LOAD_STATE",
      payload: {
        transactions: transactions,
        accounts: [checkingAccount, creditCard, cashAccount],
        groups: [bankGroup, creditGroup, cashGroup],
        categories: categories,
        budgets: budgets,
      },
    });
  };

  // Seed structure only (no dummy data) for new authenticated users
  const seedStructureOnly = () => {
    const bankGroup = { id: uuidv4(), name: "Bank Accounts", type: "bank" as const };
    const creditGroup = { id: uuidv4(), name: "Credit Cards", type: "credit" as const };
    const cashGroup = { id: uuidv4(), name: "Cash", type: "cash" as const };

    const categories = [
      { id: uuidv4(), name: "Food & Dining", type: "expense" as const, color: "orange" },
      { id: uuidv4(), name: "Transportation", type: "expense" as const, color: "blue" },
      { id: uuidv4(), name: "Utilities", type: "expense" as const, color: "yellow" },
      { id: uuidv4(), name: "Entertainment", type: "expense" as const, color: "purple" },
      { id: uuidv4(), name: "Shopping", type: "expense" as const, color: "pink" },
      { id: uuidv4(), name: "Salary", type: "income" as const, color: "green" },
      { id: uuidv4(), name: "Investments", type: "income" as const, color: "indigo" },
      { id: uuidv4(), name: "Freelance", type: "income" as const, color: "teal" },
    ];

    dispatch({
      type: "LOAD_STATE",
      payload: {
        transactions: [],
        accounts: [],
        groups: [bankGroup, creditGroup, cashGroup],
        categories: categories,
        budgets: [],
      },
    });
  };

  // Load / Sync Data
  useEffect(() => {
    if (loading) return;

    let unsubscribe = () => {};

    if (user) {
      // LOGGED IN
      
      // Clear current state immediately to remove guest data while real data loads
      // This ensures no guest data is shown or saved to the user's profile
      dispatch({ type: "RESET_STATE" });
      dataLoadedForUser.current = null;
      
      // Clear all possible caches
      localStorage.removeItem(GUEST_STORAGE_KEY);
      
      if (db) {
        const userDocRef = doc(db, "users", user.uid);
        unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as AppState;
            isRemoteUpdate.current = true;
            dispatch({ type: "LOAD_STATE", payload: data });
          } else {
             // No data for user yet. 
             // Seed a clean structure (no dummy data).
             seedStructureOnly();
          }
          // Mark as loaded for this user to allow saving
          dataLoadedForUser.current = user.uid;
        });
      }
    } else {
      // GUEST
      dataLoadedForUser.current = null;
      
      // If we just logged out, clear everything and seed defaults
      if (prevUser.current !== undefined && prevUser.current !== null) {
        localStorage.removeItem(GUEST_STORAGE_KEY);
        dispatch({ type: "RESET_STATE" });
        seedInitialData();
      } else {
        // Normal guest load
        const storedData = localStorage.getItem(GUEST_STORAGE_KEY);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            dispatch({ type: "LOAD_STATE", payload: parsedData });
          } catch (e) {
            console.error("Failed to parse stored data", e);
            seedInitialData();
          }
        } else {
          seedInitialData();
        }
      }
    }

    prevUser.current = user;

    return () => unsubscribe();
  }, [user, loading]);

  // Save Data
  useEffect(() => {
    if (loading) return;
    
    // Skip if this update came from remote
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    if (user) {
      // Save to Firestore ONLY if we have successfully loaded the data for this user
      // This prevents guest data from overwriting user data during the login transition
      if (db && dataLoadedForUser.current === user.uid) {
        const userDocRef = doc(db, "users", user.uid);
        setDoc(userDocRef, state).catch(console.error);
      }
    } else {
      // Save to Local Storage (Guest)
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, user, loading]);

  const addTransaction = (transaction: Omit<Transaction, "id" | "createdAt">) => {
    dispatch({
      type: "ADD_TRANSACTION",
      payload: { ...transaction, id: uuidv4(), createdAt: Date.now() },
    });
  };

  const updateTransaction = (transaction: Transaction) => {
    dispatch({ type: "UPDATE_TRANSACTION", payload: transaction });
  };

  const deleteTransaction = (id: string) => {
    dispatch({ type: "DELETE_TRANSACTION", payload: id });
  };

  const addAccount = (account: Omit<Account, "id">) => {
    dispatch({ type: "ADD_ACCOUNT", payload: { ...account, id: uuidv4() } });
  };

  const updateAccount = (account: Account) => {
    dispatch({ type: "UPDATE_ACCOUNT", payload: account });
  };

  const deleteAccount = (id: string) => {
    dispatch({ type: "DELETE_ACCOUNT", payload: id });
  };

  const addGroup = (group: Omit<Group, "id">) => {
    dispatch({ type: "ADD_GROUP", payload: { ...group, id: uuidv4() } });
  };

  const updateGroup = (group: Group) => {
    dispatch({ type: "UPDATE_GROUP", payload: group });
  };

  const deleteGroup = (id: string) => {
    dispatch({ type: "DELETE_GROUP", payload: id });
  };

  const addCategory = (category: Omit<Category, "id">) => {
    dispatch({ type: "ADD_CATEGORY", payload: { ...category, id: uuidv4() } });
  };

  const updateCategory = (category: Category) => {
    dispatch({ type: "UPDATE_CATEGORY", payload: category });
  };

  const deleteCategory = (id: string) => {
    dispatch({ type: "DELETE_CATEGORY", payload: id });
  };

  const addBudget = (budget: Omit<Budget, "id" | "createdAt">) => {
    dispatch({ type: "ADD_BUDGET", payload: { ...budget, id: uuidv4(), createdAt: Date.now() } });
  };

  const updateBudget = (budget: Budget) => {
    dispatch({ type: "UPDATE_BUDGET", payload: budget });
  };

  const deleteBudget = (id: string) => {
    dispatch({ type: "DELETE_BUDGET", payload: id });
  };

  return (
    <FinanceContext.Provider
      value={{
        state,
        dispatch,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        addGroup,
        updateGroup,
        deleteGroup,
        addCategory,
        updateCategory,
        deleteCategory,
        addBudget,
        updateBudget,
        deleteBudget,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
