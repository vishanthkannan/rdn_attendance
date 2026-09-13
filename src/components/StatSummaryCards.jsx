import React from 'react';
import { CalendarDays, Wallet, Banknote, CheckCircle2 } from 'lucide-react';

export default function StatSummaryCards({ 
  totalWork, 
  totalAdvance, 
  totalAmount, 
  totalBalance 
}) {
  return (
    <div className="metrics-grid">
      {/* Total Work */}
      <div className="metric-card work">
        <div className="metric-card-info">
          <h4>Total Work Days / Units</h4>
          <div className="value tabular-nums">{totalWork.toLocaleString('en-IN')}</div>
        </div>
        <div className="metric-card-icon">
          <CalendarDays size={24} />
        </div>
      </div>

      {/* Total Advance Borrowed */}
      <div className="metric-card advance">
        <div className="metric-card-info">
          <h4>Total Advances (B)</h4>
          <div className="value tabular-nums" style={{ color: 'var(--color-advance)' }}>
            ₹{totalAdvance.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="metric-card-icon">
          <Banknote size={24} />
        </div>
      </div>

      {/* Total Gross Amount */}
      <div className="metric-card wages">
        <div className="metric-card-info">
          <h4>Gross Total Amount</h4>
          <div className="value tabular-nums" style={{ color: 'var(--accent-amber)' }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="metric-card-icon">
          <Wallet size={24} />
        </div>
      </div>

      {/* Net Balance to be Paid */}
      <div className="metric-card balance">
        <div className="metric-card-info">
          <h4>Balance to be Paid</h4>
          <div className="value tabular-nums">
            ₹{totalBalance.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="metric-card-icon">
          <CheckCircle2 size={24} />
        </div>
      </div>
    </div>
  );
}
