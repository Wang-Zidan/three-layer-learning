import React, { useState, useRef, useEffect } from 'react';
import { STATUS, COLORS } from '../constants.js';
import { callLLM } from '../services/llm.js';
import { chatSystemPrompt } from '../prompts.js';

function StatusBar({ node, st, setStatus }) {
  return (
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
  );
}

export default function ChatPanel({
  node,
  subject,
  progress,
  setStatus,
  collapsed,
  onToggleCollapse,
  messages,
  onMessagesChange,
}) {
  const st = progress[node.id] || 'unlearned';
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef();

  // 新消息进来时滚到底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || loading) return;
    setError('');

    const visibleHistory = messages || [];
    const nextVisible = [...visibleHistory, { role: 'user', content }];
    onMessagesChange(node.id, nextVisible);
    setInput('');
    setLoading(true);

    try {
      // 完整上下文 = 系统上下文 + 可见历史（含刚发的这条）
      const fullMessages = [
        { role: 'system', content: chatSystemPrompt(subject, node.label, node.level) },
        ...nextVisible,
      ];
      const reply = await callLLM(fullMessages, { jsonMode: false, timeout: 60000 });
      onMessagesChange(node.id, [...nextVisible, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.message || '对话请求失败');
      // 回滚：把刚发的用户消息保留，让用户可重试
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const quickAsks = ['这个的底层逻辑是什么？', '举一个现实案例', '如果没有它会怎样？'];

  const visible = messages || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>引擎层 · 第 {node.level} 层</div>
        <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>{node.label}</div>
        <button
          onClick={() => onToggleCollapse(node.id)}
          style={{
            marginTop: 8,
            background: COLORS.panel,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {collapsed.includes(node.id) ? '展开子树 ▸' : '收起子树 ▾'}
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {visible.length === 0 && !loading && (
          <div style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.7 }}>
            向 AI 追问「{node.label}」的底层原理。试试下面的快捷提问，或直接在下方输入。
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickAsks.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  style={{
                    textAlign: 'left',
                    background: COLORS.bg,
                    color: COLORS.textPrimary,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {visible.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                background: m.role === 'user' ? COLORS.accent : COLORS.bg,
                color: m.role === 'user' ? '#fff' : COLORS.textPrimary,
                border: m.role === 'user' ? 'none' : `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ color: COLORS.textSecondary, fontSize: 13, padding: '4px 2px' }}>
            对方正在输入…
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 8,
              padding: 10,
              borderRadius: 8,
              background: 'rgba(248,113,113,0.12)',
              color: '#F87171',
              fontSize: 12,
              whiteSpace: 'pre-wrap',
            }}
          >
            {error}
            <button
              onClick={() => {
                // 重试：取最后一条用户消息重新发送
                const lastUser = [...visible].reverse().find((m) => m.role === 'user');
                if (lastUser) {
                  // 先移除可能残留，直接用现有历史重发一次
                  setError('');
                  setLoading(true);
                  (async () => {
                    try {
                      const fullMessages = [
                        { role: 'system', content: chatSystemPrompt(subject, node.label, node.level) },
                        ...visible,
                      ];
                      const reply = await callLLM(fullMessages, { jsonMode: false, timeout: 60000 });
                      onMessagesChange(node.id, [...visible, { role: 'assistant', content: reply }]);
                    } catch (err2) {
                      setError(err2.message || '对话请求失败');
                    } finally {
                      setLoading(false);
                    }
                  })();
                }
              }}
              style={{
                marginLeft: 10,
                background: 'transparent',
                color: '#F87171',
                border: '1px solid #F87171',
                borderRadius: 6,
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              重试
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ borderTop: `1px solid ${COLORS.border}`, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的问题…"
            disabled={loading}
            style={{
              flex: 1,
              background: COLORS.bg,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? '#3A4250' : COLORS.accent,
              color: loading || !input.trim() ? COLORS.textSecondary : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: 13,
            }}
          >
            发送
          </button>
        </div>
      </form>

      <StatusBar node={node} st={st} setStatus={setStatus} />
    </div>
  );
}
