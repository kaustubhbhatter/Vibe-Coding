import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useFinance } from "@/context/FinanceContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TransactionType } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const { state, addTransaction } = useFinance();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset form or set defaults
      if (state.accounts.length > 0) {
        setAccountId(state.accounts[0].id);
      }
      if (state.categories.length > 0) {
        const expenseCategories = state.categories.filter(c => c.type === 'expense');
        if (expenseCategories.length > 0) {
            setCategoryId(expenseCategories[0].id);
        }
      }
    }
  }, [isOpen, state.accounts, state.categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;

    addTransaction({
      amount: parseFloat(amount),
      type,
      categoryId: type === "transfer" ? undefined : categoryId,
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      date,
      note,
    });
    onClose();
    setAmount("");
    setNote("");
  };

  const filteredCategories = state.categories.filter((c) => c.type === type);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(["expense", "income", "transfer"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
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
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          {type !== "transfer" && (
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
              {type === "transfer" ? "From Account" : "Account"}
            </label>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {state.accounts.map((a) => (
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
                {state.accounts
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

        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Note</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note..."
          />
        </div>

        <Button type="submit" className="w-full mt-4" size="lg">
          Save Transaction
        </Button>
      </form>
    </Modal>
  );
}
