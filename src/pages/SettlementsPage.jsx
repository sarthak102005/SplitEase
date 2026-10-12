import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import TransferList from '../components/TransferList.jsx';
import {
  formatMonthKey,
  formatPaise,
  monthKey,
  computeBalances,
  suggestTransfers,
  settlementDate,
  isPastSettlement,
  genId,
} from '../utils/money.js';

function statusBadge(status) {
  const map = {
    open: { label: 'Open', cls: 'badge-open' },
    finalized: { label: 'Finalized', cls: 'badge-finalized' },
    'needs-review': { label: '⚠ Needs Review', cls: 'badge-review' },
  };
  const m = map[status] || { label: status, cls: '' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

export default function SettlementsPage() {
  const {
    state,
    upsertSettlement,
    regenerateSettlement,
    addRepayment,
    markRepaymentPaid,
  } = useApp();

  const { expenses, repayments, settlements } = state;

  // Derive all months from expenses
  const allMonths = useMemo(() => {
    const keys = new Set(expenses.map(e => monthKey(e.expenseDate)));
    const existing = settlements.map(s => s.monthKey);
    existing.forEach(mk => keys.add(mk));
    return Array.from(keys).sort().reverse();
  }, [expenses, settlements]);

  const [expandedMonth, setExpandedMonth] = useState(null);

  function getOrCreateSettlement(mk) {
    return settlements.find(s => s.monthKey === mk);
  }

  function handleFinalize(mk) {
    const monthExpenses = expenses.filter(e => monthKey(e.expenseDate) === mk);
    const paidReps = repayments.filter(
      r => r.status === 'paid' &&
        r.relatedSettlementId &&
        settlements.find(s => s.id === r.relatedSettlementId && s.monthKey === mk)
    );
    const balances = computeBalances(monthExpenses, paidReps);
    const transfers = suggestTransfers(balances);

    const existing = getOrCreateSettlement(mk);
    const settlement = {
      id: existing?.id || genId(),
      monthKey: mk,
      createdAt: existing?.createdAt || new Date().toISOString(),
      status: 'finalized',
      suggestedTransfers: transfers,
      balanceSnapshot: balances,
      finalizedAt: new Date().toISOString(),
      reviewReason: null,
    };
    upsertSettlement(settlement);

    // Create pending repayment records for each transfer
    transfers.forEach(t => {
      const exists = repayments.find(
        r => r.fromRoommateId === t.from &&
          r.toRoommateId === t.to &&
          r.amountPaise === t.amountPaise &&
          r.relatedSettlementId === settlement.id
      );
      if (!exists) {
        addRepayment(t.from, t.to, t.amountPaise, settlement.id);
      }
    });
  }

  if (!allMonths.length) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">📆</div>
          <p>No expenses yet. Add some to see monthly settlements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h2 className="section-title">Monthly Settlements</h2>

      {allMonths.map(mk => {
        const settlement = getOrCreateSettlement(mk);
        const monthExpenses = expenses.filter(e => monthKey(e.expenseDate) === mk);
        const totalPaise = monthExpenses.reduce((s, e) => s + e.amountPaise, 0);
        const isExpanded = expandedMonth === mk;
        const pastSettlement = isPastSettlement(mk);
        const status = settlement?.status || 'open';

        // Transfers to show: finalized → snapshot; open → live calculation
        let transfers = [];
        if (settlement?.suggestedTransfers) {
          transfers = settlement.suggestedTransfers;
        } else {
          const bal = computeBalances(monthExpenses, []);
          transfers = suggestTransfers(bal);
        }

        // Repayments related to this settlement
        const relatedReps = settlement
          ? repayments.filter(r => r.relatedSettlementId === settlement.id)
          : [];

        return (
          <div key={mk} className={`settlement-card ${status === 'needs-review' ? 'settlement-review' : ''}`}>
            <div className="settlement-header" onClick={() => setExpandedMonth(isExpanded ? null : mk)}>
              <div className="settlement-title-row">
                <span className="settlement-month">{formatMonthKey(mk)}</span>
                {statusBadge(status)}
                {status === 'needs-review' && settlement?.reviewReason && (
                  <span className="review-reason">{settlement.reviewReason}</span>
                )}
              </div>
              <div className="settlement-summary-row">
                <span className="settlement-total">{formatPaise(totalPaise)}</span>
                <span className="settlement-exp-count">{monthExpenses.length} expense{monthExpenses.length !== 1 ? 's' : ''}</span>
                <span className={`expand-caret ${isExpanded ? 'expanded' : ''}`}>›</span>
              </div>
            </div>

            {isExpanded && (
              <div className="settlement-body">
                {/* Actions */}
                <div className="settlement-actions">
                  {(status === 'open' || status === 'needs-review') && pastSettlement && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleFinalize(mk)}>
                      {status === 'needs-review' ? 'Re-finalize & Regenerate' : 'Finalize Settlement'}
                    </button>
                  )}
                  {status === 'needs-review' && (
                    <button className="btn btn-outline-amber btn-sm" onClick={() => regenerateSettlement(mk)}>
                      Regenerate Transfers
                    </button>
                  )}
                </div>

                {/* Transfers */}
                <h4 className="sub-section-title">Suggested Transfers</h4>
                <TransferList
                  transfers={transfers}
                  repayments={relatedReps}
                  settlementId={settlement?.id}
                  showMarkPaid={true}
                />

                {/* Expenses */}
                <h4 className="sub-section-title">Expenses this month</h4>
                <ExpenseList expenses={monthExpenses} onDelete={() => {}} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
