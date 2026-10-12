import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import BalanceSummary from '../components/BalanceSummary.jsx';
import TransferList from '../components/TransferList.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import {
  formatPaise,
  formatMonthKey,
  currentMonthKey,
  monthKey,
  settlementDate,
} from '../utils/money.js';
import { ROOMMATES } from '../constants.js';

export default function DashboardPage({ onAddExpense }) {
  const {
    state,
    globalBalances,
    globalTransfers,
    showReminder,
    dismissReminder,
    deleteExpense,
  } = useApp();

  const { expenses, repayments } = state;
  const cmk = currentMonthKey();

  // Summary stats
  const totalSpent = useMemo(
    () => expenses.reduce((s, e) => s + e.amountPaise, 0),
    [expenses]
  );

  const currentMonthExpenses = useMemo(
    () => expenses.filter(e => monthKey(e.expenseDate) === cmk),
    [expenses, cmk]
  );
  const currentMonthSpent = currentMonthExpenses.reduce((s, e) => s + e.amountPaise, 0);

  const maxOwed = Math.max(0, ...ROOMMATES.map(r => -Math.min(0, globalBalances[r.id] || 0)));
  const maxReceivable = Math.max(0, ...ROOMMATES.map(r => Math.max(0, globalBalances[r.id] || 0)));

  // Recent 5 expenses globally
  const recent = [...expenses]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const sd = settlementDate(cmk);
  const sdStr = sd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });

  return (
    <div className="page-content">
      {/* Settlement reminder banner */}
      {showReminder && (
        <div className="reminder-banner" role="alert">
          <div className="reminder-icon">🔔</div>
          <div className="reminder-text">
            <strong>Settlement due!</strong> {formatMonthKey(cmk)} settlement date ({sdStr}) has passed.
            Visit <em>Settlements</em> to finalize.
          </div>
          <button className="icon-btn" onClick={() => dismissReminder(cmk)} aria-label="Dismiss reminder">✕</button>
        </div>
      )}

      {/* Summary stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Shared Spending</span>
          <span className="stat-value">{formatPaise(totalSpent)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">This Month</span>
          <span className="stat-value">{formatPaise(currentMonthSpent)}</span>
          <span className="stat-sub">{formatMonthKey(cmk)}</span>
        </div>
        <div className="stat-card stat-green">
          <span className="stat-label">Max Receivable</span>
          <span className="stat-value text-green">{formatPaise(maxReceivable)}</span>
        </div>
        <div className="stat-card stat-red">
          <span className="stat-label">Max Owed</span>
          <span className="stat-value text-red">{formatPaise(maxOwed)}</span>
        </div>
      </div>

      {/* Balance summary */}
      <section className="dashboard-section">
        <h3 className="section-title">Current Balances</h3>
        <BalanceSummary balances={globalBalances} />
      </section>

      {/* Suggested transfers */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <h3 className="section-title">Suggested Transfers</h3>
          <span className="section-hint">Mark as paid when money is actually transferred</span>
        </div>
        <TransferList
          transfers={globalTransfers}
          repayments={repayments}
          settlementId={null}
          showMarkPaid={true}
        />
      </section>

      {/* Recent expenses */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <h3 className="section-title">Recent Expenses</h3>
          <button className="btn btn-sm btn-ghost" onClick={onAddExpense} id="add-expense-btn-dashboard">
            + Add
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <p>No expenses yet.</p>
            <button className="btn btn-primary" onClick={onAddExpense} id="add-expense-btn-empty">
              Add your first expense
            </button>
          </div>
        ) : (
          <ExpenseList expenses={recent} onDelete={deleteExpense} />
        )}
      </section>
    </div>
  );
}
