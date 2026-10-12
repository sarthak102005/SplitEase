# SplitEase – Roommate Expense Splitter

A modern, responsive expense splitting web app built for roommates (**Aayush**, **Hardik**, and **Sujal**) with paise-accurate split calculations, custom split combinations, and monthly settlement workflows.

## Features

- **Paise-Safe Currency Math**: Avoids floating-point precision errors by doing all internal calculations in integer paise.
- **Custom Split Combinations**: Split expenses among all three roommates or pairwise:
  - All three (Aayush, Hardik, Sujal)
  - Aayush & Hardik
  - Aayush & Sujal
  - Hardik & Sujal
- **Real-Time Live Preview**: Dynamic preview showing each person's exact share as you enter the expense amount.
- **Optimized Settlement Transfers**: Greedy matching algorithm computes the minimum number of transactions needed to settle all debts.
- **Monthly Settlement Cycles**: Track and finalize monthly settlement snapshots with audit logs and auto-detection of post-settlement edits.
- **Local Persistence**: State automatically persists to browser `localStorage`.
- **Responsive & Modern UI**: Built with custom design tokens, clean typography, micro-interactions, and status badges.

## Tech Stack

- **React 19**
- **Vite**
- **CSS3** (Custom Design System & CSS Variables)
- **LocalStorage API**

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
git clone https://github.com/sarthak102005/SplitEase.git
cd SplitEase
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
