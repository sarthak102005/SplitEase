import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { loadState, saveState } from '../utils/storage';
import {
  genId,
  monthKey,
  computeBalances,
  suggestTransfers,
  currentMonthKey,
  isPastSettlement,
} from '../utils/money';

const AppContext = createContext(null);

// ─── Reducer ────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_EXPENSE': {
      const exp = {
        id: genId(),
        description: action.description,
        amountPaise: action.amountPaise,
        paidByRoommateId: action.paidByRoommateId,
        expenseDate: action.expenseDate,
        splitAmong: action.splitAmong,   // array of roommateIds
        createdAt: new Date().toISOString(),
      };
      const mk = monthKey(exp.expenseDate);
      // If a settlement for this month exists and is finalized → mark needs-review
      const settlements = state.settlements.map(s =>
        s.monthKey === mk && s.status === 'finalized'
          ? { ...s, status: 'needs-review', reviewReason: 'Expense added after finalization' }
          : s
      );
      return { ...state, expenses: [...state.expenses, exp], settlements };
    }

    case 'DELETE_EXPENSE': {
      const exp = state.expenses.find(e => e.id === action.id);
      if (!exp) return state;
      const mk = monthKey(exp.expenseDate);
      const expenses = state.expenses.filter(e => e.id !== action.id);
      const settlements = state.settlements.map(s =>
        s.monthKey === mk && s.status === 'finalized'
          ? { ...s, status: 'needs-review', reviewReason: 'Expense deleted after finalization' }
          : s
      );
      return { ...state, expenses, settlements };
    }

    case 'ADD_REPAYMENT': {
      const rep = {
        id: genId(),
        fromRoommateId: action.fromRoommateId,
        toRoommateId: action.toRoommateId,
        amountPaise: action.amountPaise,
        status: 'pending',
        paidAt: null,
        createdAt: new Date().toISOString(),
        relatedSettlementId: action.relatedSettlementId || null,
      };
      return { ...state, repayments: [...state.repayments, rep] };
    }

    case 'ADD_REPAYMENT_AND_MARK_PAID': {
      const rep = {
        id: genId(),
        fromRoommateId: action.fromRoommateId,
        toRoommateId: action.toRoommateId,
        amountPaise: action.amountPaise,
        status: 'paid',
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        relatedSettlementId: action.relatedSettlementId || null,
      };
      return { ...state, repayments: [...state.repayments, rep] };
    }

    case 'MARK_REPAYMENT_PAID': {
      const repayments = state.repayments.map(r =>
        r.id === action.id && r.status === 'pending'
          ? { ...r, status: 'paid', paidAt: new Date().toISOString() }
          : r
      );
      return { ...state, repayments };
    }

    case 'UPSERT_SETTLEMENT': {
      // Avoid duplicates: one settlement per monthKey
      const exists = state.settlements.find(s => s.monthKey === action.settlement.monthKey);
      if (exists) {
        const settlements = state.settlements.map(s =>
          s.monthKey === action.settlement.monthKey ? action.settlement : s
        );
        return { ...state, settlements };
      }
      return { ...state, settlements: [...state.settlements, action.settlement] };
    }

    case 'REGENERATE_SETTLEMENT': {
      // Recalculate transfers for a settlement, keeping existing paid repayments
      const { monthKey: mk } = action;
      const monthExpenses = state.expenses.filter(e => monthKey(e.expenseDate) === mk);
      const paidReps = state.repayments.filter(
        r => r.relatedSettlementId && r.status === 'paid' &&
          state.settlements.find(s => s.id === r.relatedSettlementId && s.monthKey === mk)
      );
      const balances = computeBalances(monthExpenses, paidReps);
      const transfers = suggestTransfers(balances);

      const existing = state.settlements.find(s => s.monthKey === mk);
      if (!existing) return state;

      const updated = {
        ...existing,
        status: 'finalized',
        suggestedTransfers: transfers,
        balanceSnapshot: balances,
        regeneratedAt: new Date().toISOString(),
        reviewReason: null,
      };

      // Remove pending repayments tied to this settlement (they'll be re-created from new suggestions)
      const repayments = state.repayments.filter(
        r => !(r.relatedSettlementId === existing.id && r.status === 'pending')
      );

      const settlements = state.settlements.map(s => s.monthKey === mk ? updated : s);
      return { ...state, settlements, repayments };
    }

    case 'FINALIZE_SETTLEMENT': {
      const { settlement } = action;
      const settlements = state.settlements.map(s =>
        s.monthKey === settlement.monthKey
          ? { ...s, status: 'finalized', ...settlement }
          : s
      );
      return { ...state, settlements };
    }

    case 'DISMISS_REMINDER': {
      return {
        ...state,
        dismissedReminders: { ...state.dismissedReminders, [action.monthKey]: true },
      };
    }

    case 'LOAD': {
      return action.state;
    }

    default:
      return state;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState());

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Helpers exposed via context
  const addExpense = useCallback((desc, amountPaise, payerId, dateStr, splitAmong) => {
    dispatch({ type: 'ADD_EXPENSE', description: desc, amountPaise, paidByRoommateId: payerId, expenseDate: dateStr, splitAmong });
  }, []);

  const deleteExpense = useCallback((id) => {
    dispatch({ type: 'DELETE_EXPENSE', id });
  }, []);

  const addRepayment = useCallback((from, to, amountPaise, settlementId) => {
    dispatch({ type: 'ADD_REPAYMENT', fromRoommateId: from, toRoommateId: to, amountPaise, relatedSettlementId: settlementId });
  }, []);

  const addRepaymentPaid = useCallback((from, to, amountPaise, settlementId) => {
    dispatch({ type: 'ADD_REPAYMENT_AND_MARK_PAID', fromRoommateId: from, toRoommateId: to, amountPaise, relatedSettlementId: settlementId });
  }, []);

  const markRepaymentPaid = useCallback((id) => {
    dispatch({ type: 'MARK_REPAYMENT_PAID', id });
  }, []);

  const upsertSettlement = useCallback((settlement) => {
    dispatch({ type: 'UPSERT_SETTLEMENT', settlement });
  }, []);

  const regenerateSettlement = useCallback((mk) => {
    dispatch({ type: 'REGENERATE_SETTLEMENT', monthKey: mk });
  }, []);

  const dismissReminder = useCallback((mk) => {
    dispatch({ type: 'DISMISS_REMINDER', monthKey: mk });
  }, []);

  // Derive global balances (all time)
  const globalBalances = computeBalances(
    state.expenses,
    state.repayments.filter(r => r.status === 'paid')
  );
  const globalTransfers = suggestTransfers(globalBalances);

  // Settlement reminder: current month is past settlement date and not dismissed
  const cmk = currentMonthKey();
  const showReminder = isPastSettlement(cmk) && !state.dismissedReminders?.[cmk];

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      addExpense,
      deleteExpense,
      addRepayment,
      addRepaymentPaid,
      markRepaymentPaid,
      upsertSettlement,
      regenerateSettlement,
      dismissReminder,
      globalBalances,
      globalTransfers,
      showReminder,
      currentMonthKey: cmk,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
