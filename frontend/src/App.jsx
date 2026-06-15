import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Layers, 
  Clock, 
  AlertTriangle, 
  FileText, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  Info,
  XCircle
} from 'lucide-react';

import AuthModal from './components/AuthModal';
import DashboardMetrics from './components/DashboardMetrics';
import InventoryList from './components/InventoryList';
import ProfileSettingsModal from './components/ProfileSettingsModal';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('ims_token') || '');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [theme, setTheme] = useState(localStorage.getItem('ims_theme') || 'sapphire');

  useEffect(() => {
    document.body.classList.remove('theme-sapphire', 'theme-sunset', 'theme-emerald', 'theme-amethyst');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('ims_theme', theme);
  }, [theme]);
  
  // Data lists
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [queue, setQueue] = useState([]);
  const [semanticQueries, setSemanticQueries] = useState([]);
  const [summary, setSummary] = useState({ totalItems: 0, lowStockItems: 0, totalStock: 0, locations: 0 });

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [semanticFilter, setSemanticFilter] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState('');
  const [authMsgType, setAuthMsgType] = useState('info');
  const [toast, setToast] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const gatewayBase = 'http://localhost:8000';
  const coreBase = 'http://localhost:8001';
  const nodeBase = 'http://localhost:8002';

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Main HTTP Request Wrapper with fallback
  const request = async (url, options = {}, isTaskService = false) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !isTaskService) {
      headers['Token'] = token;
    }

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
      throw new Error(Array.isArray(errorMsg) ? errorMsg.map(e => e.msg).join(', ') : errorMsg);
    }

    return data;
  };

  // Load user profile
  const fetchProfile = useCallback(async (authToken) => {
    try {
      const data = await request(`${gatewayBase}/authservice/profile`, {
        headers: { Token: authToken }
      });
      if (data && data.code === 200) {
        setUser({
          fullname: data.fullname,
          email: data.email,
          phone: data.phone,
          role: Number(data.role),
          status: data.status,
        });
      } else {
        throw new Error('Profile retrieval failed');
      }
    } catch (err) {
      try {
        const data = await request(`${coreBase}/users/profile`, {
          headers: { Token: authToken }
        });
        if (data && data.code === 200) {
          setUser({
            fullname: data.fullname,
            email: data.email,
            phone: data.phone,
            role: Number(data.role),
            status: data.status,
          });
        }
      } catch (springErr) {
        setToken('');
        localStorage.removeItem('ims_token');
        setUser(null);
      }
    }
  }, []);

  // Fetch Inventory and Tasks
  const loadAllData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (locationFilter) params.set('location', locationFilter);
    if (semanticFilter) params.set('semantic_query', semanticFilter);

    const queryStr = params.toString();

    // 1. Fetch Inventory Assets
    try {
      const [itemsData, summaryData, locationsData, activityData, queueData, semanticData] = await Promise.all([
        request(`${gatewayBase}/inventoryservice/items?${queryStr}`),
        request(`${gatewayBase}/inventoryservice/summary`).catch(() => null),
        request(`${gatewayBase}/inventoryservice/locations`).catch(() => []),
        request(`${gatewayBase}/inventoryservice/activity`).catch(() => []),
        request(`${gatewayBase}/inventoryservice/queue`).catch(() => []),
        request(`${gatewayBase}/inventoryservice/semantic-queries`).catch(() => []),
      ]);

      setItems(itemsData || []);
      setLocations(locationsData || []);
      setActivity(activityData || []);
      setQueue(queueData || []);
      setSemanticQueries(semanticData || []);
      if (summaryData) {
        setSummary(summaryData);
      } else {
        const totalStock = (itemsData || []).reduce((acc, i) => acc + Number(i.stock || 0), 0);
        const lowStockItems = (itemsData || []).filter(i => Number(i.stock) <= Number(i.minStock)).length;
        setSummary({
          totalItems: itemsData?.length || 0,
          lowStockItems,
          totalStock,
          locations: new Set((itemsData || []).map(i => i.location)).size
        });
      }
    } catch (err) {
      try {
        const [itemsData, summaryData, locationsData, activityData, queueData, semanticData] = await Promise.all([
          request(`${coreBase}/inventory/items?${queryStr}`),
          request(`${coreBase}/inventory/summary`).catch(() => null),
          request(`${coreBase}/inventory/locations`).catch(() => []),
          request(`${coreBase}/inventory/activity`).catch(() => []),
          request(`${coreBase}/inventory/queue`).catch(() => []),
          request(`${coreBase}/inventory/semantic-queries`).catch(() => []),
        ]);

        setItems(itemsData || []);
        setLocations(locationsData || []);
        setActivity(activityData || []);
        setQueue(queueData || []);
        setSemanticQueries(semanticData || []);
        if (summaryData) {
          setSummary(summaryData);
        }
      } catch (fallbackErr) {
        showToast('Gateway and Core backend are offline.', 'error');
      }
    }

    setLoading(false);
  }, [searchQuery, locationFilter, semanticFilter, showToast]);

  // Authenticate
  useEffect(() => {
    if (token) {
      fetchProfile(token);
    }
  }, [token, fetchProfile]);

  // Trigger data load when user is verified or active tab switches
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  const handleLogin = async (email, password) => {
    setLoading(true);
    setAuthMsg('');
    try {
      const res = await request(`${gatewayBase}/authservice/signin`, {
        method: 'POST',
        body: JSON.stringify({ username: email, password }),
      });
      if (res.code === 200) {
        const userToken = res.jwt;
        localStorage.setItem('ims_token', userToken);
        setToken(userToken);
        showToast('Access granted. Welcome to Control Center.', 'success');
      } else {
        setAuthMsg(res.message || 'Invalid credentials.');
        setAuthMsgType('error');
      }
    } catch (err) {
      try {
        const res = await request(`${coreBase}/users/signin`, {
          method: 'POST',
          body: JSON.stringify({ username: email, password }),
        });
        if (res.code === 200) {
          const userToken = res.jwt;
          localStorage.setItem('ims_token', userToken);
          setToken(userToken);
          showToast('Access granted (fallback mode).', 'success');
        } else {
          setAuthMsg(res.message || 'Invalid credentials.');
          setAuthMsgType('error');
        }
      } catch (springErr) {
        setAuthMsg(err.message || 'Backend services are offline.');
        setAuthMsgType('error');
      }
    }
    setLoading(false);
  };

  const handleSignup = async (payload) => {
    setLoading(true);
    setAuthMsg('');
    try {
      const res = await request(`${gatewayBase}/authservice/signup`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.code === 200) {
        setAuthMsg('Operator registration successful. You can now login.');
        setAuthMsgType('success');
      } else {
        setAuthMsg(res.message || 'Registration failed.');
        setAuthMsgType('error');
      }
    } catch (err) {
      try {
        const res = await request(`${coreBase}/users/signup`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.code === 200) {
          setAuthMsg('Registration successful (fallback mode).');
          setAuthMsgType('success');
        } else {
          setAuthMsg(res.message || 'Registration failed.');
          setAuthMsgType('error');
        }
      } catch (springErr) {
        setAuthMsg(err.message || 'Backend services offline.');
        setAuthMsgType('error');
      }
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('ims_token');
    setToken('');
    setUser(null);
    setItems([]);
    showToast('Session ended. Securely logged out.');
  };

  // Inventory modifications
  const handleSaveItem = async (id, itemPayload) => {
    setLoading(true);
    try {
      if (id) {
        try {
          await request(`${gatewayBase}/inventoryservice/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(itemPayload),
          });
        } catch (err) {
          await request(`${coreBase}/inventory/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(itemPayload),
          });
        }
        showToast('Stock line updated successfully.');
      } else {
        try {
          await request(`${gatewayBase}/inventoryservice/items`, {
            method: 'POST',
            body: JSON.stringify(itemPayload),
          });
        } catch (err) {
          await request(`${coreBase}/inventory/items`, {
            method: 'POST',
            body: JSON.stringify(itemPayload),
          });
        }
        showToast('Stock line created successfully.');
      }
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to save inventory item.', 'error');
    }
    setLoading(false);
  };

  const handleAdjustStock = async (id, amount, note) => {
    try {
      try {
        await request(`${gatewayBase}/inventoryservice/items/${id}/adjust`, {
          method: 'PATCH',
          body: JSON.stringify({ amount, note }),
        });
      } catch (err) {
        await request(`${coreBase}/inventory/items/${id}/adjust`, {
          method: 'PATCH',
          body: JSON.stringify({ amount, note }),
        });
      }
      showToast(amount > 0 ? 'Stock replenished.' : 'Stock consumed.');
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to adjust stock.', 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    setLoading(true);
    try {
      try {
        await request(`${gatewayBase}/inventoryservice/items/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        await request(`${coreBase}/inventory/items/${id}`, {
          method: 'DELETE',
        });
      }
      showToast('Inventory line removed.');
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to delete item.', 'error');
    }
    setLoading(false);
  };

  // Trigger search apply when filters change

  // Trigger search apply when filters change
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [locationFilter, semanticFilter]);

  if (!token || !user) {
    return (
      <AuthModal 
        onLogin={handleLogin} 
        onSignup={handleSignup} 
        message={authMsg} 
        messageType={authMsgType}
      />
    );
  }

  const gapFill = (item) => Math.max(Number(item.minStock || 0) - Number(item.stock || 0), 0);

  return (
    <div className="shell">
      {/* Horizontal Top Navigation Bar */}
      <header className="top-navbar">
        <div className="brand-section">
          <div className="brand-icon">
            <Shield size={18} />
          </div>
          <span className="brand-title">FrostControl</span>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-link-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Layers size={15} />
            <span>Inventory Dashboard</span>
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <AlertTriangle size={15} />
            <span>Low Stock Queue</span>
            {queue.length > 0 && (
              <span className="task-count" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', marginLeft: '6px' }}>
                {queue.length}
              </span>
            )}
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <FileText size={15} />
            <span>System Logs</span>
          </button>
        </nav>

        <div className="header-session">
          {/* Dynamic Theme Picker */}
          <div className="theme-picker" title="Switch Theme Mode">
            <button className={`theme-dot sapphire ${theme === 'sapphire' ? 'active' : ''}`} onClick={() => setTheme('sapphire')} title="Sapphire Theme"></button>
            <button className={`theme-dot sunset ${theme === 'sunset' ? 'active' : ''}`} onClick={() => setTheme('sunset')} title="Sunset Theme"></button>
            <button className={`theme-dot emerald ${theme === 'emerald' ? 'active' : ''}`} onClick={() => setTheme('emerald')} title="Emerald Theme"></button>
            <button className={`theme-dot amethyst ${theme === 'amethyst' ? 'active' : ''}`} onClick={() => setTheme('amethyst')} title="Amethyst Theme"></button>
          </div>

          <div className="session-user-badge" onClick={() => setIsSettingsOpen(true)} style={{ cursor: 'pointer' }} title="Manage Profile Settings">
            <div className="session-avatar">
              {user.fullname ? user.fullname.substring(0, 2).toUpperCase() : 'OP'}
            </div>
            <span className="session-username">{user.fullname || 'Operator'}</span>
            <span className={`session-user-role ${Number(user.role) === 1 ? 'role-admin' : 'role-user'}`}>
              {Number(user.role) === 1 ? 'Admin' : 'Operator'}
            </span>
          </div>
          
          <button className="btn btn-secondary" style={{ height: '36px', padding: '0 12px' }} onClick={handleLogout}>
            <LogOut size={14} /> Leave
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Frost monitoring systems</p>
            <h1>
              {activeTab === 'inventory' && 'Stock & Asset Registry'}
              {activeTab === 'queue' && 'Urgent Replenishment Queue'}
              {activeTab === 'activity' && 'System Audit Trail Logs'}
            </h1>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={loadAllData} title="Sync database" disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </header>

        {activeTab === 'inventory' && (
          <>
            <DashboardMetrics 
              summary={summary} 
              itemsCount={items.length} 
              locationsCount={locations.length} 
            />

            <div className="dashboard">
              <InventoryList
                items={items}
                locations={locations}
                semanticQueries={semanticQueries}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
                semanticFilter={semanticFilter}
                setSemanticFilter={setSemanticFilter}
                onApplyFilters={loadAllData}
                onAdjustStock={handleAdjustStock}
                onSaveItem={handleSaveItem}
                onDeleteItem={handleDeleteItem}
                user={user}
              />

              <div className="side-stack">
                {/* Micro panel: Replenishment queue list */}
                <div className="panel">
                  <div className="panel-head">
                    <h3 className="panel-title"><AlertTriangle size={15} style={{ color: 'var(--warning-text)' }} /> Low Stock Alert</h3>
                  </div>
                  <div className="side-card-list">
                    {queue.length === 0 ? (
                      <div className="empty" style={{ padding: '16px 0' }}>All stock optimal.</div>
                    ) : (
                      queue.slice(0, 4).map((item) => (
                        <div key={item.id} className="queue-item">
                          <strong>{item.name}</strong>
                          <span className="muted">
                            {item.location} &bull; Needs {gapFill(item)} {item.unit || 'units'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Micro panel: Activity list */}
                <div className="panel">
                  <div className="panel-head">
                    <h3 className="panel-title"><FileText size={15} style={{ color: 'var(--primary)' }} /> Recent Events</h3>
                  </div>
                  <div className="side-card-list">
                    {activity.length === 0 ? (
                      <div className="empty" style={{ padding: '16px 0' }}>No recent activities.</div>
                    ) : (
                      activity.slice(0, 4).map((log) => (
                        <div key={log.id} className="activity-item">
                          <strong>{log.label}</strong>
                          <span className="muted">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'queue' && (
          <div className="panel">
            <div className="panel-head">
              <h3 className="panel-title"><AlertTriangle size={16} style={{ color: 'var(--warning-text)' }} /> Low Stock Replenishment</h3>
            </div>
            <div className="side-card-list" style={{ maxHeight: 'none', padding: '24px', gap: '14px' }}>
              {queue.length === 0 ? (
                <div className="empty">All inventory levels are optimal. No replenishment needed.</div>
              ) : (
                queue.map((item) => (
                  <div key={item.id} className="queue-item" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '15px' }}>{item.name}</strong>
                        <div className="muted" style={{ marginTop: '6px' }}>
                          Location: <strong>{item.location}</strong> &bull; Category: {item.category}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger-text)' }}>
                          -{gapFill(item)} {item.unit || 'units'}
                        </div>
                        <div className="muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                          Current: {item.stock} / Min: {item.minStock}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="panel">
            <div className="panel-head">
              <h3 className="panel-title"><FileText size={16} style={{ color: 'var(--primary)' }} /> Audit Logs</h3>
            </div>
            <div className="side-card-list" style={{ maxHeight: 'none', padding: '24px', gap: '14px' }}>
              {activity.length === 0 ? (
                <div className="empty">No activity records found in the system database.</div>
              ) : (
                activity.map((log) => (
                  <div key={log.id} className="activity-item" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px' }}>{log.label}</strong>
                      <span className="muted">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {isSettingsOpen && (
        <ProfileSettingsModal
          user={user}
          onClose={() => setIsSettingsOpen(false)}
          onProfileUpdate={(updatedUser) => setUser(updatedUser)}
          gatewayBase={gatewayBase}
          token={token}
          showToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="notification-toast">
          <div className={`toast-icon ${toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'success'}`}>
            {toast.type === 'error' ? <XCircle size={18} /> : toast.type === 'info' ? <Info size={18} /> : <CheckCircle2 size={18} />}
          </div>
          <div className="toast-content">{toast.message}</div>
        </div>
      )}

      {/* Inline Spinner Style */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
