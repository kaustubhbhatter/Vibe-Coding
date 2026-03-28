import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Settings, BarChart3, Plus, PieChart, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useFinance } from "@/context/FinanceContext";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: "transactions" | "analytics" | "budget" | "config";
  onTabChange: (tab: "transactions" | "analytics" | "budget" | "config") => void;
  onAddTransaction?: () => void;
}

export function Layout({ children, activeTab, onTabChange, onAddTransaction }: LayoutProps) {
  const { state } = useFinance();
  const [isAlertHovered, setIsAlertHovered] = useState(false);

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

  const isOverdue = (account: any, balance: number) => {
    if (!account.dueDate) return false;
    const today = new Date().getDate();
    return balance < 0 && today > account.dueDate;
  };

  let hasAlert = false;
  let alertMessages: string[] = [];

  state.accounts.forEach(account => {
    if (account.excludeFromTotals) return;
    const group = state.groups.find(g => g.id === account.groupId);
    const balance = getAccountBalance(account.id, account.initialBalance);

    if (group?.type === 'credit') {
      if (isOverdue(account, balance)) {
        hasAlert = true;
        alertMessages.push(`Payment due for ${account.name}`);
      }
    } else {
      if (balance < 0) {
        hasAlert = true;
        alertMessages.push(`${account.name} has a negative balance`);
      }
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-cyan-500/30 overflow-hidden relative flex transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-200/40 dark:bg-fuchsia-500/10 rounded-full blur-[100px] transition-colors duration-500" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-200/40 dark:bg-cyan-500/10 rounded-full blur-[100px] transition-colors duration-500" />
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-amber-200/30 dark:bg-amber-500/5 rounded-full blur-[80px] transition-colors duration-500" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto scrollbar-hide transition-all duration-300">
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-40 md:pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Dock Navigation (Bottom Middle) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div className={cn(
          "backdrop-blur-xl border rounded-2xl p-2 shadow-xl flex items-center justify-between relative transition-colors duration-300",
          hasAlert 
            ? "bg-rose-50/90 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900 shadow-rose-200/50 dark:shadow-rose-900/50"
            : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-slate-200/50 dark:shadow-black/50"
        )}>
          
          <NavButton
            isActive={activeTab === "transactions"}
            onClick={() => onTabChange("transactions")}
            icon={<LayoutDashboard size={20} />}
            label="Daily"
            hasAlert={hasAlert}
          />

          <NavButton
            isActive={activeTab === "analytics"}
            onClick={() => onTabChange("analytics")}
            icon={<BarChart3 size={20} />}
            label="Insights"
            hasAlert={hasAlert}
          />

          <div className="relative -top-6 flex flex-col items-center">
             <Button 
                size="icon" 
                className={cn(
                  "h-14 w-14 rounded-full shadow-lg border-4 transition-all duration-300 hover:scale-105",
                  hasAlert
                    ? "bg-gradient-to-tr from-rose-500 to-red-600 shadow-rose-500/30 hover:shadow-rose-500/50 border-rose-50 dark:border-rose-950"
                    : "bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-cyan-500/30 hover:shadow-cyan-500/50 border-white dark:border-slate-900"
                )}
                onClick={onAddTransaction}
             >
                <Plus size={28} className="text-white" />
             </Button>
             {hasAlert && (
               <div 
                 className="absolute -bottom-6 text-rose-500 dark:text-rose-400 animate-pulse cursor-pointer" 
                 onMouseEnter={() => setIsAlertHovered(true)}
                 onMouseLeave={() => setIsAlertHovered(false)}
                 onClick={() => setIsAlertHovered(!isAlertHovered)}
               >
                 <Info size={18} />
                 
                 <AnimatePresence>
                   {isAlertHovered && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                       transition={{ duration: 0.15 }}
                       className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-rose-100 dark:border-rose-900/50 text-left z-50 pointer-events-none"
                     >
                       <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2 uppercase tracking-wider">Attention Needed</div>
                       <ul className="space-y-1.5">
                         {alertMessages.map((msg, i) => (
                           <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                             <span>{msg}</span>
                           </li>
                         ))}
                       </ul>
                       <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-b border-r border-rose-100 dark:border-rose-900/50 rotate-45" />
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             )}
          </div>

          <NavButton
            isActive={activeTab === "budget"}
            onClick={() => onTabChange("budget")}
            icon={<PieChart size={20} />}
            label="Budget"
            hasAlert={hasAlert}
          />

          <NavButton
            isActive={activeTab === "config"}
            onClick={() => onTabChange("config")}
            icon={<Settings size={20} />}
            label="Account"
            hasAlert={hasAlert}
          />

        </div>
      </div>
    </div>
  );
}

function NavButton({ isActive, onClick, icon, label, hasAlert }: { isActive: boolean; onClick: () => void; icon: React.ReactNode; label: string; hasAlert?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200 relative",
        isActive 
          ? (hasAlert ? "text-rose-600 dark:text-rose-400" : "text-cyan-600 dark:text-cyan-400") 
          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      )}
    >
      <div className={cn("relative z-10 transition-transform duration-200", isActive && "scale-110")}>
        {icon}
      </div>
      <span className="relative z-10 text-[10px] font-medium mt-1">{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeTabMobile"
          className={cn(
            "absolute inset-0 rounded-xl z-0",
            hasAlert ? "bg-rose-50 dark:bg-rose-500/10" : "bg-cyan-50 dark:bg-cyan-500/10"
          )}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}
