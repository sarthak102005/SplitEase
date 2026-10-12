import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import { monthKey, currentMonthKey } from '../utils/money.js';

export default function ExpensesPage({ onAddExpense }) {
  const { state, deleteExpense } = useApp();
  const { expenses } = state;

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  // Derive all months from expenses
  const allMonths = [...new Set(expenses.map(e => monthKey(e.expenseDate)))].sort().reverse();

  const filtered = expenses
    .filter(e => monthKey(e.expenseDate) === selectedMonth)
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));

  return (
    <div className="page-content">
      <div className="page-toolbar">
        <h2 className="section-title">Expenses</h2>
        <div className="toolbar-right">
          <select
            className="month-select"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            aria-label="Filter by month"
          >
            {allMonths.length === 0 && (
              <option value={currentMonthKey()}>{new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</option>
            )}
            {allMonths.map(mk => {
              const [y, m] = mk.split('-').map(Number);
              const label = new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
              return <option key={mk} value={mk}>{label}</option>;
            })}
          </select>
          <button className="btn btn-primary" onClick={onAddExpense} id="add-expense-btn-page">
            + Add Expense
          </button>
        </div>
      </div>
      <ExpenseList expenses={filtered} onDelete={deleteExpense} />
    </div>
  );
}
