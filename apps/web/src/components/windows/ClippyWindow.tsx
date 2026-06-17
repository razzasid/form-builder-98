'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

interface ChatMessage {
  role: 'user' | 'clippy';
  text: string;
}

interface GeneratedForm {
  title: string;
  description: string;
  fields: {
    type: string;
    label: string;
    placeholder: string;
    required: boolean;
    options: string[] | null;
    displayOrder: number;
  }[];
}

interface SavedForm {
  id: string;
  title: string;
}

export function ClippyWindow() {
  const { openWindow, setCurrentFormId } = useWindowStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'clippy', text: 'Hi! I\'m Clippy, your AI Form Assistant! 📎\n\nDescribe the form you need and I\'ll create it for you. For example:\n• "Create a registration form"\n• "Job application form"\n• "Customer feedback survey"' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentForm, setCurrentForm] = useState<GeneratedForm | null>(null);
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateForm = trpc.ai.generateForm.useMutation();
  const createForm = trpc.forms.create.useMutation();
  const saveFields = trpc.fields.saveAll.useMutation();
  const utils = trpc.useContext();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const addMessage = (role: 'user' | 'clippy', text: string) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    setInput('');
    addMessage('user', prompt);
    setIsLoading(true);
    setCurrentForm(null);

    try {
      const result = await generateForm.mutateAsync({ prompt });
      if ('message' in result && result.message) {
        addMessage('clippy', result.message);
      } else if ('title' in result && result.title) {
        setCurrentForm(result as any);
        addMessage(
          'clippy',
          `I've created a form called "${result.title}" with ${result.fields.length} field${result.fields.length !== 1 ? 's' : ''}. Take a look below!`
        );
      }
    } catch (err: any) {
      addMessage(
        'clippy',
        `Oops! Something went wrong: ${err.message || 'Please try again.'}`
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSave = async () => {
    if (!currentForm) return;
    setIsLoading(true);

    try {
      // 1. Create the form
      const form = await createForm.mutateAsync({
        title: currentForm.title,
        description: currentForm.description,
      });

      // 2. Save all fields
      await saveFields.mutateAsync({
        formId: form.id,
        fields: currentForm.fields.map((f) => ({
          type: f.type as any,
          label: f.label,
          placeholder: f.placeholder || undefined,
          required: f.required,
          options: f.options || undefined,
          displayOrder: f.displayOrder,
        })),
      });

      setSavedForms((prev) => [...prev, { id: form.id, title: currentForm.title }]);
      addMessage('clippy', `"${currentForm.title}" saved! ✅ You can now open it in the Form Builder.`);

      // Invalidate forms list so it shows up in My Forms
      utils.forms.list.invalidate();
    } catch (err: any) {
      addMessage('clippy', `Failed to save: ${err.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (formId: string) => {
    setCurrentFormId(formId);
    openWindow('formBuilder');
  };

  const fieldTypeEmoji: Record<string, string> = {
    text: '📝',
    email: '📧',
    number: '#️⃣',
    textarea: '📄',
    dropdown: '📋',
    checkbox: '☑️',
    radio: '🔘',
  };

  return (
    <Win98Window name="clippy" title="📎 Clippy — AI Form Assistant" minWidth={350} minHeight={300}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Chat Messages */}
        <div className="clippy-chat-area scrollable">
          {messages.map((msg, i) => (
            <div key={i} className={`clippy-msg clippy-msg-${msg.role}`}>
              {msg.role === 'clippy' && <span className="clippy-msg-icon">📎</span>}
              <div className={`clippy-msg-bubble clippy-msg-bubble-${msg.role}`}>
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="clippy-msg clippy-msg-clippy">
              <span className="clippy-msg-icon">📎</span>
              <div className="clippy-msg-bubble clippy-msg-bubble-clippy clippy-typing">
                <span className="clippy-dot"></span>
                <span className="clippy-dot"></span>
                <span className="clippy-dot"></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Form Preview */}
        {currentForm && (
          <div className="clippy-form-preview">
            <div className="clippy-preview-header">
              <strong>{currentForm.title}</strong>
              {currentForm.description && (
                <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{currentForm.description}</div>
              )}
            </div>
            <div className="clippy-preview-fields scrollable">
              {currentForm.fields.map((field, i) => (
                <div key={i} className="clippy-preview-field">
                  <span>{fieldTypeEmoji[field.type] || '📝'}</span>
                  <span style={{ flex: 1 }}>
                    {field.label} <span style={{ color: '#808080', fontSize: 10 }}>({field.type})</span>
                  </span>
                  {field.required && <span style={{ color: '#c00', fontSize: 10 }}>*</span>}
                </div>
              ))}
            </div>
            <div className="clippy-preview-actions">
              <button
                onClick={handleSave}
                disabled={isLoading}
                style={{ color: '#006400' }}
              >
                💾 Save
              </button>
              {savedForms.find((f) => f.title === currentForm.title) && (
                <button
                  onClick={() => {
                    const sf = savedForms.find((f) => f.title === currentForm.title);
                    if (sf) handleOpen(sf.id);
                  }}
                >
                  📂 Open
                </button>
              )}
            </div>
          </div>
        )}

        {/* Saved Forms List */}
        {savedForms.length > 0 && (
          <div className="clippy-saved-forms">
            <div style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>Saved forms:</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {savedForms.map((sf) => (
                <button
                  key={sf.id}
                  onClick={() => handleOpen(sf.id)}
                  className="clippy-saved-form-btn"
                >
                  {sf.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="clippy-input-bar">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe the form you want..."
            disabled={isLoading}
            style={{ flex: 1 }}
            autoFocus
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </Win98Window>
  );
}
