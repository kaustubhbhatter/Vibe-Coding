import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { AppState, Transaction, Account, Group, Category, Budget } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { removeUndefined } from "@/lib/utils";

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
      const loadedGroups = action.payload.groups || [];
      const hasShortTerm = loadedGroups.some(g => g.name === "Short Investments");
      const hasLongTerm = loadedGroups.some(g => g.name === "Long Investments");
      
      const migratedGroups = [...loadedGroups];
      if (!hasShortTerm) {
        migratedGroups.push({ id: "group-short-invest", name: "Short Investments", type: "investment" });
      }
      if (!hasLongTerm) {
        migratedGroups.push({ id: "group-long-invest", name: "Long Investments", type: "investment" });
      }

      return {
        ...action.payload,
        groups: migratedGroups,
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

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const prevUser = useRef<User | null | undefined>(undefined);
  const isRemoteUpdate = useRef(false);
  const dataLoadedForUser = useRef<string | null>(null);

  // Seed structure only (no dummy data) for new authenticated users
  const seedStructureOnly = () => {
    const bankGroup = { id: uuidv4(), name: "Bank Accounts", type: "bank" as const };
    const cashGroup = { id: uuidv4(), name: "Cash", type: "cash" as const };
    const shortInvestmentGroup = { id: uuidv4(), name: "Short Investments", type: "investment" as const };
    const longInvestmentGroup = { id: uuidv4(), name: "Long Investments", type: "investment" as const };
    const creditGroup = { id: uuidv4(), name: "Credit Cards", type: "credit" as const };

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
        groups: [bankGroup, cashGroup, shortInvestmentGroup, longInvestmentGroup, creditGroup],
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
      const isDemo = user.uid.startsWith("demo-user");
      
      // Only reset state if the user has changed to avoid unnecessary clears
      if (dataLoadedForUser.current !== user.uid) {
        console.log(`User changed from ${dataLoadedForUser.current} to ${user.uid}. Loading ${isDemo ? "demo" : "remote"} data...`);
        dispatch({ type: "RESET_STATE" });
        dataLoadedForUser.current = null;
      }
      
      if (isDemo) {
        // Handle Demo User - Operating in volatile state
        console.log("Demo mode active. Data will not be saved.");
        seedStructureOnly();
        dataLoadedForUser.current = user.uid;
      } else if (db) {
        // Real Firebase User
        const userDocRef = doc(db, "users", user.uid);
        unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as AppState;
            console.log("Remote data loaded successfully.");
            isRemoteUpdate.current = true;
            dispatch({ type: "LOAD_STATE", payload: data });
          } else {
             console.log("No remote data found for user. Seeding structure...");
             seedStructureOnly();
          }
          dataLoadedForUser.current = user.uid;
        }, (error) => {
          console.error("Firestore subscription error:", error);
          // If we fail to load due to permissions/offline, don't let the user overwrite cloud data with empty state
          dataLoadedForUser.current = null;
        });
      } else {
        console.error("User logged in but Firestore (db) is missing.");
        seedStructureOnly(); 
        // DO NOT set dataLoadedForUser to allow saving in this broken state
      }
    } else {
      // LOGGED OUT - No state is permitted when logged out.
      console.log("No user detected. Enforcing empty state.");
      dataLoadedForUser.current = null;
      dispatch({ type: "RESET_STATE" });
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
      const isDemo = user.uid.startsWith("demo-user");
      
      // Save ONLY if we have successfully loaded the data for this user
      if (dataLoadedForUser.current === user.uid) {
        if (!isDemo && db) {
          const userDocRef = doc(db, "users", user.uid);
          const sanitizedState = removeUndefined(state);
          setDoc(userDocRef, sanitizedState).catch(console.error);
        }
        // Demo users are not persisted either as they count as "guest data" in this context
      }
    }
    // No saving for guests (localStorage)
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
