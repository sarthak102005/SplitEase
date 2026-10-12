import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ROOMMATE_MAP, ROOMMATE_COLORS } from '../constants.js';
import { formatPaise, formatDate } from '../utils/money.js';

/**
 * Renders a list of suggested transfers with mark-as-paid support.
 *
 * Props:
 *  transfers      – [{ from, to, amountPaise }]
 *  repayments     – all repayments in state (filtered by caller if needed)
 *  settlementId   – the settlement ID to attach new repayments to (null = global)
 *  showMarkPaid   – whether to show the "Mark paid" button
 */
export default function TransferList({ transfers, repayments, settlementId, showMarkPaid = true }) {
  const { addRepaymentPaid, markRepaymentPaid } = useApp();

  if (!transfers || !transfers.length) {
    return (
      <div className="empty-state small">
        <p>✅ All balances are settled — no transfers needed.</p>
      </div>
    );
  }

  // Find an existing repayment record for a given transfer
  function findRepayment(t) {
    return repayments.find(
      r =>
        r.fromRoommateId === t.from &&
        r.toRoommateId   === t.to &&
        r.amountPaise    === t.amountPaise &&
        (settlementId === null || r.relatedSettlementId === settlementId)
    );
  }

  function handleMarkPaid(t) {
    const existing = findRepayment(t);
    if (existing && existing.status === 'pending') {
      markRepaymentPaid(existing.id);
    } else if (!existing) {
      // Create + mark paid atomically
      addRepaymentPaid(t.from, t.to, t.amountPaise, settlementId);
    }
    // If existing is already paid — do nothing
  }

  return (
    <div className="transfer-list">
      {transfers.map((t, i) => {
        const rep    = findRepayment(t);
        const isPaid = rep?.status === 'paid';

        return (
          <div key={i} className={`transfer-row ${isPaid ? 'transfer-paid' : ''}`}>
            <div className="transfer-info">
              <span
                className="transfer-avatar"
                style={{ background: ROOMMATE_COLORS[t.from] }}
                title={ROOMMATE_MAP[t.from]}
              >
                {ROOMMATE_MAP[t.from][0]}
              </span>
              <span className="transfer-from">{ROOMMATE_MAP[t.from]}</span>
              <span className="transfer-arrow">→</span>
              <span
                className="transfer-avatar"
                style={{ background: ROOMMATE_COLORS[t.to] }}
                title={ROOMMATE_MAP[t.to]}
              >
                {ROOMMATE_MAP[t.to][0]}
              </span>
              <span className="transfer-to">{ROOMMATE_MAP[t.to]}</span>
              <span className="transfer-amount">{formatPaise(t.amountPaise)}</span>
            </div>

            <div className="transfer-status">
              {isPaid ? (
                <span className="badge badge-paid">
                  ✓ Paid{rep.paidAt ? ` · ${formatDate(rep.paidAt.slice(0, 10))}` : ''}
                </span>
              ) : showMarkPaid ? (
                <button
                  className="btn btn-sm btn-outline-green"
                  onClick={() => handleMarkPaid(t)}
                >
                  Mark paid
                </button>
              ) : (
                <span className="badge badge-pending">Pending</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
