import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Trash2, Edit2, Wallet, CreditCard, Landmark, LogIn, LogOut, Sun, Moon, User as UserIcon, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Account, Group, Category } from "@/types";
import { TransactionModal } from "@/components/transactions/TransactionModal";

export function Config() {
  const { state, addAccount, updateAccount, deleteAccount, addCategory, deleteCategory } = useFinance();
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  // Account Form State
  const [accName, setAccName] = useState("");
  const [accGroup, setAccGroup] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [accColor, setAccColor] = useState("cyan");
  const [accAllowBudgeting, setAccAllowBudgeting] = useState(false);
  const [accExcludeFromTotals, setAccExcludeFromTotals] = useState(false);
  const [accDueDate, setAccDueDate] = useState("");
  const [accCycleDate, setAccCycleDate] = useState("");

  // Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAccount, setPayAccount] = useState<Account | null>(null);

  // Category Form State
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"income" | "expense">("expense");
  const [catColor, setCatColor] = useState("orange");

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
      if (t.type === 'budget' && t.accountId === accountId) return acc - t.amount;
      return acc;
    }, initialBalance);
  };

  const getAccountReservedBalance = (accountId: string) => {
    const transactions = state.transactions.filter(t => t.accountId === accountId && t.type === 'budget');
    return transactions.reduce((acc, t) => acc + t.amount, 0);
  };

  const netWorth = state.accounts.reduce((acc, a) => {
    if (a.excludeFromTotals) return acc;
    const balance = getAccountBalance(a.id, a.initialBalance);
    return acc + balance;
  }, 0);

  const assets = state.accounts.reduce((acc, a) => {
    if (a.excludeFromTotals) return acc;
    const balance = getAccountBalance(a.id, a.initialBalance);
    return acc + (balance > 0 ? balance : 0);
  }, 0);

  const liabilities = state.accounts.reduce((acc, a) => {
    if (a.excludeFromTotals) return acc;
    const balance = getAccountBalance(a.id, a.initialBalance);
    return acc + (balance < 0 ? Math.abs(balance) : 0);
  }, 0);

  const totalReserved = state.transactions
    .filter(t => t.type === 'budget')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const accountData = {
      name: accName,
      groupId: accGroup,
      initialBalance: parseFloat(accBalance),
      color: accColor,
      allowBudgeting: accAllowBudgeting,
      excludeFromTotals: accExcludeFromTotals,
      dueDate: accDueDate ? parseInt(accDueDate) : undefined,
      cycleDate: accCycleDate ? parseInt(accCycleDate) : undefined,
    };

    if (editingAccount) {
      updateAccount({ ...editingAccount, ...accountData });
    } else {
      addAccount(accountData);
    }
    setIsAccountModalOpen(false);
    setEditingAccount(null);
    setAccName("");
    setAccBalance("");
    setAccAllowBudgeting(false);
    setAccExcludeFromTotals(false);
    setAccDueDate("");
    setAccCycleDate("");
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
    setAccAllowBudgeting(false);
    setAccExcludeFromTotals(false);
    setAccDueDate("");
    setAccCycleDate("");
    if (state.groups.length > 0) setAccGroup(state.groups[0].id);
    setIsAccountModalOpen(true);
  };
  
  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccName(account.name);
    setAccBalance(account.initialBalance.toString());
    setAccGroup(account.groupId);
    setAccColor(account.color || "cyan");
    setAccAllowBudgeting(account.allowBudgeting || false);
    setAccExcludeFromTotals(account.excludeFromTotals || false);
    setAccDueDate(account.dueDate?.toString() || "");
    setAccCycleDate(account.cycleDate?.toString() || "");
    setIsAccountModalOpen(true);
  };

  const handlePayCreditCard = (account: Account) => {
    setPayAccount(account);
    setIsPayModalOpen(true);
  };

  const getLastCycleDate = (cycleDay: number) => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    const date = now.getDate();

    if (date < cycleDay) {
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
    }
    
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const actualCycleDay = Math.min(cycleDay, lastDayOfMonth);

    return new Date(year, month, actualCycleDay, 0, 0, 0, 0);
  };

  const hasMadePaymentSinceCycle = (accountId: string, cycleDay: number) => {
    const lastCycleDate = getLastCycleDate(cycleDay);
    return state.transactions.some(t => 
      t.toAccountId === accountId && 
      t.isCCPayment === true && 
      new Date(t.date) >= lastCycleDate
    );
  };

  const isOverdue = (account: Account, balance: number) => {
    if (!account.dueDate || !account.cycleDate) return false;
    
    // If balance is 0 or positive, no payment needed
    if (balance >= 0) return false;

    const now = new Date();
    const today = now.getDate();
    const hasPaid = hasMadePaymentSinceCycle(account.id, account.cycleDate);

    if (hasPaid) return false;

    // Logic: 
    // 1. If today is within 48 hours of due date
    // 2. If today is past the due date
    
    // To check "within 48 hours", we compare the actual dates
    let year = now.getFullYear();
    let month = now.getMonth();
    
    // If today is after due date, the next due date is next month
    // But we are checking if CURRENT due date is close or passed.
    // If cycle date was 15th and due date is 5th, and today is 3rd, 
    // we are in the payment window for the cycle that started last month.
    
    const dueDateObj = new Date(year, month, account.dueDate);
    
    // If cycle day is 15 and due day is 5, and today is 20th, 
    // the bill was generated on 15th, and is due on 5th of NEXT month.
    if (account.cycleDate > account.dueDate && today >= account.cycleDate) {
      dueDateObj.setMonth(dueDateObj.getMonth() + 1);
    }
    // If cycle day is 15 and due day is 25, and today is 10th,
    // the bill was generated on 15th of LAST month, and is due on 25th of LAST month (already passed)
    // or it's due on 25th of THIS month (not yet generated).
    // This gets complex, but let's stick to the 48h and "past due" requirement.

    const diffTime = dueDateObj.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    // Alert if past due OR within 48 hours
    return diffHours <= 48;
  };

  const selectedGroupType = state.groups.find(g => g.id === accGroup)?.type;

  return (
    <div className="space-y-8 pb-40 md:pb-16">
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
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 mb-1">Assets</p>
                <p className="text-lg font-semibold text-emerald-300">{formatCurrency(assets + totalReserved)}</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <p className="text-xs text-rose-400 mb-1">Liabilities</p>
                <p className="text-lg font-semibold text-rose-300">{formatCurrency(liabilities)}</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-xs text-cyan-400 mb-1">Reserved</p>
                <p className="text-lg font-semibold text-cyan-300">{formatCurrency(totalReserved)}</p>
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

        {state.groups.map(group => {
          const groupAccounts = state.accounts.filter(a => a.groupId === group.id);
          if (groupAccounts.length === 0) return null;

          return (
            <div key={group.id} className="space-y-2">
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase px-2">{group.name}</h3>
              {groupAccounts.map(account => {
                 const balance = getAccountBalance(account.id, account.initialBalance);
                 const overdue = group.type === 'credit' && isOverdue(account, balance);
                 
                 return (
                  <motion.div
                    key={account.id}
                    layout
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border shadow-sm transition-colors",
                      overdue 
                        ? "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-200 dark:hover:border-cyan-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        `bg-${account?.color || 'cyan'}-100 dark:bg-${account?.color || 'cyan'}-900/30 text-${account?.color || 'cyan'}-600 dark:text-${account?.color || 'cyan'}-400`
                      )}>
                        {group.type === 'bank' ? <Landmark size={18} /> : group.type === 'credit' ? <CreditCard size={18} /> : group.type === 'investment' ? <TrendingUp size={18} /> : <Wallet size={18} />}
                      </div>
                      <div>
                        <p className={cn("font-medium", overdue ? "text-rose-700 dark:text-rose-300" : "text-slate-900 dark:text-slate-200")}>
                          {account.name}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {group.type === 'credit' ? 'Limit/Due: ' : 'Balance: '} 
                            <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(balance)}</span>
                          </p>
                          {getAccountReservedBalance(account.id) > 0 && (
                            <span className="text-xs text-cyan-600 dark:text-cyan-400">
                              (Reserved: {formatCurrency(getAccountReservedBalance(account.id))})
                            </span>
                          )}
                          {group.type === 'credit' && account.dueDate && (
                            <span className={cn("text-xs", overdue ? "text-rose-600 font-medium" : "text-slate-400")}>
                              Due: {account.dueDate}th
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {group.type === 'credit' && balance < 0 && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mr-2 h-8 text-xs bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                          onClick={() => handlePayCreditCard(account)}
                        >
                          Pay
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEditAccount(account)} className="h-8 w-8">
                        <Edit2 size={14} className="text-slate-400 hover:text-cyan-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteAccount(account.id)} className="h-8 w-8">
                        <Trash2 size={14} className="text-slate-400 hover:text-rose-500" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })}
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
                <div className={`w-2 h-2 rounded-full bg-${category?.color || 'orange'}-500`} />
                <span className="text-sm text-slate-700 dark:text-slate-300">{category.name}</span>
              </div>
              <button onClick={() => deleteCategory(category.id)} className="text-slate-400 hover:text-rose-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Settings & Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-200">Appearance</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {theme === "light" ? "Light Mode" : "Dark Mode"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              Toggle
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <UserIcon size={20} />
                </div>
              )}
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-200">
                  {user ? user.displayName : "Guest User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user 
                    ? user.uid.startsWith("demo-user") 
                      ? "Demo Mode (Not Saved)" 
                      : "Synced with Cloud" 
                    : "Browsing as Guest (Not Saved)"}
                </p>
              </div>
            </div>
            <Button 
              variant={user ? "outline" : "primary"} 
              size="sm" 
              onClick={user ? logout : login}
              className={cn(user && "text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-rose-200 dark:border-rose-900")}
            >
              {user ? (
                <>
                  <LogOut size={16} className="mr-2" /> Sign Out
                </>
              ) : (
                <>
                  <LogIn size={16} className="mr-2" /> Sign In
                </>
              )}
            </Button>
          </CardContent>
        </Card>
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
          
          {selectedGroupType === 'credit' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Cycle Date (Day)</label>
                <Input 
                  type="number" 
                  min="1" 
                  max="31" 
                  value={accCycleDate} 
                  onChange={e => setAccCycleDate(e.target.value)} 
                  placeholder="e.g. 15" 
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Due Date (Day)</label>
                <Input 
                  type="number" 
                  min="1" 
                  max="31" 
                  value={accDueDate} 
                  onChange={e => setAccDueDate(e.target.value)} 
                  placeholder="e.g. 5" 
                />
              </div>
            </div>
          )}

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
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="allowBudgeting" 
              checked={accAllowBudgeting} 
              onChange={e => setAccAllowBudgeting(e.target.checked)}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="allowBudgeting" className="text-sm text-slate-700 dark:text-slate-300">Enable Budgeting</label>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="excludeFromTotals" 
              checked={accExcludeFromTotals} 
              onChange={e => setAccExcludeFromTotals(e.target.checked)}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="excludeFromTotals" className="text-sm text-slate-700 dark:text-slate-300">Not include in total</label>
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

      {/* Pay Credit Card Modal */}
      <TransactionModal 
        isOpen={isPayModalOpen} 
        onClose={() => setIsPayModalOpen(false)} 
        initialData={{
          type: 'transfer',
          accountId: state.accounts.find(a => state.groups.find(g => g.id === a.groupId)?.type === 'bank')?.id,
          toAccountId: payAccount?.id,
          amount: payAccount ? Math.abs(getAccountBalance(payAccount.id, payAccount.initialBalance)) : 0,
          note: `Payment for ${payAccount?.name}`,
          isCCPayment: true
        }}
      />
    </div>
  );
}
