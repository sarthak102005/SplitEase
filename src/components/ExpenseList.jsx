import React, { useState } from 'react';
import { ROOMMATE_MAP, ROOMMATE_COLORS } from '../constants.js';
import { formatPaise, formatDate, splitEqually } from '../utils/money.js';

export default function ExpenseList({ expenses, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);

  if (!expenses.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>No expenses yet. Add one to get started.</p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      {expenses.map(exp => {
        const participants = exp.splitAmong && exp.splitAmong.length > 0 ? exp.splitAmong : null;
        const shares = splitEqually(exp.amountPaise, participants || undefined);
        const payer = ROOMMATE_MAP[exp.paidByRoommateId];
        const color = ROOMMATE_COLORS[exp.paidByRoommateId];
        const splitLabel = participants && participants.length < 3
          ? participants.map(id => ROOMMATE_MAP[id]).join(' & ')
          : 'All 3';

        return (
          <div key={exp.id} className="expense-card">
            <div className="expense-card-left">
              <div className="expense-avatar" style={{ background: color }}>
                {payer[0]}
              </div>
            </div>
            <div className="expense-card-body">
              <div className="expense-top-row">
                <span className="expense-description">{exp.description}</span>
                <span className="expense-amount">{formatPaise(exp.amountPaise)}</span>
              </div>
              <div className="expense-meta-row">
                <span className="expense-payer" style={{ color }}>Paid by {payer}</span>
                <span className="expense-date">{formatDate(exp.expenseDate)}</span>
              </div>
              <div className="expense-splits">
                <span className="split-badge" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-subtle)', borderRadius: '4px', padding: '2px 7px' }}>
                  Split: {splitLabel}
                </span>
                {(participants || Object.keys(shares)).map(id => (
                  <span key={id} className="split-chip">
                    {ROOMMATE_MAP[id]}: {formatPaise(shares[id])}
                  </span>
                ))}
              </div>
            </div>
            <div className="expense-card-actions">
              {confirmId === exp.id ? (
                <div className="confirm-delete">
                  <span>Delete?</span>
                  <button
                    className="btn btn-danger btn-xs"
                    onClick={() => { onDelete(exp.id); setConfirmId(null); }}
                  >Yes</button>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setConfirmId(null)}
                  >No</button>
                </div>
              ) : (
                <button
                  className="icon-btn delete-btn"
                  onClick={() => setConfirmId(exp.id)}
                  aria-label="Delete expense"
                >🗑</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
