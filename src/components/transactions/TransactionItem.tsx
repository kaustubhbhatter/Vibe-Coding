import React from "react";
import { ArrowRightLeft, TrendingDown, TrendingUp, Edit2, Trash2, Target } from "lucide-react";
import { Transaction, Category, Account, Budget } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  account: Account;
  toAccount?: Account;
  budget?: Budget;
  onClick?: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  category,
  account,
  toAccount,
  budget,
  onClick,
  onEdit,
  onDelete,
}) => {
  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";
  const isBudget = transaction.type === "budget";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
      onClick={onClick}
      className="group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50 bg-white/50 dark:bg-white/5 md:bg-white md:dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
            isTransfer
              ? "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
              : isIncome
              ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : isBudget
              ? "bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
              : "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
          )}
        >
          {isTransfer ? (
            <ArrowRightLeft size={18} />
          ) : isIncome ? (
            <TrendingUp size={18} />
          ) : isBudget ? (
            <Target size={18} />
          ) : (
            <TrendingDown size={18} />
          )}
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-200 text-sm">
            {isTransfer
              ? `Transfer to ${toAccount?.name || "Unknown"}`
              : isBudget
              ? `Allocated to ${budget?.name || "Unknown Budget"}`
              : category?.name || "Uncategorized"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: account?.color || "#64748b" }} />
            {account?.name || "Unknown Account"}
            {transaction.note && <span className="text-slate-400 dark:text-slate-500">• {transaction.note}</span>}
            {transaction.isCCPayment && (
              <span className="ml-1 px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded text-[9px] font-bold uppercase tracking-wider">
                Bill Payment
              </span>
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-right flex flex-col justify-center">
          <p
            className={cn(
              "font-mono font-medium text-sm",
              isTransfer
                ? "text-slate-600 dark:text-slate-400"
                : isIncome
                ? "text-emerald-600 dark:text-emerald-400"
                : isBudget
                ? "text-cyan-600 dark:text-cyan-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {isTransfer ? "" : isIncome ? "+" : isBudget ? "" : "-"}
            {formatCurrency(transaction.amount)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-100 dark:border-slate-800 ml-2">
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(transaction);
              }}
            >
              <Edit2 size={14} />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(transaction.id);
              }}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
