import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  LogOut,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register' | 'profile';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
}) => {
  const { user, isAuthenticated, login, register, logout, updateProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'profile'>(
    isAuthenticated ? 'profile' : defaultTab
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(isAuthenticated ? 'profile' : defaultTab);
    }
  }, [isOpen, isAuthenticated, defaultTab]);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetStatus = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: loginEmail, password: loginPassword });
      setSuccessMsg('Logged in successfully!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    if (!regName || !regEmail || !regPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({ name: regName, email: regEmail, password: regPassword });
      setSuccessMsg('Account created successfully!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    setLoading(true);
    try {
      await updateProfile({ name: profileName, email: profileEmail });
      setSuccessMsg('Profile updated successfully!');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    if (!currPassword || !newPassword) {
      setErrorMsg('Please fill in both current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword: currPassword, newPassword });
      setSuccessMsg('Password changed successfully!');
      setCurrPassword('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="course-modal-backdrop" onClick={onClose}>
      <div
        className="course-modal-container"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="course-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
                border: '1px solid rgba(139,92,246,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="course-modal-title" style={{ margin: 0 }}>
                {isAuthenticated ? 'User Account' : 'Welcome to OpenManus'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {isAuthenticated
                  ? 'Manage profile details & credentials'
                  : 'Sign in or register to access personalized learning & memory'}
              </p>
            </div>
          </div>
          <button className="course-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '4px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            margin: '16px 20px 0',
          }}
        >
          {isAuthenticated ? (
            <button
              type="button"
              className={`course-modal-tab-btn active`}
              style={{ flex: 1, textTransform: 'capitalize' }}
            >
              <User size={14} style={{ marginRight: '6px' }} /> Profile Settings
            </button>
          ) : (
            <>
              <button
                type="button"
                className={`course-modal-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('login');
                  resetStatus();
                }}
                style={{ flex: 1 }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`course-modal-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('register');
                  resetStatus();
                }}
                style={{ flex: 1 }}
              >
                Register
              </button>
            </>
          )}
        </div>

        <div className="course-modal-body" style={{ paddingTop: '16px' }}>
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#4ade80',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {!isAuthenticated && activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="course-form-group">
                <label className="course-form-label">
                  <Mail size={13} style={{ display: 'inline', marginRight: '6px' }} /> Email Address
                </label>
                <input
                  type="email"
                  className="course-form-input"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="course-form-group">
                <label className="course-form-label">
                  <Lock size={13} style={{ display: 'inline', marginRight: '6px' }} /> Password
                </label>
                <input
                  type="password"
                  className="course-form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <div className="course-modal-footer" style={{ padding: '16px 0 0', borderTop: 'none' }}>
                <button
                  type="submit"
                  className="course-modal-submit-btn"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                      Signing In...
                    </>
                  ) : (
                    'Sign In to Account'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {!isAuthenticated && activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit}>
              <div className="course-form-group">
                <label className="course-form-label">
                  <User size={13} style={{ display: 'inline', marginRight: '6px' }} /> Full Name
                </label>
                <input
                  type="text"
                  className="course-form-input"
                  placeholder="e.g. Alex Morgan"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>

              <div className="course-form-group">
                <label className="course-form-label">
                  <Mail size={13} style={{ display: 'inline', marginRight: '6px' }} /> Email Address
                </label>
                <input
                  type="email"
                  className="course-form-input"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="course-form-group">
                <label className="course-form-label">
                  <Lock size={13} style={{ display: 'inline', marginRight: '6px' }} /> Create Password
                </label>
                <input
                  type="password"
                  className="course-form-input"
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div className="course-modal-footer" style={{ padding: '16px 0 0', borderTop: 'none' }}>
                <button
                  type="submit"
                  className="course-modal-submit-btn"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                      Creating Account...
                    </>
                  ) : (
                    'Create Free Account'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PROFILE SETTINGS */}
          {isAuthenticated && (
            <div>
              <form onSubmit={handleProfileUpdate} style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#cbd5e1' }}>
                  <ShieldCheck size={14} style={{ display: 'inline', marginRight: '6px', color: '#a78bfa' }} />
                  Profile Details
                </h4>

                <div className="course-form-group">
                  <label className="course-form-label">Full Name</label>
                  <input
                    type="text"
                    className="course-form-input"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />
                </div>

                <div className="course-form-group">
                  <label className="course-form-label">Email Address</label>
                  <input
                    type="email"
                    className="course-form-input"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="course-modal-submit-btn"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '20px 0' }} />

              <form onSubmit={handleChangePasswordSubmit} style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#cbd5e1' }}>
                  <KeyRound size={14} style={{ display: 'inline', marginRight: '6px', color: '#a78bfa' }} />
                  Change Password
                </h4>

                <div className="course-form-group">
                  <label className="course-form-label">Current Password</label>
                  <input
                    type="password"
                    className="course-form-input"
                    placeholder="••••••••"
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="course-form-group">
                  <label className="course-form-label">New Password</label>
                  <input
                    type="password"
                    className="course-form-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="course-modal-submit-btn"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.06)' }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '20px 0' }} />

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <LogOut size={16} /> Sign Out of OpenManus
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
