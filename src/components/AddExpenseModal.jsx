import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ROOMMATES, ROOMMATE_IDS } from '../constants.js';
import { parseRupeesToPaise, todayStr, splitEqually, formatPaise } from '../utils/money.js';

// All split-group options: label + sorted array of ids
const SPLIT_OPTIONS = [
  { label: 'All three (Aayush, Hardik, Sujal)', ids: ['aayush', 'hardik', 'sujal'] },
  { label: 'Aayush & Hardik',                   ids: ['aayush', 'hardik'] },
  { label: 'Aayush & Sujal',                    ids: ['aayush', 'sujal'] },
  { label: 'Hardik & Sujal',                    ids: ['hardik', 'sujal'] },
];

export default function AddExpenseModal({ onClose }) {
  const { addExpense } = useApp();
  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [payerId, setPayerId]         = useState(ROOMMATES[0].id);
  const [date, setDate]               = useState(todayStr());
  const [splitIdx, setSplitIdx]       = useState(0);   // index into SPLIT_OPTIONS
  const [errors, setErrors]           = useState({});
  const [submitted, setSubmitted]     = useState(false);

  const selectedSplit = SPLIT_OPTIONS[splitIdx];

  // Live share preview
  const previewPaise = parseRupeesToPaise(amount);
  const preview = (!isNaN(previewPaise) && previewPaise > 0)
    ? splitEqually(previewPaise, selectedSplit.ids)
    : null;

  function validate() {
    const errs = {};
    if (!description.trim()) errs.description = 'Description is required.';
    const paise = parseRupeesToPaise(amount);
    if (isNaN(paise) || paise <= 0) errs.amount = 'Enter a valid positive amount.';
    if (!date) errs.date = 'Date is required.';
    else {
      const d = new Date(date);
      if (isNaN(d.getTime())) errs.date = 'Invalid date.';
      const now = new Date();
      if (d > new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()))
        errs.date = 'Date too far in the future.';
    }
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const paise = parseRupeesToPaise(amount);
    addExpense(description.trim(), paise, payerId, date, selectedSplit.ids);
    onClose();
  }

  function clearError(field) {
    if (submitted) setErrors(v => ({ ...v, [field]: undefined }));
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">Add Expense</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Description */}
          <div className="form-field">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={e => { setDescription(e.target.value); clearError('description'); }}
              placeholder="e.g. Electricity bill"
              className={submitted && errors.description ? 'input-error' : ''}
              autoFocus
            />
            {submitted && errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          {/* Amount */}
          <div className="form-field">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => { setAmount(e.target.value); clearError('amount'); }}
              placeholder="0.00"
              className={submitted && errors.amount ? 'input-error' : ''}
            />
            {submitted && errors.amount && <span className="field-error">{errors.amount}</span>}
          </div>

          {/* Paid by */}
          <div className="form-field">
            <label htmlFor="payer">Paid by</label>
            <select id="payer" value={payerId} onChange={e => setPayerId(e.target.value)}>
              {ROOMMATES.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Split among */}
          <div className="form-field">
            <label htmlFor="split-among">Split among</label>
            <select
              id="split-among"
              value={splitIdx}
              onChange={e => setSplitIdx(Number(e.target.value))}
            >
              {SPLIT_OPTIONS.map((opt, i) => (
                <option key={i} value={i}>{opt.label}</option>
              ))}
            </select>

            {/* Live share preview */}
            {preview && (
              <div className="split-preview">
                {selectedSplit.ids.map(id => {
                  const name = ROOMMATES.find(r => r.id === id)?.name;
                  return (
                    <span key={id} className="split-preview-chip">
                      {name}: {formatPaise(preview[id])}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="form-field">
            <label htmlFor="exp-date">Expense date</label>
            <input
              id="exp-date"
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); clearError('date'); }}
              className={submitted && errors.date ? 'input-error' : ''}
            />
            {submitted && errors.date && <span className="field-error">{errors.date}</span>}
            <span className="field-hint">Expense is filed under its actual month.</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Expense</button>
          </div>
        </form>
      </div>
    </div>
  );
}
