'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { authStorage } from '@/lib/auth';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

export function LoginWindow() {
  const { closeWindow, openWindow, setUser } = useWindowStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
      setUser(data.user);
      closeWindow('login');
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = () => {
    setError('');
    if (!email || !password) { setError('All fields required'); return; }
    login.mutate({ email, password });
  };

  return (
    <Win98Window name="login" title="🔑 Login" isDialog>
      <div className="window-body" style={{ padding: 16 }}>
        <p style={{ marginBottom: 12, fontSize: 11 }}>
          Enter your credentials to access FormBuilder 98.
        </p>

        <div className="field-row-stacked" style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%' }}
            autoFocus
          />
        </div>

        <div className="field-row-stacked" style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={{ width: '100%' }}
          />
        </div>

        {error && <p style={{ color: 'red', marginBottom: 8, fontSize: 11 }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => { closeWindow('login'); openWindow('register'); }}>
            Register
          </button>
          <button id="login-submit" onClick={handleSubmit} disabled={login.isLoading}>
            {login.isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
    </Win98Window>
  );
}
