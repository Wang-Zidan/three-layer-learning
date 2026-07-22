import React, { useState, useMemo, useEffect } from 'react';
import GraphView from './components/GraphView.jsx';
import SidePanel from './components/SidePanel.jsx';
import LandingPage from './components/LandingPage.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { callLLM } from './services/llm.js';
import { validateGraph } from './utils/graphValidator.js';
import { MAP_PROMPT, buildMapPromptWithSource } from './prompts.js';
import { COLORS } from './constants.js';
import {
  loadAll,
  persistSubjects,
  persistCurrent,
  toSubjectKey,
  makeSubject,
  loadSettings,
  saveSettings,
} from './services/storage.js';

export default function App() {
  // 启动时从 localStorage 恢复（含 Phase 4 旧数据自动迁移为首个学科）。
  const all = loadAll();
  const [subjects, setSubjects] = useState(all.subjects || {});
  const [currentKey, setCurrentKey] = useState(all.current || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 响应式：窄屏（手机）< 768px 时使用全屏覆盖式面板
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 当前学科的扁平字段——全部从 subjects[currentKey] 派生，不单独存 state。
  const cur = currentKey ? subjects[currentKey] : null;
  const graph = cur?.graph || null;
  const progress = cur?.progress || {};
  const chats = cur?.chats || {};
  const cards = cur?.cards || {};
  const notes = cur?.notes || {};
  const collapsed = cur?.collapsed || [];
  const selectedId = cur?.selectedId || null;

  const selected = useMemo(
    () => (graph ? graph.nodes.find((n) => n.id === selectedId) || null : null),
    [graph, selectedId]
  );
  const isLeaf = selected?.isLeaf;

  // 修改当前学科字段（基于最新 prev，避免闭包拿到旧值）。
  const patchCur = (mutator) => {
    if (!currentKey) return;
    setSubjects((prev) => {
      const c = prev[currentKey];
      if (!c) return prev;
      const patch = mutator(c) || {};
      return { ...prev, [currentKey]: { ...c, ...patch, updatedAt: Date.now() } };
    });
  };

  // 任一学科数据变化即写回 localStorage；当前指针变化也写回。
  useEffect(() => {
    persistSubjects(subjects);
  }, [subjects]);
  useEffect(() => {
    persistCurrent(currentKey);
  }, [currentKey]);

  const generateGraph = async (subject) => {
    setLoading(true);
    setError('');
    const key = toSubjectKey(subject);
    try {
      const raw = await callLLM(
        [
          { role: 'system', content: MAP_PROMPT },
          { role: 'user', content: subject },
        ],
        { jsonMode: true, timeout: 60000 }
      );

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        throw new Error('AI 返回的内容不是合法 JSON，请重试。');
      }

      validateGraph(parsed);
      const created = makeSubject(subject);
      created.graph = parsed;
      setSubjects((prev) => ({ ...prev, [key]: created }));
      setCurrentKey(key);
    } catch (err) {
      setError(err.message || '生成图谱时发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (id, key) => patchCur((c) => ({ progress: { ...c.progress, [id]: key } }));

  const handleSelect = (id) => {
    if (!graph) return;
    const node = graph.nodes.find((n) => n.id === id);
    if (!node) return;
    patchCur((c) => {
      const p = { ...c.progress };
      if (!node.isLeaf && p[id] !== 'mastered') p[id] = 'learning';
      return { selectedId: id, progress: p };
    });
  };

  const toggleCollapse = (id) =>
    patchCur((c) => ({
      collapsed: c.collapsed.includes(id)
        ? c.collapsed.filter((x) => x !== id)
        : [...c.collapsed, id],
    }));

  const handleMessagesChange = (nodeId, messages) =>
    patchCur((c) => ({ chats: { ...c.chats, [nodeId]: messages } }));
  const handleCardLoaded = (nodeId, card) =>
    patchCur((c) => ({ cards: { ...c.cards, [nodeId]: card } }));
  const handleNoteChange = (nodeId, text) =>
    patchCur((c) => ({ notes: { ...c.notes, [nodeId]: text } }));

  // 返回首页：只取消当前选中，不清空任何学科数据。
  const backToHome = () => {
    setCurrentKey(null);
    setError('');
  };

  // 手机端：关闭全屏面板，回到图谱。
  const closePanel = () => patchCur((c) => ({ selectedId: null }));

  // 导出备份：把所有学科数据 + API 设置打包成 JSON 文件下载。
  const handleExport = () => {
    const data = {
      app: 'three-layer-learning',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: loadSettings(),
      subjects,
      current: currentKey,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `three-layer-learning-backup-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导入备份：读取 JSON 文件，校验后合并进现有学科，并恢复 API 设置。
  // 返回 true 表示导入成功（供设置弹窗自动关闭）。
  const handleImportFile = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || typeof data !== 'object' || !data.subjects) {
            alert('备份文件格式不正确（缺少 subjects 字段）。');
            resolve(false);
            return;
          }
          const imported = {};
          for (const [k, s] of Object.entries(data.subjects)) {
            if (s && s.graph) {
              try {
                validateGraph(s.graph);
                imported[k] = s;
              } catch {
                /* 跳过损坏的学科 */
              }
            }
          }
          if (Object.keys(imported).length === 0) {
            alert('备份中没有有效的学科数据。');
            resolve(false);
            return;
          }
          setSubjects((prev) => ({ ...prev, ...imported }));
          const newCurrent =
            data.current && imported[data.current]
              ? data.current
              : currentKey && imported[currentKey]
                ? currentKey
                : Object.keys(imported)[0];
          setCurrentKey(newCurrent);
          if (data.settings) saveSettings(data.settings);
          alert(`导入成功：共 ${Object.keys(imported).length} 门学科已合并。`);
          resolve(true);
        } catch {
          alert('导入失败：文件不是合法 JSON。');
          resolve(false);
        }
      };
      reader.onerror = () => {
        alert('读取文件失败。');
        resolve(false);
      };
      reader.readAsText(file);
    });

  // 打开历史里的某门学科。
  const openSubject = (key) => {
    if (subjects[key]) setCurrentKey(key);
  };

  // 删除一门学科。
  const deleteSubject = (key) => {
    setSubjects((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
    if (currentKey === key) setCurrentKey(null);
  };

  const history = Object.entries(subjects)
    .map(([key, s]) => ({ key, subject: s.subject, updatedAt: s.updatedAt || 0 }))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (!graph) {
    return (
      <>
        <LandingPage
          onGenerate={generateGraph}
          loading={loading}
          error={error}
          history={history}
          onOpenSubject={openSubject}
          onDeleteSubject={deleteSubject}
        />
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            padding: '8px 14px',
            borderRadius: 6,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.panel,
            color: COLORS.textSecondary,
            cursor: 'pointer',
            zIndex: 100,
          }}
        >
          ⚙ 设置
        </button>
        {settingsOpen && (
          <SettingsModal
            onClose={() => setSettingsOpen(false)}
            onExport={handleExport}
            onImportFile={handleImportFile}
          />
        )}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0 12px' : '0 20px',
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.panel,
        }}
      >
        <span style={{ fontWeight: 500, fontSize: isMobile ? 14 : 16, whiteSpace: 'nowrap' }}>
          三层学习法
        </span>
        <span
          style={{
            marginLeft: 12,
            fontSize: 12,
            color: COLORS.textSecondary,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {graph.subject}
        </span>
        <button
          onClick={backToHome}
          style={{
            padding: isMobile ? '5px 10px' : '6px 12px',
            fontSize: isMobile ? 12 : 14,
            borderRadius: 6,
            border: `1px solid ${COLORS.border}`,
            background: 'transparent',
            color: COLORS.textSecondary,
            cursor: 'pointer',
            marginRight: 12,
            whiteSpace: 'nowrap',
          }}
        >
          返回首页
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            padding: isMobile ? '5px 10px' : '6px 12px',
            fontSize: isMobile ? 12 : 14,
            borderRadius: 6,
            border: `1px solid ${COLORS.border}`,
            background: 'transparent',
            color: COLORS.textSecondary,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ⚙ 设置
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ width: isMobile ? '100%' : '70%', minWidth: 0 }}>
          <GraphView
            graph={graph}
            collapsed={collapsed}
            progress={progress}
            onSelect={handleSelect}
            onToggleCollapse={toggleCollapse}
          />
        </div>
        {!isMobile && (
          <div
            style={{
              width: '30%',
              borderLeft: `1px solid ${COLORS.border}`,
              background: COLORS.panel,
              minWidth: 0,
            }}
          >
            <SidePanel
              selected={selected}
              isLeaf={isLeaf}
              subject={graph.subject}
              subjectKey={currentKey}
              progress={progress}
              setStatus={setStatus}
              collapsed={collapsed}
              onToggleCollapse={toggleCollapse}
              chats={chats}
              onMessagesChange={handleMessagesChange}
              cards={cards}
              onCardLoaded={handleCardLoaded}
              notes={notes}
              onNoteChange={handleNoteChange}
            />
          </div>
        )}
      </div>

      {/* 手机端：选中节点后，面板以全屏覆盖形式出现，带“返回图谱” */}
      {isMobile && selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: COLORS.bg,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              height: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 12px',
              borderBottom: `1px solid ${COLORS.border}`,
              background: COLORS.panel,
            }}
          >
            <button
              onClick={closePanel}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                background: 'transparent',
                color: COLORS.textSecondary,
                cursor: 'pointer',
                fontSize: 14,
                whiteSpace: 'nowrap',
              }}
            >
              ← 返回图谱
            </button>
            <span
              style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selected.label}
            </span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <SidePanel
              selected={selected}
              isLeaf={isLeaf}
              subject={graph.subject}
              subjectKey={currentKey}
              progress={progress}
              setStatus={setStatus}
              collapsed={collapsed}
              onToggleCollapse={toggleCollapse}
              chats={chats}
              onMessagesChange={handleMessagesChange}
              cards={cards}
              onCardLoaded={handleCardLoaded}
              notes={notes}
              onNoteChange={handleNoteChange}
            />
          </div>
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onExport={handleExport}
          onImportFile={handleImportFile}
        />
      )}
    </div>
  );
}
