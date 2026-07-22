import React, { useState, useEffect } from 'react';
import { STATUS, COLORS } from '../constants.js';
import { callLLM } from '../services/llm.js';
import { cardPrompt } from '../prompts.js';

function validateCard(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('卡片数据不是对象。');
  const { definition, model, case: caseText, resources } = raw;
  if (typeof definition !== 'string' || !definition.trim())
    throw new Error('definition 必须是非空字符串。');
  if (typeof model !== 'string') throw new Error('model 必须是字符串（无则空串）。');
  if (typeof caseText !== 'string') throw new Error('case 必须是字符串。');
  if (!Array.isArray(resources)) throw new Error('resources 必须是数组。');
  return true;
}

function Field({ title, text }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: COLORS.textPrimary, whiteSpace: 'pre-wrap' }}>
        {text || '—'}
      </div>
    </div>
  );
}

export default function CardPanel({
  node,
  subject,
  subjectKey,
  progress,
  setStatus,
  card,
  onCardLoaded,
  note,
  onNoteChange,
}) {
  const st = progress[node.id] || 'unlearned';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await callLLM(
        [{ role: 'system', content: cardPrompt(subject, node.label) }],
        { jsonMode: true, timeout: 60000 }
      );
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('AI 返回的卡片不是合法 JSON，请重试。');
      }
      validateCard(parsed);
      onCardLoaded(node.id, parsed);
    } catch (err) {
      setError(err.message || '生成卡片失败');
    } finally {
      setLoading(false);
    }
  };

  // 进入叶子节点且尚无缓存卡片时，自动生成。
  // 依赖里加 subjectKey：切到另一门学科（即便节点 id 相同）也要重新判断。
  useEffect(() => {
    if (!card && !loading) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, subjectKey]);

  const resources = card?.resources || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>像素层 · 叶子概念</div>
        <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>{node.label}</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {loading && (
          <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>正在生成知识卡片…</div>
        )}

        {error && !loading && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(248,113,113,0.12)',
              color: '#F87171',
              fontSize: 13,
              whiteSpace: 'pre-wrap',
            }}
          >
            {error}
            <button
              onClick={generate}
              style={{
                marginLeft: 10,
                background: 'transparent',
                color: '#F87171',
                border: '1px solid #F87171',
                borderRadius: 6,
                padding: '2px 10px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              重试
            </button>
          </div>
        )}

        {!loading && !error && card && (
          <>
            <Field title="定义" text={card.definition} />
            <Field title="关键公式 / 模型" text={card.model} />
            <Field title="经典案例" text={card.case} />
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>推荐资源</div>
              {resources.length === 0 ? (
                <div style={{ fontSize: 13, color: COLORS.textPrimary }}>—</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {resources.map((r, i) => (
                    <li key={i} style={{ fontSize: 13, lineHeight: 1.7, color: COLORS.textPrimary }}>
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 }}>我的笔记</div>
          <textarea
            value={note || ''}
            onChange={(e) => onNoteChange(node.id, e.target.value)}
            placeholder="在这里写笔记（已自动保存到本地浏览器）"
            style={{
              width: '100%',
              minHeight: 80,
              background: COLORS.bg,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: 8,
              resize: 'vertical',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: 12, display: 'flex', gap: 8 }}>
        {Object.values(STATUS).map((s) => (
          <button
            key={s.key}
            onClick={() => setStatus(node.id, s.key)}
            style={{
              flex: 1,
              background: st === s.key ? s.color : COLORS.panel,
              color: st === s.key ? COLORS.bg : COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '6px 0',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
