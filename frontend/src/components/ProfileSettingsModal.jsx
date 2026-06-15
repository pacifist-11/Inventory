import React, { useState } from 'react';
import { X, User, Phone, Mail, Shield, Key, Eye, EyeOff } from 'lucide-react';

export default function ProfileSettingsModal({ user, onClose, onProfileUpdate, gatewayBase, token, showToast }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  
  // Profile Form State
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  
  // Show/Hide password states
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: '', type: '' });

    try {
      const response = await fetch(`${gatewayBase}/authservice/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Token': token
        },
        body: JSON.stringify({ fullname, phone }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to update profile');
      }

      if (data.code === 200) {
        setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
        showToast('Profile settings updated.', 'success');
        // Update user state in App.jsx
        onProfileUpdate({
          ...user,
          fullname,
          phone
        });
      } else {
        setProfileMsg({ text: data.message || 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      setProfileMsg({ text: err.message || 'Connection error.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ text: 'Password must be at least 4 characters long.', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg({ text: '', type: '' });

    try {
      const response = await fetch(`${gatewayBase}/authservice/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': token
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to change password');
      }

      if (data.code === 200) {
        setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
        showToast('Security credentials updated.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ text: data.message || 'Incorrect current password.', type: 'error' });
      }
    } catch (err) {
      setPasswordMsg({ text: err.message || 'Connection error.', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-content" style={{ maxWidth: '480px', borderRadius: '16px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h3 className="modal-title">Control Room Settings</h3>
            <span className="muted" style={{ fontSize: '11px' }}>Manage identity credentials and keys</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Setting Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-color)', 
          background: '#fafafb', 
          padding: '0 16px' 
        }}>
          <button 
            type="button" 
            onClick={() => setActiveTab('profile')}
            style={{ 
              padding: '12px 16px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent', 
              color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'profile' ? '600' : '500', 
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Profile Info
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('password')}
            style={{ 
              padding: '12px 16px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'password' ? '2px solid var(--primary)' : '2px solid transparent', 
              color: activeTab === 'password' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'password' ? '600' : '500', 
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Change Password
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {profileMsg.text && (
                <div style={{ 
                  padding: '10px 14px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  background: profileMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', 
                  color: profileMsg.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
                  border: `1px solid ${profileMsg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}`
                }}>
                  {profileMsg.text}
                </div>
              )}

              <div className="form-group">
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="field"
                    style={{ paddingLeft: '38px', height: '38px' }}
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    required
                    placeholder="Inventory Operator"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    className="field"
                    style={{ paddingLeft: '38px', height: '38px' }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="9999999999"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address (Immutable)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="field"
                    style={{ paddingLeft: '38px', height: '38px', background: '#f8fafc', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                    value={user?.email || ''}
                    disabled
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Access Level</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="field"
                    style={{ paddingLeft: '38px', height: '38px', background: '#f8fafc', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                    value={Number(user?.role) === 1 ? 'Control Administrator (Admin)' : 'Standard Operator (User)'}
                    disabled
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={profileLoading} style={{ minWidth: '120px' }}>
                  {profileLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {passwordMsg.text && (
                <div style={{ 
                  padding: '10px 14px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  background: passwordMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', 
                  color: passwordMsg.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
                  border: `1px solid ${passwordMsg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}`
                }}>
                  {passwordMsg.text}
                </div>
              )}

              <div className="form-group">
                <label>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    className="field"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '38px' }}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '11px', 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-muted)', 
                      cursor: 'pointer' 
                    }}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    className="field"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '38px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '11px', 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-muted)', 
                      cursor: 'pointer' 
                    }}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    className="field"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '38px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '11px', 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-muted)', 
                      cursor: 'pointer' 
                    }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={passwordLoading} style={{ minWidth: '140px' }}>
                  {passwordLoading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
