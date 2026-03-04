import React, { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Layout } from "@/components/layout/Layout";
import { Transactions } from "@/pages/Transactions";
import { Setup } from "@/pages/Setup";
import { Analytics } from "@/pages/Analytics";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";

export default function App() {
  const [activeTab, setActiveTab] = useState<"transactions" | "analytics" | "setup">("transactions");
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
            {activeTab === "setup" && <Setup />}
          </Layout>
          
          <AddTransactionModal 
            isOpen={isAddTransactionModalOpen} 
            onClose={() => setIsAddTransactionModalOpen(false)} 
          />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
