import React from 'react';
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
}) {
  if (!selected) {
    return (
      <div style={{ padding: 24, color: COLORS.textSecondary, lineHeight: 1.8 }}>
        点击左侧任意节点查看详情。<br />
        非叶子节点 → 打开 AI 对话（引擎层）。<br />
        叶子节点 → 打开知识卡片（像素层）。
      </div>
    );
  }
  return isLeaf ? (
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
  );
}
