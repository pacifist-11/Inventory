import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, RefreshCw, Layers, Info } from 'lucide-react';

export default function InventoryList({
  items,
  locations,
  semanticQueries,
  searchQuery,
  setSearchQuery,
  locationFilter,
  setLocationFilter,
  semanticFilter,
  setSemanticFilter,
  onApplyFilters,
  onAdjustStock,
  onSaveItem,
  onDeleteItem,
  user,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [unit, setUnit] = useState('units');
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(0);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [usageContext, setUsageContext] = useState('');

  const isAdmin = Number(user?.role) === 1;

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('');
    setLocation('');
    setUnit('units');
    setStock(0);
    setMinStock(0);
    setDailyUsage(0);
    setUsageContext('');
    setIsOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setName(item.name || '');
    setCategory(item.category || '');
    setLocation(item.location || '');
    setUnit(item.unit || 'units');
    setStock(item.stock ?? 0);
    setMinStock(item.minStock ?? 0);
    setDailyUsage(item.dailyUsage ?? 0);
    setUsageContext(item.usageContext || '');
    setIsOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      category,
      location,
      unit,
      stock: Number(stock),
      minStock: Number(minStock),
      dailyUsage: Number(dailyUsage),
      usageContext,
    };
    onSaveItem(editingItem?.id, payload);
    setIsOpen(false);
  };

  const isLowStock = (item) => {
    return Number(item.stock) <= Number(item.minStock);
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">
          <Layers size={18} />
          <span>Stock Registry</span>
        </h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> New Asset
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="readonly-banner">
          <div className="readonly-banner-icon">
            <Info size={16} />
          </div>
          <div className="readonly-banner-text">
            <strong>Read-Only Operator Mode</strong>
            <span>Standard operator session active. Contact a Control Administrator to add, modify, or delete inventory lines.</span>
          </div>
        </div>
      )}

      {/* Internal Filter / Command Strip */}
      <div className="command-strip" style={{ border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: '0' }}>
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="field"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApplyFilters()}
          />
        </div>

        <select
          className="select"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={semanticFilter}
          onChange={(e) => setSemanticFilter(e.target.value)}
        >
          <option value="">All Signals</option>
          {semanticQueries.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>

        <button className="btn btn-secondary" onClick={onApplyFilters}>
          <RefreshCw size={14} /> Scan
        </button>
      </div>

      {/* Grid view of cards instead of raw table rows */}
      <div className="inventory-grid">
        {items.length === 0 ? (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>No inventory assets matched the current scan.</div>
        ) : (
          items.map((item) => {
            const low = isLowStock(item);
            return (
              <div key={item.id} className="inventory-card">
                <div className="card-header">
                  <div className="card-title-area">
                    <span className="item-name">{item.name}</span>
                    <span className="item-meta">
                      {item.category} &bull; {item.location}
                    </span>
                  </div>
                  <span className={`status-badge ${low ? 'status-low' : 'status-ok'}`}>
                    {low ? 'Low' : 'OK'}
                  </span>
                </div>

                <div className="card-body">
                  <span className="stock-count">{item.stock}</span>
                  <span className="stock-unit">{item.unit || 'units'}</span>
                </div>

                <div className="card-actions">
                  <span className="muted" style={{ fontSize: '11px' }}>Daily rate: {item.dailyUsage || 0}/d</span>
                  
                  <div className="row-actions" style={{ display: 'flex', gap: '4px' }}>
                    {isAdmin ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                          title="Consume 1 unit"
                          onClick={() => onAdjustStock(item.id, -1, 'Manual stock reduction')}
                        >
                          -
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                          title="Replenish 1 unit"
                          onClick={() => onAdjustStock(item.id, 1, 'Manual stock addition')}
                        >
                          +
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                          title="Modify details"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                          title="Delete asset"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                              onDeleteItem(item.id);
                            }
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    ) : (
                      <span className="muted" style={{ fontSize: '11px' }}>Read-only</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dialog for Create/Edit */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Modify Asset' : 'Add New Asset'}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group wide">
                  <label>Asset Name *</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="Vortex Mixer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="Lab Equipment"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="Lab A"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stock Level *</label>
                  <input
                    type="number"
                    min="0"
                    className="field"
                    placeholder="10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Alert Threshold *</label>
                  <input
                    type="number"
                    min="0"
                    className="field"
                    placeholder="5"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Unit Description *</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="units"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Daily Consumption Rate</label>
                  <input
                    type="number"
                    min="0"
                    className="field"
                    placeholder="2"
                    value={dailyUsage}
                    onChange={(e) => setDailyUsage(e.target.value)}
                  />
                </div>

                <div className="form-group wide">
                  <label>Context Description</label>
                  <textarea
                    className="textarea"
                    placeholder="Context about operations, replenishment speed, and dependency..."
                    value={usageContext}
                    onChange={(e) => setUsageContext(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Save Changes' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
