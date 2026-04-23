import React, { useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Layout } from "@/components/layout/Layout";
import { Transactions } from "@/pages/Transactions";
import { Config } from "@/pages/Config";
import { Analytics } from "@/pages/Analytics";
import { Budget } from "@/pages/Budget";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { Button } from "@/components/ui/Button";
import { LogIn, Sparkles } from "lucide-react";

function AppContent() {
  const { user, login, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"transactions" | "analytics" | "budget" | "config">("transactions");
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full relative">
          {/* Decorative background effects */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl mix-blend-multiply opacity-50 dark:opacity-20 animate-blob"></div>
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl mix-blend-multiply opacity-50 dark:opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl mix-blend-multiply opacity-50 dark:opacity-20 animate-blob animation-delay-4000"></div>
          
          <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 p-8 rounded-3xl shadow-xl shadow-cyan-900/5">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Sparkles className="text-white w-8 h-8" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2 font-sans tracking-tight">
              Welcome to Nebula
            </h1>
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-8">
              Your financial life, beautifully organized in the cloud. Login securely to continue.
            </p>
            
            <Button 
              onClick={login} 
              className="w-full py-6 text-base font-medium rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 dark:shadow-white/10"
            >
              <LogIn className="w-5 h-5" />
              Sign in with Google
            </Button>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                All data is private and encrypted to your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FinanceProvider>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddTransaction={() => setIsAddTransactionModalOpen(true)}
      >
        {activeTab === "transactions" && <Transactions />}
        {activeTab === "analytics" && <Analytics />}
        {activeTab === "budget" && <Budget />}
        {activeTab === "config" && <Config />}
      </Layout>
      
      <TransactionModal 
        isOpen={isAddTransactionModalOpen} 
        onClose={() => setIsAddTransactionModalOpen(false)} 
      />
    </FinanceProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
