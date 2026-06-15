'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { authStorage } from '@/lib/auth';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

export function RegisterWindow() {
  const { closeWindow, openWindow, setUser } = useWindowStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const register = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
      setUser(data.user);
      closeWindow('register');
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = () => {
    setError('');
    if (!name || !email || !password) { setError('All fields required'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    register.mutate({ name, email, password });
  };

  return (
    <Win98Window name="register" title="📝 Register New User" isDialog>
      <div className="window-body" style={{ padding: 16 }}>
        <p style={{ marginBottom: 12 }}>Create a new account to start building forms.</p>

        <div className="field-row-stacked" style={{ marginBottom: 8 }}>
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%' }}
            autoFocus
          />
        </div>
        <div className="field-row-stacked" style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field-row-stacked" style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field-row-stacked" style={{ marginBottom: 12 }}>
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={{ width: '100%' }}
          />
        </div>

        {error && <p style={{ color: 'red', marginBottom: 8, fontSize: 11 }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={() => { closeWindow('register'); openWindow('login'); }}>
            Back to Login
          </button>
          <button onClick={handleSubmit} disabled={register.isLoading}>
            {register.isLoading ? 'Creating...' : 'Register'}
          </button>
        </div>
      </div>
    </Win98Window>
  );
}
