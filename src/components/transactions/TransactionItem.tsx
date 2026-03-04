import React from "react";
import { format } from "date-fns";
import { ArrowRightLeft, TrendingDown, TrendingUp, CreditCard } from "lucide-react";
import { Transaction, Category, Account } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  account: Account;
  toAccount?: Account;
  onClick?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  category,
  account,
  toAccount,
  onClick,
}) => {
  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-colors border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50 bg-white/50 dark:bg-white/5 md:bg-white md:dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
            isTransfer
              ? "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
              : isIncome
              ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
          )}
        >
          {isTransfer ? (
            <ArrowRightLeft size={18} />
          ) : isIncome ? (
            <TrendingUp size={18} />
          ) : (
            <TrendingDown size={18} />
          )}
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-200 text-sm">
            {isTransfer
              ? `Transfer to ${toAccount?.name || "Unknown"}`
              : category?.name || "Uncategorized"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: account.color || "#64748b" }} />
            {account.name}
            {transaction.note && <span className="text-slate-400 dark:text-slate-500">• {transaction.note}</span>}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "font-mono font-medium text-sm",
            isTransfer
              ? "text-slate-600 dark:text-slate-400"
              : isIncome
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          )}
        >
          {isTransfer ? "" : isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          {format(new Date(transaction.date), "h:mm a")}
        </p>
      </div>
    </motion.div>
  );
};
