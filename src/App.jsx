import React, { useState } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import SettlementsPage from './pages/SettlementsPage.jsx';
import AddExpenseModal from './components/AddExpenseModal.jsx';

const TABS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: '⊞' },
  { id: 'expenses',    label: 'Expenses',     icon: '🧾' },
  { id: 'settlements', label: 'Settlements',  icon: '📅' },
];

function AppShell() {
  const [tab, setTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">₹</div>
          <div className="brand-text">
            <span className="brand-name">SplitEase</span>
            <span className="brand-sub">Roommate expenses</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {TABS.map(t => (
            <button
              key={t.id}
              id={`nav-${t.id}`}
              className={`nav-item ${tab === t.id ? 'nav-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="roommate-chips">
            {['Aayush', 'Hardik', 'Sujal'].map(n => (
              <span key={n} className="roommate-chip">{n[0]}</span>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">
              {TABS.find(t => t.id === tab)?.label}
            </h1>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            id="add-expense-btn-topbar"
          >
            + Add Expense
          </button>
        </header>

        {/* Mobile bottom nav */}
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {TABS.map(t => (
            <button
              key={t.id}
              id={`mobile-nav-${t.id}`}
              className={`mobile-nav-item ${tab === t.id ? 'nav-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>

        <main className="main-content">
          {tab === 'dashboard'   && <DashboardPage onAddExpense={() => setShowModal(true)} />}
          {tab === 'expenses'    && <ExpensesPage onAddExpense={() => setShowModal(true)} />}
          {tab === 'settlements' && <SettlementsPage />}
        </main>
      </div>

      {showModal && <AddExpenseModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
