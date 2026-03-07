import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Settings, BarChart3, Plus, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: "transactions" | "analytics" | "budget" | "config";
  onTabChange: (tab: "transactions" | "analytics" | "budget" | "config") => void;
  onAddTransaction?: () => void;
}

export function Layout({ children, activeTab, onTabChange, onAddTransaction }: LayoutProps) {
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
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
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
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl shadow-slate-200/50 dark:shadow-black/50 flex items-center justify-between relative">
          
          <NavButton
            isActive={activeTab === "transactions"}
            onClick={() => onTabChange("transactions")}
            icon={<LayoutDashboard size={20} />}
            label="Daily"
          />

          <NavButton
            isActive={activeTab === "analytics"}
            onClick={() => onTabChange("analytics")}
            icon={<BarChart3 size={20} />}
            label="Insights"
          />

          <div className="relative -top-6">
             <Button 
                size="icon" 
                className="h-14 w-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 border-4 border-white dark:border-slate-900 transition-all duration-300 hover:scale-105"
                onClick={onAddTransaction}
             >
                <Plus size={28} className="text-white" />
             </Button>
          </div>

          <NavButton
            isActive={activeTab === "budget"}
            onClick={() => onTabChange("budget")}
            icon={<PieChart size={20} />}
            label="Budget"
          />

          <NavButton
            isActive={activeTab === "config"}
            onClick={() => onTabChange("config")}
            icon={<Settings size={20} />}
            label="Config"
          />

        </div>
      </div>
    </div>
  );
}

function NavButton({ isActive, onClick, icon, label }: { isActive: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200 relative",
        isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      )}
    >
      <div className={cn("relative z-10 transition-transform duration-200", isActive && "scale-110")}>
        {icon}
      </div>
      <span className="relative z-10 text-[10px] font-medium mt-1">{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeTabMobile"
          className="absolute inset-0 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl z-0"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}
