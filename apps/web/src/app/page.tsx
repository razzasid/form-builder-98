'use client';

import { useEffect, useState } from 'react';
import { authStorage } from '@/lib/auth';
import { useWindowStore } from '@/store/windowStore';
import { Desktop } from '@/components/desktop/Desktop';
import { Taskbar } from '@/components/desktop/Taskbar';
import { LoginWindow } from '@/components/windows/LoginWindow';
import { RegisterWindow } from '@/components/windows/RegisterWindow';
import { MyFormsWindow } from '@/components/windows/MyFormsWindow';
import { RecycleBinWindow } from '@/components/windows/RecycleBinWindow';
import { FormBuilderWindow } from '@/components/windows/FormBuilderWindow';
import { FormPreviewWindow } from '@/components/windows/FormPreviewWindow';
import { SubmissionsWindow } from '@/components/windows/SubmissionsWindow';
import { AnalyticsWindow } from '@/components/windows/AnalyticsWindow';
import { DisplayPropertiesWindow } from '@/components/windows/DisplayPropertiesWindow';
import { NotepadWindow } from '@/components/windows/NotepadWindow';

export default function HomePage() {
  const { windows, user, setUser } = useWindowStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedUser = authStorage.getUser();
    if (savedUser && authStorage.isLoggedIn()) {
      setUser(savedUser);
    }
  }, [setUser]);

  if (!mounted) return null;

  return (
    <>
      <Desktop user={user} />
      <Taskbar />

      {/* Auth windows */}
      {windows.has('login') && <LoginWindow />}
      {windows.has('register') && <RegisterWindow />}

      {/* App windows (only when logged in) */}
      {user && windows.has('myForms') && <MyFormsWindow />}
      {user && windows.has('recycleBin') && <RecycleBinWindow />}
      {user && windows.has('formBuilder') && <FormBuilderWindow />}
      {user && windows.has('formPreview') && <FormPreviewWindow />}
      {user && windows.has('submissions') && <SubmissionsWindow />}
      {user && windows.has('analytics') && <AnalyticsWindow />}
      {user && windows.has('displayProperties') && <DisplayPropertiesWindow />}
      {user && windows.has('notepad') && <NotepadWindow />}
    </>
  );
}
