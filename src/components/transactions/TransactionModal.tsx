import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useFinance } from "@/context/FinanceContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TransactionType, Transaction } from "@/types";
import { cn } from "@/lib/utils";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  initialData?: Partial<Transaction>;
}

export function TransactionModal({ isOpen, onClose, transaction, initialData }: TransactionModalProps) {
  const { state, addTransaction, updateTransaction } = useFinance();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [budgetId, setBudgetId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");

  const [isCCPayment, setIsCCPayment] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        // Edit Mode
        setAmount(transaction.amount.toString());
        setType(transaction.type);
        setCategoryId(transaction.categoryId || "");
        setAccountId(transaction.accountId);
        setToAccountId(transaction.toAccountId || "");
        setBudgetId(transaction.budgetId || "");
        setDate(format(new Date(transaction.date), "yyyy-MM-dd"));
        setNote(transaction.note || "");
        setIsCCPayment(transaction.isCCPayment || false);
      } else {
        // Add Mode - Reset form or set defaults
        setAmount(initialData?.amount?.toString() || "");
        setNote(initialData?.note || "");
        setDate(initialData?.date ? format(new Date(initialData.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
        setType(initialData?.type || "expense");
        setIsCCPayment(initialData?.isCCPayment || false);
        
        if (state.accounts.length > 0) {
          setAccountId(initialData?.accountId || state.accounts[0].id);
        }
        if (initialData?.toAccountId) {
          setToAccountId(initialData.toAccountId);
        }

        if (state.categories.length > 0) {
          const expenseCategories = state.categories.filter(c => c.type === 'expense');
          if (expenseCategories.length > 0) {
              setCategoryId(initialData?.categoryId || expenseCategories[0].id);
          }
        }
        if (state.budgets.length > 0) {
          setBudgetId(initialData?.budgetId || state.budgets[0].id);
        }
      }
    }
  }, [isOpen, transaction, initialData, state.accounts, state.categories, state.budgets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId || !date) return;
    if (type === "transfer" && !toAccountId) return;
    if (type === "budget" && !budgetId) return;

    const transactionData = {
      amount: parseFloat(amount),
      type,
      categoryId: (type === "transfer" || type === "budget") ? undefined : categoryId,
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      budgetId: type === "budget" ? budgetId : undefined,
      date: date || format(new Date(), "yyyy-MM-dd"),
      note,
      isCCPayment: type === "transfer" ? isCCPayment : false,
    };

    if (transaction) {
      updateTransaction({
        ...transaction,
        ...transactionData,
      });
    } else {
      addTransaction(transactionData);
    }
    
    onClose();
    setAmount("");
    setNote("");
    setIsCCPayment(false);
  };

  const filteredCategories = state.categories.filter((c) => c.type === type);
  const availableAccounts = state.accounts.filter(a => !a.excludeFromTotals);
  const budgetAccounts = availableAccounts.filter(a => a.allowBudgeting);

  const isToAccountCredit = toAccountId && state.accounts.find(a => a.id === toAccountId) && 
    state.groups.find(g => g.id === state.accounts.find(a => a.id === toAccountId)?.groupId)?.type === 'credit';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={transaction ? "Edit Transaction" : "Add Transaction"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
          {(["expense", "income", "transfer", "budget"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap px-2",
                type === t
                  ? "bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Amount</label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="text-2xl font-mono"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          {type !== "transfer" && type !== "budget" && (
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Category</label>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {type === "budget" && (
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Budget Goal</label>
              <Select
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
              >
                {state.budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
              {type === "transfer" ? "From Account" : type === "budget" ? "Park From Account" : "Account"}
            </label>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {(type === "budget" ? budgetAccounts : availableAccounts).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>

          {type === "transfer" && (
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">To Account</label>
              <Select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
              >
                <option value="">Select Account</option>
                {availableAccounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </Select>
            </div>
          )}
        </div>

        {type === "transfer" && isToAccountCredit && (
          <div className="flex items-center gap-2 p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border border-cyan-100 dark:border-cyan-900/50">
            <input 
              type="checkbox" 
              id="isCCPayment" 
              checked={isCCPayment}
              onChange={(e) => setIsCCPayment(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="isCCPayment" className="text-sm font-medium text-cyan-800 dark:text-cyan-300 cursor-pointer">
              Mark as Credit Card Bill Payment
            </label>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Note</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note..."
          />
        </div>

        <Button type="submit" className="w-full mt-4" size="lg">
          {transaction ? "Update Transaction" : "Save Transaction"}
        </Button>
      </form>
    </Modal>
  );
}
