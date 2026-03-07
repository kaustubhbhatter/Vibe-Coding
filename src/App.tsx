import React, { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Layout } from "@/components/layout/Layout";
import { Transactions } from "@/pages/Transactions";
import { Config } from "@/pages/Config";
import { Analytics } from "@/pages/Analytics";
import { Budget } from "@/pages/Budget";
import { TransactionModal } from "@/components/transactions/TransactionModal";

export default function App() {
  const [activeTab, setActiveTab] = useState<"transactions" | "analytics" | "budget" | "config">("transactions");
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  );
}
