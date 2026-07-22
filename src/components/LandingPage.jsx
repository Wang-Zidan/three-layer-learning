import React, { useState, useRef, useEffect } from 'react';
import { loadSettings } from '../services/storage.js';
import { parseFile } from '../services/fileParser.js';
import { recommendForms, FORM_TYPES, formThumbSVG } from '../utils/forms.js';
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
  const [goal, setGoal] = useState('');
  const [formType, setFormType] = useState('radial');
  const [formTouched, setFormTouched] = useState(false);

  const [showSource, setShowSource] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState('');

  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState(null); // null = 全选

  const fileInputRef = useRef(null);

  const settings = loadSettings();
  const missingKey = !settings.apiKey;
  const hasSource = sourceText.trim().length > 0;

  // 纯规则推荐：根据学习目的关键词给出首选形态（用户未手动选过时自动跟随）。
  const recommended = recommendForms(goal);
  useEffect(() => {
    if (!formTouched) setFormType(recommended[0]);
  }, [recommended[0], formTouched]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const s = subject.trim();
    if (!s || missingKey || loading) return;
    let effSource = sourceText.trim();
    if (sections.length > 1 && selectedSections) {
      effSource = sections
        .filter((_, i) => selectedSections.has(i))
        .map((x) => x.text)
        .join('\n\n')
        .trim();
    }
    onGenerate(s, effSource, goal.trim(), formType);
  };

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
      setSections(result.sections || []);
      setSelectedSections(null);
      // 用户还没填标题时，自动用文件名（去掉扩展名）作为学科/资料标题
      if (!subject.trim()) {
        const base = (result.fileName || '').replace(/\.[^.]+$/, '');
        if (base) setSubject(base);
      }
    } catch (err) {
      setSourceError(err.message || '解析文件失败');
      setSourceText('');
      setSourceLabel('');
      setSections([]);
      setSelectedSections(null);
    } finally {
      setSourceLoading(false);
    }
  };

  const clearSource = () => {
    setSourceText('');
    setSourceLabel('');
    setSourceError('');
    setSections([]);
    setSelectedSections(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSection = (i) => {
    setSelectedSections((prev) => {
      const next = new Set(prev || sections.map((_, j) => j));
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const selectedCount = selectedSections ? selectedSections.size : sections.length;

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
          上传资料 + 说明目的，AI 帮你生成一张贴合你需求的多形态知识地图。
        </p>

        <form onSubmit={handleSubmit}>
          {/* 学科 / 资料标题（上传后自动填文件名，可改） */}
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="学科 / 资料标题（上传文件后自动填文件名）"
            disabled={loading}
            style={inputStyle}
          />

          {/* 学习目的（驱动 AI 围绕你的目标组织框架） */}
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="学习目的（可选）：你想从这份资料里得到什么？例如：帮我梳理期末考点 / 只弄懂第一章的定义和证明 / 了解发展脉络"
            disabled={loading}
            style={{ ...inputStyle, minHeight: 64, padding: '12px 18px', resize: 'vertical', fontFamily: 'inherit' }}
          />

          {/* 图谱形态建议（纯规则） */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>
              图谱形态（AI 根据你的目的推荐，可改）
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {recommended.map((key, idx) => {
                const f = FORM_TYPES[key];
                const isSel = formType === key;
                const isRec = idx === 0;
                return (
                  <div
                    key={key}
                    onClick={() => {
                      setFormType(key);
                      setFormTouched(true);
                    }}
                    style={{
                      flex: '1 1 150px',
                      minWidth: 150,
                      padding: 10,
                      borderRadius: 8,
                      border: `1px solid ${isSel ? COLORS.accent : COLORS.border}`,
                      background: isSel ? 'rgba(79,140,255,0.10)' : COLORS.panel,
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}
                      dangerouslySetInnerHTML={{ __html: formThumbSVG(key) }}
                    />
                    <div style={{ fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
                      {f.label}
                      {isRec && <span style={{ color: COLORS.accent }}> · 推荐</span>}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2, lineHeight: 1.4 }}>
                      {f.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
                    setSections([]);
                    setSelectedSections(null);
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
                    style={smallBtn}
                  >
                    {sourceLoading ? '解析中…' : '选择文件'}
                  </button>
                  {hasSource && (
                    <button type="button" onClick={clearSource} style={smallBtn}>
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
                  <div style={{ marginTop: 8, color: '#F87171', fontSize: 13 }}>{sourceError}</div>
                )}

                {/* 章节勾选 */}
                {sections.length > 1 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 }}>
                      勾选要纳入图谱的章节（已选 {selectedCount} / {sections.length}）
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                      {sections.map((sec, i) => (
                        <label
                          key={i}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSections ? selectedSections.has(i) : true}
                            onChange={() => toggleSection(i)}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sec.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {hasSource && (
                  <div style={{ marginTop: 8, color: COLORS.accent, fontSize: 12 }}>
                    ✓ 图谱将基于你勾选的资料生成，而非 AI 凭空编造；并会优先贴合你的学习目的。
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
                    style={{ ...smallBtn, background: COLORS.accent, color: '#fff', border: 'none' }}
                  >
                    打开
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`确定删除「${h.subject}」？其图谱、对话、笔记都会一并删除。`)) {
                        onDeleteSubject(h.key);
                      }
                    }}
                    style={{ ...smallBtn, marginLeft: 8 }}
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

const inputStyle = {
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
};

const smallBtn = {
  padding: '8px 14px',
  fontSize: 13,
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  background: 'transparent',
  color: COLORS.textPrimary,
  cursor: 'pointer',
};
