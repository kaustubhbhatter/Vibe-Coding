import React, { useMemo, useState } from "react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useFinance } from "@/context/FinanceContext";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Filter, ArrowDownUp } from "lucide-react";
import { Transaction } from "@/types";

export function Transactions() {
  const { state } = useFinance();
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "transfer">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const transactions = useMemo(() => {
    let filtered = state.transactions;

    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [state.transactions, filterType, sortOrder]);

  const groupedTransactions = useMemo<{ [key: string]: Transaction[] }>(() => {
    const groups: { [key: string]: Transaction[] } = {};
    transactions.forEach((t) => {
      const dateKey = format(parseISO(t.date), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    return groups;
  }, [transactions]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const currentMonthTransactions = state.transactions.filter((t) =>
      isWithinInterval(parseISO(t.date), { start, end })
    );

    const income = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      income,
      expense,
      net: income - expense,
    };
  }, [state.transactions]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Monthly Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card variant="glass" className="relative overflow-hidden border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-200/50 dark:shadow-black/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-3xl -ml-10 -mb-10" />
          
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 uppercase tracking-wider">
              {format(new Date(), "MMMM yyyy")} Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-400 mb-1">Income</p>
                <p className="text-lg font-semibold text-emerald-400">
                  {formatCurrency(monthlyStats.income)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Expenses</p>
                <p className="text-lg font-semibold text-rose-400">
                  {formatCurrency(monthlyStats.expense)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Net</p>
                <p className={cn("text-lg font-semibold", monthlyStats.net >= 0 ? "text-cyan-400" : "text-rose-400")}>
                  {formatCurrency(monthlyStats.net)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters & Sort */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500 dark:text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-transparent text-sm text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <option value="all" className="bg-white dark:bg-slate-900">All Transactions</option>
            <option value="income" className="bg-white dark:bg-slate-900">Income</option>
            <option value="expense" className="bg-white dark:bg-slate-900">Expense</option>
            <option value="transfer" className="bg-white dark:bg-slate-900">Transfers</option>
          </select>
        </div>
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowDownUp size={14} />
          {sortOrder === "desc" ? "Newest First" : "Oldest First"}
        </button>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {(Object.entries(groupedTransactions) as [string, Transaction[]][]).map(([date, dayTransactions], index) => {
          const dayIncome = dayTransactions
            .filter((t) => t.type === "income")
            .reduce((acc, t) => acc + t.amount, 0);
          const dayExpense = dayTransactions
            .filter((t) => t.type === "expense")
            .reduce((acc, t) => acc + t.amount, 0);

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {format(parseISO(date), "EEE, MMM d")}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                  {dayIncome > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(dayIncome)}</span>}
                  {dayExpense > 0 && <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(dayExpense)}</span>}
                </div>
              </div>
              
              <div className="space-y-2">
                {dayTransactions.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    category={state.categories.find((c) => c.id === t.categoryId)}
                    account={state.accounts.find((a) => a.id === t.accountId)!}
                    toAccount={state.accounts.find((a) => a.id === t.toAccountId)}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}

        {transactions.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <p>No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
