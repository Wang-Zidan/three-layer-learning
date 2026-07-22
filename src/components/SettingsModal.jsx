import React, { useState, useEffect, useRef } from 'react';
import { loadSettings, saveSettings, DEFAULTS } from '../services/storage.js';
import { COLORS } from '../constants.js';

export default function SettingsModal({ onClose, onExport, onImportFile }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({ apiKey: '', apiBase: '', apiModel: '' });

  useEffect(() => {
    const s = loadSettings();
    setForm(s);
  }, []);

  const handleSave = () => {
    saveSettings(form);
    onClose();
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    marginTop: 6,
    marginBottom: 14,
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.bg,
    color: COLORS.textPrimary,
    fontSize: 14,
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 480,
          maxWidth: '90vw',
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: 24,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18, color: COLORS.textPrimary }}>
          ⚙ API 设置
        </h2>

        <label style={{ fontSize: 13, color: COLORS.textSecondary }}>
          API Key
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder="sk-xxxxxxxx"
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: 13, color: COLORS.textSecondary }}>
          API Base URL
          <input
            type="text"
            value={form.apiBase}
            onChange={(e) => setForm({ ...form, apiBase: e.target.value })}
            placeholder={DEFAULTS.apiBase}
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: 13, color: COLORS.textSecondary }}>
          模型名
          <input
            type="text"
            value={form.apiModel}
            onChange={(e) => setForm({ ...form, apiModel: e.target.value })}
            placeholder={DEFAULTS.apiModel}
            style={inputStyle}
          />
        </label>

        <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 }}>
            数据备份（换设备 / 清缓存前建议先导出）
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onExport}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                background: 'transparent',
                color: COLORS.textPrimary,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              导出备份
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                background: 'transparent',
                color: COLORS.textPrimary,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              导入备份
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                const ok = await onImportFile(f);
                if (ok) onClose();
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid ${COLORS.border}`,
              background: 'transparent',
              color: COLORS.textSecondary,
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: COLORS.accent,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
