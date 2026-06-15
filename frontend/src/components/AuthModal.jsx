import React, { useState } from 'react';
import { Shield, Key, User, Phone, Mail, UserPlus, LogIn } from 'lucide-react';

export default function AuthModal({ onLogin, onSignup, message, messageType }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('admin@inventory.com');
  const [password, setPassword] = useState('admin123');
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(2); // 1 = Admin, 2 = User/Operator

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(email, password);
    } else {
      onSignup({ fullname, phone, email, password, role: Number(role) });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Shield size={26} />
          </div>
          <h2 className="auth-title">
            {isLogin ? 'Control Center Login' : 'Register Operator'}
          </h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Enter credentials to access the inventory control room' 
              : 'Create a new operator account for inventory and tasks'
            }
          </p>
        </div>

        {message && (
          <div className={`auth-message ${messageType === 'error' ? 'error' : 'info'}`}>
            {message}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                  <input
                    type="text"
                    className="field"
                    style={{ paddingLeft: '40px' }}
                    placeholder="Inventory Operator"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                  <input
                    type="tel"
                    className="field"
                    style={{ paddingLeft: '40px' }}
                    placeholder="9999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Access Role / Control Level</label>
                <div className="role-selector-group">
                  <button
                    type="button"
                    className={`role-selector-btn ${role === 2 ? 'active' : ''}`}
                    onClick={() => setRole(2)}
                  >
                    <User size={16} />
                    <span>Operator (User)</span>
                  </button>
                  <button
                    type="button"
                    className={`role-selector-btn ${role === 1 ? 'active' : ''}`}
                    onClick={() => setRole(1)}
                  >
                    <Shield size={16} />
                    <span>Control Admin (Admin)</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
              <input
                type="email"
                className="field"
                style={{ paddingLeft: '40px' }}
                placeholder="operator@inventory.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
              <input
                type="password"
                className="field"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" style={{ marginTop: '10px' }}>
            {isLogin ? (
              <>
                <LogIn size={18} />
                Access Control Room
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Register Operator
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>
              New operator? 
              <button className="auth-link" onClick={() => { setIsLogin(false); setEmail(''); setPassword(''); }}>
                Request Access
              </button>
            </p>
          ) : (
            <p>
              Already registered? 
              <button className="auth-link" onClick={() => { setIsLogin(true); setEmail('admin@inventory.com'); setPassword('admin123'); }}>
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
