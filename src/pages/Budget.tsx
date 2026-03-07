import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Trash2, Wallet } from "lucide-react";
import { Budget as BudgetType } from "@/types";

export function Budget() {
  const { state, addBudget, deleteBudget } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetType | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [color, setColor] = useState("cyan");

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    addBudget({
      name,
      targetAmount: parseFloat(targetAmount),
      color,
    });
    setIsAddModalOpen(false);
    setName("");
    setTargetAmount("");
    setColor("cyan");
  };

  const getBudgetProgress = (budgetId: string) => {
    const transactions = state.transactions.filter(t => t.type === 'budget' && t.budgetId === budgetId);
    const currentAmount = transactions.reduce((acc, t) => acc + t.amount, 0);
    return currentAmount;
  };

  const getBudgetAllocations = (budgetId: string) => {
    const transactions = state.transactions.filter(t => t.type === 'budget' && t.budgetId === budgetId);
    const allocations: { [accountId: string]: number } = {};
    
    transactions.forEach(t => {
      allocations[t.accountId] = (allocations[t.accountId] || 0) + t.amount;
    });

    return Object.entries(allocations).map(([accountId, amount]) => ({
      account: state.accounts.find(a => a.id === accountId),
      amount
    })).filter(item => item.amount > 0);
  };

  return (
    <div className="space-y-6 pb-40 md:pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Budgets</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} className="mr-2" /> New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.budgets.map(budget => {
          const currentAmount = getBudgetProgress(budget.id);
          const progress = Math.min((currentAmount / budget.targetAmount) * 100, 100);
          
          return (
            <motion.div
              key={budget.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedBudget(budget)}
              className="cursor-pointer"
            >
              <Card className={`bg-white dark:bg-slate-900 border-l-4 border-l-${budget?.color || 'cyan'}-500 shadow-sm hover:shadow-md transition-shadow`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{budget.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Target: {formatCurrency(budget.targetAmount)}</p>
                    </div>
                    <div className={`p-2 rounded-full bg-${budget?.color || 'cyan'}-100 dark:bg-${budget?.color || 'cyan'}-900/30 text-${budget?.color || 'cyan'}-600 dark:text-${budget?.color || 'cyan'}-400`}>
                      <Target size={20} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{formatCurrency(currentAmount)}</span>
                      <span className="text-slate-500 dark:text-slate-400">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full bg-${budget?.color || 'cyan'}-500`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        
        {state.budgets.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <p>No budgets set yet. Create a goal to start saving!</p>
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Budget Goal">
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Goal Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vacation Fund" required />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Target Amount</label>
            <Input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0.00" required />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Color Theme</label>
            <div className="flex gap-2 flex-wrap">
              {["cyan", "fuchsia", "emerald", "amber", "blue", "rose", "purple", "orange"].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    `w-8 h-8 rounded-full bg-${c}-500 transition-transform hover:scale-110`,
                    color === c ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600 scale-110" : "opacity-70 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">Create Goal</Button>
        </form>
      </Modal>

      {/* Budget Details Modal */}
      <Modal isOpen={!!selectedBudget} onClose={() => setSelectedBudget(null)} title={selectedBudget?.name || "Budget Details"}>
        {selectedBudget && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Saved</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
                {formatCurrency(getBudgetProgress(selectedBudget.id))}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                of {formatCurrency(selectedBudget.targetAmount)} goal
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
                Funds Parked In
              </h3>
              {getBudgetAllocations(selectedBudget.id).length > 0 ? (
                getBudgetAllocations(selectedBudget.id).map(({ account, amount }) => (
                  <div key={account?.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-${account?.color || 'slate'}-100 dark:bg-${account?.color || 'slate'}-900/30 text-${account?.color || 'slate'}-600 dark:text-${account?.color || 'slate'}-400`}>
                        <Wallet size={16} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{account?.name}</span>
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">
                  No funds allocated yet.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button 
                variant="ghost" 
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                onClick={() => {
                  deleteBudget(selectedBudget.id);
                  setSelectedBudget(null);
                }}
              >
                <Trash2 size={16} className="mr-2" /> Delete Goal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
