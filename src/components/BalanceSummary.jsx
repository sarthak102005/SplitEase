import React from 'react';
import { ROOMMATES, ROOMMATE_COLORS } from '../constants.js';
import { formatPaise } from '../utils/money.js';

export default function BalanceSummary({ balances }) {
  const totalExpenses = Object.values(balances).reduce((sum, b) => sum + Math.abs(b), 0) / 2;

  return (
    <div className="balance-grid">
      {ROOMMATES.map(r => {
        const bal = balances[r.id] || 0;
        const isPositive = bal > 0;
        const isNeutral  = bal === 0;
        const color = ROOMMATE_COLORS[r.id];
        return (
          <div key={r.id} className={`balance-card ${isPositive ? 'bal-positive' : isNeutral ? 'bal-neutral' : 'bal-negative'}`}>
            <div className="bal-avatar" style={{ background: color }}>{r.name[0]}</div>
            <div className="bal-info">
              <div className="bal-name">{r.name}</div>
              <div className={`bal-amount ${isPositive ? 'text-green' : isNeutral ? 'text-muted' : 'text-red'}`}>
                {isPositive ? '▲ ' : isNeutral ? '— ' : '▼ '}
                {formatPaise(Math.abs(bal))}
              </div>
              <div className="bal-label">
                {isPositive ? 'to receive' : isNeutral ? 'settled' : 'owes'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
