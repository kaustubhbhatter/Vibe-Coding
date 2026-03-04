import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Settings, BarChart3, Plus, Moon, Sun, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: "transactions" | "analytics" | "setup";
  onTabChange: (tab: "transactions" | "analytics" | "setup") => void;
  onAddTransaction?: () => void;
}

export function Layout({ children, activeTab, onTabChange, onAddTransaction }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, login, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-cyan-500/30 overflow-hidden relative flex transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-200/40 dark:bg-fuchsia-500/10 rounded-full blur-[100px] transition-colors duration-500" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-200/40 dark:bg-cyan-500/10 rounded-full blur-[100px] transition-colors duration-500" />
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-amber-200/30 dark:bg-amber-500/5 rounded-full blur-[80px] transition-colors duration-500" />
      </div>

      {/* Floating Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col fixed left-6 top-6 bottom-6 w-20 hover:w-64 transition-all duration-300 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden group">
        <div className="p-6 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0" />
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              Nebula
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4">
          <SidebarButton
            isActive={activeTab === "transactions"}
            onClick={() => onTabChange("transactions")}
            icon={<LayoutDashboard size={24} />}
            label="Transactions"
          />
          <SidebarButton
            isActive={activeTab === "analytics"}
            onClick={() => onTabChange("analytics")}
            icon={<BarChart3 size={24} />}
            label="Analytics"
          />
          <SidebarButton
            isActive={activeTab === "setup"}
            onClick={() => onTabChange("setup")}
            icon={<Settings size={24} />}
            label="Setup"
          />
        </nav>

        <div className="p-3 space-y-2">
          {/* Auth Button */}
          <button
            onClick={user ? logout : login}
            className="flex items-center gap-4 w-full p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-6 flex justify-center">
              {user ? (
                user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={20} />
                )
              ) : (
                <LogIn size={20} />
              )}
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium">
              {user ? "Sign Out" : "Sign In"}
            </span>
          </button>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-4 w-full p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-6 flex justify-center">
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium">
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
          </button>

          <Button 
            className="w-full justify-start gap-4 shadow-lg shadow-cyan-500/20 p-3" 
            size="lg"
            onClick={onAddTransaction}
          >
            <div className="w-6 flex justify-center">
              <Plus size={24} />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Add New</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto scrollbar-hide md:pl-32 transition-all duration-300">
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

      {/* Mobile Floating Dock Navigation */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
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
            isActive={activeTab === "setup"}
            onClick={() => onTabChange("setup")}
            icon={<Settings size={20} />}
            label="Setup"
          />
          
          <div className="flex flex-col gap-1">
             <button
              onClick={user ? logout : login}
              className="flex flex-col items-center justify-center w-16 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all duration-200"
            >
              {user ? (
                 user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                 ) : (
                  <UserIcon size={18} />
                 )
              ) : (
                <LogIn size={18} />
              )}
            </button>
            <button
              onClick={toggleTheme}
              className="flex flex-col items-center justify-center w-16 h-6 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all duration-200"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

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
      <span className="text-[10px] font-medium mt-1">{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeTabMobile"
          className="absolute inset-0 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function SidebarButton({ isActive, onClick, icon, label }: { isActive: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 w-full p-3 rounded-xl transition-all duration-200 relative group overflow-hidden",
        isActive 
          ? "text-cyan-700 dark:text-cyan-400 font-medium bg-cyan-50 dark:bg-cyan-500/10" 
          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
    >
      <div className="relative z-10 w-6 flex justify-center">{icon}</div>
      <span className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{label}</span>
      
      {isActive && (
        <motion.div
          layoutId="activeTabDesktop"
          className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-r-full"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}
