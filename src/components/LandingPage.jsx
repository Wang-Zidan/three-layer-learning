import React, { useState, useRef } from 'react';
import { loadSettings } from '../services/storage.js';
import { parseFile } from '../services/fileParser.js';
import { COLORS } from '../constants.js';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LandingPage({
  onGenerate,
  loading,
  error,
  history = [],
  onOpenSubject,
  onDeleteSubject,
}) {
  const [subject, setSubject] = useState('');
  const [showSource, setShowSource] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState('');
  const fileInputRef = useRef(null);

  const settings = loadSettings();
  const missingKey = !settings.apiKey;
  const hasSource = sourceText.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const s = subject.trim();
    if (!s || missingKey || loading) return;
    onGenerate(s, hasSource ? sourceText.trim() : '');
  };

  // 处理文件上传
  const handleFile = async (file) => {
    if (!file) return;
    setSourceLoading(true);
    setSourceError('');
    try {
      const result = await parseFile(file);
      setSourceText(result.text);
      setSourceLabel(
        `${result.fileName} · ${result.wordCount} 字${result.truncated ? '（已截断）' : ''}`
      );
    } catch (err) {
      setSourceError(err.message || '解析文件失败');
      setSourceText('');
      setSourceLabel('');
    } finally {
      setSourceLoading(false);
    }
  };

  const clearSource = () => {
    setSourceText('');
    setSourceLabel('');
    setSourceError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: COLORS.bg,
        color: COLORS.textPrimary,
        padding: '48px 24px',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: 560 }}>
        <h1 style={{ fontSize: 36, marginBottom: 12, fontWeight: 500, textAlign: 'center' }}>
          三层学习法
        </h1>
        <p style={{ color: COLORS.textSecondary, marginBottom: 36, fontSize: 15, textAlign: 'center' }}>
          输入任意学科，AI 帮你生成一张可探索的三层知识地图。
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="例如：现代管理学、机器学习、宏观经济学"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 18px',
              fontSize: 16,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.panel,
              color: COLORS.textPrimary,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />

          {/* 资料来源（可选）：折叠区域 */}
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setShowSource(!showSource)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 14,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: 'transparent',
                color: COLORS.textSecondary,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>
                {hasSource ? `已加载资料：${sourceLabel}` : '📎 上传资料（可选，基于你的教材/PPT 生成）'}
              </span>
              <span style={{ fontSize: 12 }}>{showSource ? '收起 ▲' : '展开 ▼'}</span>
            </button>

            {showSource && (
              <div
                style={{
                  marginTop: 8,
                  padding: 14,
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.panel,
                }}
              >
                <textarea
                  value={sourceText}
                  onChange={(e) => {
                    setSourceText(e.target.value);
                    setSourceLabel(e.target.value.trim() ? `粘贴文本 · ${e.target.value.trim().length} 字` : '');
                    setSourceError('');
                  }}
                  placeholder="直接粘贴文字内容（如教材章节、笔记、PPT 文字版）…"
                  disabled={sourceLoading}
                  style={{
                    width: '100%',
                    minHeight: 100,
                    padding: '10px 12px',
                    fontSize: 14,
                    borderRadius: 6,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.bg,
                    color: COLORS.textPrimary,
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />

                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sourceLoading}
                    style={{
                      padding: '8px 14px',
                      fontSize: 13,
                      borderRadius: 6,
                      border: `1px solid ${COLORS.border}`,
                      background: 'transparent',
                      color: COLORS.textPrimary,
                      cursor: sourceLoading ? 'wait' : 'pointer',
                    }}
                  >
                    {sourceLoading ? '解析中…' : '选择文件'}
                  </button>
                  {hasSource && (
                    <button
                      type="button"
                      onClick={clearSource}
                      style={{
                        padding: '8px 14px',
                        fontSize: 13,
                        borderRadius: 6,
                        border: `1px solid ${COLORS.border}`,
                        background: 'transparent',
                        color: COLORS.textSecondary,
                        cursor: 'pointer',
                      }}
                    >
                      清除
                    </button>
                  )}
                  <span style={{ fontSize: 12, color: COLORS.textSecondary, alignSelf: 'center' }}>
                    支持 .txt / .pdf / .docx / .pptx
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.docx,.pptx"
                  onChange={(e) => handleFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />

                {sourceError && (
                  <div style={{ marginTop: 8, color: '#F87171', fontSize: 13 }}>
                    {sourceError}
                  </div>
                )}
                {hasSource && (
                  <div style={{ marginTop: 8, color: COLORS.accent, fontSize: 12 }}>
                    ✓ 图谱将基于这份资料生成，而非 AI 凭空编造。
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={missingKey || !subject.trim() || loading}
            style={{
              width: '100%',
              padding: '14px 18px',
              fontSize: 16,
              borderRadius: 8,
              border: 'none',
              background:
                missingKey || !subject.trim() || loading ? '#3A4250' : COLORS.accent,
              color:
                missingKey || !subject.trim() || loading ? COLORS.textSecondary : '#fff',
              cursor:
                missingKey || !subject.trim() || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '正在生成知识地图…（约 10–20 秒）' : '生成知识地图'}
          </button>
        </form>

        {missingKey && (
          <div style={{ marginTop: 16, color: '#F87171', fontSize: 14, textAlign: 'center' }}>
            请先点击右上角「设置」填写 API Key。
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 8,
              background: 'rgba(248,113,113,0.12)',
              color: '#F87171',
              fontSize: 14,
              whiteSpace: 'pre-wrap',
            }}
          >
            <strong>生成失败</strong>
            <div style={{ marginTop: 6 }}>{error}</div>
          </div>
        )}

        {/* 学习历史：多门学科并存，点开数据仍在 */}
        {history.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div
              style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              学习历史
              <span style={{ fontSize: 12, opacity: 0.7 }}>（点开任意学科，之前的数据都还在）</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map((h) => (
                <div
                  key={h.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.panel,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{h.subject}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                      更新于 {formatTime(h.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenSubject(h.key)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: COLORS.accent,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      marginLeft: 8,
                    }}
                  >
                    打开
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`确定删除「${h.subject}」？其图谱、对话、笔记都会一并删除。`)) {
                        onDeleteSubject(h.key);
                      }
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${COLORS.border}`,
                      background: 'transparent',
                      color: COLORS.textSecondary,
                      cursor: 'pointer',
                      fontSize: 13,
                      marginLeft: 8,
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
