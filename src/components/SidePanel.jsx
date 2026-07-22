import React, { useState } from 'react';
import CardPanel from './CardPanel.jsx';
import ChatPanel from './ChatPanel.jsx';
import { COLORS } from '../constants.js';

export default function SidePanel({
  selected,
  isLeaf,
  subject,
  subjectKey,
  progress,
  setStatus,
  collapsed,
  onToggleCollapse,
  chats,
  onMessagesChange,
  cards,
  onCardLoaded,
  notes,
  onNoteChange,
  onRenameNode,
  onDeleteNode,
  onAddChild,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!selected) {
    return (
      <div style={{ padding: 24, color: COLORS.textSecondary, lineHeight: 1.8 }}>
        点击左侧任意节点查看详情。<br />
        非叶子节点 → 打开 AI 对话（引擎层）。<br />
        叶子节点 → 打开知识卡片（像素层）。
      </div>
    );
  }

  const startRename = () => {
    setDraft(selected.label);
    setEditing(true);
  };
  const commitRename = () => {
    if (draft.trim()) onRenameNode(selected.id, draft.trim());
    setEditing(false);
  };
  const handleAddChild = () => {
    const label = window.prompt('输入新节点的名称：');
    if (label && label.trim()) onAddChild(selected.id, label.trim());
  };
  const handleDelete = () => {
    if (window.confirm(`确定删除「${selected.label}」及其所有下级节点？`)) {
      onDeleteNode(selected.id);
    }
  };

  const editBar = (
    <div style={{ padding: '16px 16px 0', borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{selected.label}</div>
      {editing ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commitRename()}
            autoFocus
            style={editInputStyle}
          />
          <button onClick={commitRename} style={editBtn}>
            保存
          </button>
          <button onClick={() => setEditing(false)} style={editBtn}>
            取消
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button onClick={startRename} style={editBtn}>
            ✏️ 重命名
          </button>
          <button onClick={handleAddChild} style={editBtn}>
            ＋ 添加子节点
          </button>
          <button onClick={handleDelete} style={{ ...editBtn, color: '#F87171', borderColor: '#F87171' }}>
            🗑 删除
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {editBar}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {isLeaf ? (
          <CardPanel
            node={selected}
            subject={subject}
            subjectKey={subjectKey}
            progress={progress}
            setStatus={setStatus}
            card={cards[selected.id]}
            onCardLoaded={onCardLoaded}
            note={notes[selected.id]}
            onNoteChange={onNoteChange}
          />
        ) : (
          <ChatPanel
            node={selected}
            subject={subject}
            progress={progress}
            setStatus={setStatus}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            messages={chats[selected.id]}
            onMessagesChange={onMessagesChange}
          />
        )}
      </div>
    </div>
  );
}

const editInputStyle = {
  flex: 1,
  minWidth: 0,
  padding: '6px 10px',
  fontSize: 13,
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.bg,
  color: COLORS.textPrimary,
  outline: 'none',
  boxSizing: 'border-box',
};

const editBtn = {
  padding: '6px 10px',
  fontSize: 13,
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  background: 'transparent',
  color: COLORS.textPrimary,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
