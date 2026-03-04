import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Trash2, Edit2, Wallet, CreditCard, Landmark, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Account, Group, Category } from "@/types";

export function Setup() {
  const { state, addAccount, updateAccount, deleteAccount, addCategory, deleteCategory } = useFinance();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  // Account Form State
  const [accName, setAccName] = useState("");
  const [accGroup, setAccGroup] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [accColor, setAccColor] = useState("cyan");

  // Category Form State
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"income" | "expense">("expense");
  const [catColor, setCatColor] = useState("orange");

  const totalAssets = state.accounts
    .filter(a => !a.excludeFromTotals && state.groups.find(g => g.id === a.groupId)?.type !== 'credit')
    .reduce((acc, a) => acc + a.initialBalance, 0); // Note: This is just initial balance. Real balance needs transaction sum.
    
  // Calculate real balances
  const getAccountBalance = (accountId: string, initialBalance: number) => {
    const transactions = state.transactions.filter(t => t.accountId === accountId || t.toAccountId === accountId);
    return transactions.reduce((acc, t) => {
      if (t.type === 'income' && t.accountId === accountId) return acc + t.amount;
      if (t.type === 'expense' && t.accountId === accountId) return acc - t.amount;
      if (t.type === 'transfer') {
        if (t.accountId === accountId) return acc - t.amount;
        if (t.toAccountId === accountId) return acc + t.amount;
      }
      return acc;
    }, initialBalance);
  };

  const netWorth = state.accounts.reduce((acc, a) => {
    if (a.excludeFromTotals) return acc;
    const group = state.groups.find(g => g.id === a.groupId);
    const balance = getAccountBalance(a.id, a.initialBalance);
    // Credit cards usually have negative balance if they are liabilities, but here we might track them as positive debt?
    // Let's assume positive balance on credit card means debt (Liability).
    if (group?.type === 'credit') return acc - balance;
    return acc + balance;
  }, 0);

  const assets = state.accounts.reduce((acc, a) => {
    if (a.excludeFromTotals) return acc;
    const group = state.groups.find(g => g.id === a.groupId);
    if (group?.type === 'credit') return acc;
    const balance = getAccountBalance(a.id, a.initialBalance);
    return acc + (balance > 0 ? balance : 0);
  }, 0);

  const liabilities = state.accounts.reduce((acc, a) => {
    if (a.excludeFromTotals) return acc;
    const group = state.groups.find(g => g.id === a.groupId);
    const balance = getAccountBalance(a.id, a.initialBalance);
    if (group?.type === 'credit') return acc + balance;
    return acc + (balance < 0 ? Math.abs(balance) : 0);
  }, 0);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      updateAccount({ ...editingAccount, name: accName, groupId: accGroup, initialBalance: parseFloat(accBalance), color: accColor });
    } else {
      addAccount({ name: accName, groupId: accGroup, initialBalance: parseFloat(accBalance), excludeFromTotals: false, color: accColor });
    }
    setIsAccountModalOpen(false);
    setEditingAccount(null);
    setAccName("");
    setAccBalance("");
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    addCategory({ name: catName, type: catType, color: catColor });
    setIsCategoryModalOpen(false);
    setCatName("");
  };

  const openAddAccount = () => {
    setEditingAccount(null);
    setAccName("");
    setAccBalance("0");
    if (state.groups.length > 0) setAccGroup(state.groups[0].id);
    setIsAccountModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      {/* Net Worth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card variant="neon" className="bg-slate-900 dark:bg-black text-white border-none shadow-xl shadow-cyan-500/10 dark:shadow-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-slate-400 text-sm uppercase tracking-widest">Net Worth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-6 font-mono tracking-tighter">
              {formatCurrency(netWorth)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 mb-1">Assets</p>
                <p className="text-lg font-semibold text-emerald-300">{formatCurrency(assets)}</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <p className="text-xs text-rose-400 mb-1">Liabilities</p>
                <p className="text-lg font-semibold text-rose-300">{formatCurrency(liabilities)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Accounts</h2>
          <Button size="sm" variant="outline" onClick={openAddAccount}>
            <Plus size={16} className="mr-1" /> Add
          </Button>
        </div>

        {state.groups.map(group => (
          <div key={group.id} className="space-y-2">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase px-2">{group.name}</h3>
            {state.accounts.filter(a => a.groupId === group.id).map(account => {
               const balance = getAccountBalance(account.id, account.initialBalance);
               return (
                <motion.div
                  key={account.id}
                  layout
                  className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-200 dark:hover:border-cyan-700 shadow-sm transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      `bg-${account.color}-100 dark:bg-${account.color}-900/30 text-${account.color}-600 dark:text-${account.color}-400`
                    )}>
                      {group.type === 'bank' ? <Landmark size={18} /> : group.type === 'credit' ? <CreditCard size={18} /> : <Wallet size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-200">{account.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {group.type === 'credit' ? 'Limit/Due: ' : 'Balance: '} 
                        <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(balance)}</span>
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteAccount(account.id)}>
                    <Trash2 size={16} className="text-slate-400 hover:text-rose-500" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Categories</h2>
          <Button size="sm" variant="outline" onClick={() => setIsCategoryModalOpen(true)}>
            <Plus size={16} className="mr-1" /> Add
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {state.categories.map(category => (
            <div key={category.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-${category.color}-500`} />
                <span className="text-sm text-slate-700 dark:text-slate-300">{category.name}</span>
              </div>
              <button onClick={() => deleteCategory(category.id)} className="text-slate-400 hover:text-rose-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Account Modal */}
      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title={editingAccount ? "Edit Account" : "Add Account"}>
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Account Name</label>
            <Input value={accName} onChange={e => setAccName(e.target.value)} placeholder="e.g. Chase Sapphire" required />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Group</label>
            <Select value={accGroup} onChange={e => setAccGroup(e.target.value)}>
              {state.groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Initial Balance</label>
            <Input type="number" value={accBalance} onChange={e => setAccBalance(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Color Theme</label>
            <Select value={accColor} onChange={e => setAccColor(e.target.value)}>
              <option value="cyan">Cyan</option>
              <option value="fuchsia">Fuchsia</option>
              <option value="emerald">Emerald</option>
              <option value="amber">Amber</option>
              <option value="blue">Blue</option>
              <option value="rose">Rose</option>
            </Select>
          </div>
          <Button type="submit" className="w-full">Save Account</Button>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Add Category">
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Category Name</label>
            <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Groceries" required />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Type</label>
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button type="button" onClick={() => setCatType("expense")} className={cn("flex-1 py-2 text-sm rounded-md transition-colors", catType === "expense" ? "bg-white dark:bg-slate-700 shadow text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400")}>Expense</button>
              <button type="button" onClick={() => setCatType("income")} className={cn("flex-1 py-2 text-sm rounded-md transition-colors", catType === "income" ? "bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400")}>Income</button>
            </div>
          </div>
          <Button type="submit" className="w-full">Save Category</Button>
        </form>
      </Modal>
    </div>
  );
}
