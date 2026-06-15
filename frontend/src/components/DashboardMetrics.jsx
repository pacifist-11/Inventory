import React from 'react';
import { Layers, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';

export default function DashboardMetrics({ summary, itemsCount, locationsCount }) {
  const totalItems = summary.totalItems ?? itemsCount;
  const lowStock = summary.lowStockItems ?? 0;
  const totalStock = summary.totalStock ?? 0;
  const totalLocations = summary.locations ?? locationsCount;

  return (
    <section className="metrics" aria-label="Inventory metrics">
      <article className="metric">
        <div className="metric-icon-box">
          <Layers size={24} />
        </div>
        <div className="metric-info">
          <p className="metric-label">Total Stock Lines</p>
          <p className="metric-value">{totalItems}</p>
        </div>
      </article>

      <article className="metric">
        <div className="metric-icon-box">
          <AlertTriangle size={24} />
        </div>
        <div className="metric-info">
          <p className="metric-label">Low Stock Alerts</p>
          <p className="metric-value" style={{ color: lowStock > 0 ? 'var(--danger-text)' : 'inherit' }}>
            {lowStock}
          </p>
        </div>
      </article>

      <article className="metric">
        <div className="metric-icon-box">
          <CheckCircle size={24} />
        </div>
        <div className="metric-info">
          <p className="metric-label">Total Units Available</p>
          <p className="metric-value">{totalStock}</p>
        </div>
      </article>

      <article className="metric">
        <div className="metric-icon-box">
          <MapPin size={24} />
        </div>
        <div className="metric-info">
          <p className="metric-label">Monitored Locations</p>
          <p className="metric-value">{totalLocations}</p>
        </div>
      </article>
    </section>
  );
}
