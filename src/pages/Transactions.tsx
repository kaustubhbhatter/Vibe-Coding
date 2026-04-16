import React, { useMemo, useState } from "react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useFinance } from "@/context/FinanceContext";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ArrowDownUp, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Transaction } from "@/types";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { Button } from "@/components/ui/Button";

export function Transactions() {
  const { state, deleteTransaction } = useFinance();
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "transfer" | "budget">("all");

  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Pagination / Month Selection
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const handlePrevMonth = () => {
    setCurrentMonth(prev => startOfMonth(new Date(prev.getFullYear(), prev.getMonth() - 1, 1)));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => startOfMonth(new Date(prev.getFullYear(), prev.getMonth() + 1, 1)));
  };

  const handleCurrentMonth = () => {
    setCurrentMonth(startOfMonth(new Date()));
  };

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const transactions = useMemo(() => {
    let filtered = state.transactions;

    // Filter by Month
    const start = currentMonth;
    const end = endOfMonth(currentMonth);
    filtered = filtered.filter(t => {
      if (!t.date) return false;
      const parsedDate = parseISO(t.date);
      return isWithinInterval(parsedDate, { start, end });
    });

    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => t.categoryId && selectedCategories.includes(t.categoryId));
    }

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(t => selectedAccounts.includes(t.accountId) || (t.toAccountId && selectedAccounts.includes(t.toAccountId)));
    }

    return filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      const validDateA = isNaN(dateA) ? 0 : dateA;
      const validDateB = isNaN(dateB) ? 0 : dateB;
      return sortOrder === "desc" ? validDateB - validDateA : validDateA - validDateB;
    });
  }, [state.transactions, filterType, sortOrder, selectedCategories, selectedAccounts, currentMonth]);

  const groupedTransactions = useMemo<{ [key: string]: Transaction[] }>(() => {
    const groups: { [key: string]: Transaction[] } = {};
    transactions.forEach((t) => {
      let dateKey = "Unknown Date";
      try {
        if (t.date) {
          const parsedDate = parseISO(t.date);
          if (!isNaN(parsedDate.getTime())) {
            dateKey = format(parsedDate, "yyyy-MM-dd");
          }
        }
      } catch (e) {
        console.error("Invalid date for transaction", t);
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    return groups;
  }, [transactions]);

  const monthlyStats = useMemo(() => {
    const start = currentMonth;
    const end = endOfMonth(currentMonth);

    const currentMonthTransactions = state.transactions.filter((t) => {
      if (!t.date) return false;
      const parsedDate = parseISO(t.date);
      if (isNaN(parsedDate.getTime())) return false;
      return isWithinInterval(parsedDate, { start, end });
    });

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
  }, [state.transactions, currentMonth]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    // window.confirm is blocked in iframes, so we delete directly for now
    deleteTransaction(id);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedAccounts([]);
    setFilterType("all");
  };

  const activeFilterCount = (filterType !== "all" ? 1 : 0) + selectedCategories.length + selectedAccounts.length;

  return (
    <div className="space-y-6 pb-40 md:pb-16">
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
              {format(currentMonth, "MMMM yyyy")} Overview
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Button 
              variant={showFilters ? "primary" : "outline"} 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 text-xs gap-2"
            >
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-slate-500 hover:text-rose-500">
                <X size={14} className="mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Month Pagination Pill */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-1 py-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <button 
                onClick={handlePrevMonth}
                className="p-1 hover:text-cyan-500 transition-colors text-slate-500"
              >
                <ChevronLeft size={14} />
              </button>
              
              <button 
                onClick={handleCurrentMonth}
                className="px-2 text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight hover:text-cyan-500 transition-colors"
              >
                {format(currentMonth, "MMM yy")}
              </button>

              <button 
                onClick={handleNextMonth}
                className="p-1 hover:text-cyan-500 transition-colors text-slate-500"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowDownUp size={14} />
              {sortOrder === "desc" ? "Newest" : "Oldest"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-sm mx-2">
                {/* Type Filter */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block uppercase">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {["all", "income", "expense", "transfer", "budget"].map(type => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                          filterType === type 
                            ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories Filter */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block uppercase">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {state.categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border",
                          selectedCategories.includes(category.id)
                            ? `bg-${category?.color || 'slate'}-50 dark:bg-${category?.color || 'slate'}-900/20 border-${category?.color || 'slate'}-200 dark:border-${category?.color || 'slate'}-800 text-${category?.color || 'slate'}-700 dark:text-${category?.color || 'slate'}-300`
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                      >
                        {selectedCategories.includes(category.id) && <Check size={12} />}
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accounts Filter */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block uppercase">Accounts</label>
                  <div className="flex flex-wrap gap-2">
                    {state.accounts.map(account => (
                      <button
                        key={account.id}
                        onClick={() => toggleAccount(account.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border",
                          selectedAccounts.includes(account.id)
                            ? `bg-${account?.color || 'slate'}-50 dark:bg-${account?.color || 'slate'}-900/20 border-${account?.color || 'slate'}-200 dark:border-${account?.color || 'slate'}-800 text-${account?.color || 'slate'}-700 dark:text-${account?.color || 'slate'}-300`
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                      >
                        {selectedAccounts.includes(account.id) && <Check size={12} />}
                        {account.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                  {date === "Unknown Date" ? "Unknown Date" : format(parseISO(date), "EEE, MMM d")}
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
                    account={state.accounts.find((a) => a.id === t.accountId)}
                    toAccount={state.accounts.find((a) => a.id === t.toAccountId)}
                    budget={state.budgets.find((b) => b.id === t.budgetId)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
      
      <TransactionModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
      />
    </div>
  );
}
