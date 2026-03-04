import React, { useMemo, useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subMonths } from "date-fns";
import { motion } from "framer-motion";

const COLORS = ["#06b6d4", "#d946ef", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

export function Analytics() {
  const { state } = useFinance();
  const [timeRange, setTimeRange] = useState<"current" | "last3" | "last6">("current");

  const spendingByCategory = useMemo(() => {
    const data: { [key: string]: number } = {};
    
    // Filter transactions based on time range
    const now = new Date();
    let startDate = startOfMonth(now);
    
    if (timeRange === "last3") startDate = subMonths(startOfMonth(now), 2);
    if (timeRange === "last6") startDate = subMonths(startOfMonth(now), 5);

    state.transactions.forEach(t => {
      if (t.type === 'expense' && new Date(t.date) >= startDate) {
        const categoryName = state.categories.find(c => c.id === t.categoryId)?.name || "Uncategorized";
        data[categoryName] = (data[categoryName] || 0) + t.amount;
      }
    });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [state.transactions, state.categories, timeRange]);

  const trendData = useMemo(() => {
    const now = new Date();
    let startDate = startOfMonth(now);
    if (timeRange === "last3") startDate = subMonths(startOfMonth(now), 2);
    if (timeRange === "last6") startDate = subMonths(startOfMonth(now), 5);
    
    const endDate = endOfMonth(now);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayTransactions = state.transactions.filter(t => t.date.startsWith(dateStr));
      
      const income = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      
      return {
        date: format(day, "MMM d"),
        income,
        expense,
      };
    });
  }, [state.transactions, timeRange]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex justify-end space-x-2">
        {(["current", "last3", "last6"] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={cn(
              "px-3 py-1 text-xs rounded-full transition-colors",
              timeRange === range 
                ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            {range === "current" ? "This Month" : range === "last3" ? "3 Months" : "6 Months"}
          </button>
        ))}
      </div>

      {/* Spending by Category */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#0f172a' }}
                  itemStyle={{ color: '#0f172a' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  formatter={(value) => <span className="text-slate-600 dark:text-slate-400 text-xs ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Income vs Expense Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">Income vs Expense</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#0f172a' }}
                  itemStyle={{ color: '#0f172a' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
