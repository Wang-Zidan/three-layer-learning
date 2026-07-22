// localStorage 封装：本项目的 settings（key / base / model）+ 多学科学业数据持久化。
// 字段名已冻结，前缀 tll_v1_*。

import { validateGraph } from '../utils/graphValidator.js';

const KEYS = {
  apiKey: 'tll_v1_apikey',
  apiBase: 'tll_v1_apibase',
  apiModel: 'tll_v1_apimodel',
};

// 多学科学业数据容器
const SUBJECTS_KEY = 'tll_v1_subjects'; // { [key]: subjectData }
const CURRENT_KEY = 'tll_v1_current'; // 当前学科 key
// 旧版（Phase 4 单学科平铺）key，用于一次性迁移后清理
const LEGACY_KEYS = [
  'tll_v1_graph',
  'tll_v1_progress',
  'tll_v1_chats',
  'tll_v1_cards',
  'tll_v1_notes',
  'tll_v1_collapsed',
  'tll_v1_selected',
];

export const DEFAULTS = {
  apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiModel: 'qwen-plus',
};

export function loadSettings() {
  return {
    apiKey: localStorage.getItem(KEYS.apiKey) || '',
    apiBase: localStorage.getItem(KEYS.apiBase) || DEFAULTS.apiBase,
    apiModel: localStorage.getItem(KEYS.apiModel) || DEFAULTS.apiModel,
  };
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.apiKey, settings.apiKey || '');
  localStorage.setItem(KEYS.apiBase, settings.apiBase || DEFAULTS.apiBase);
  localStorage.setItem(KEYS.apiModel, settings.apiModel || DEFAULTS.apiModel);
}

// ---------- 多学科学业数据持久化（Phase 4 升级：多学科历史） ----------

function safeGet(key) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? null : JSON.parse(v);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 配额超限或隐私模式：静默失败，不影响交互 */
  }
}

export function toSubjectKey(subject) {
  return 'sub_' + encodeURIComponent(subject);
}

export function makeSubject(subject) {
  const now = Date.now();
  return {
    subject,
    graph: null,
    progress: {},
    chats: {},
    cards: {},
    notes: {},
    collapsed: [],
    selectedId: null,
    createdAt: now,
    updatedAt: now,
  };
}

// 把 Phase 4 的旧平铺数据迁移为第一个学科，避免用户已有图谱丢失；迁移后清理旧 key。
function migrateLegacy() {
  const legacyGraph = safeGet('tll_v1_graph');
  if (!legacyGraph) return {};
  try {
    validateGraph(legacyGraph);
  } catch {
    LEGACY_KEYS.forEach((k) => safeSet(k, null));
    return {};
  }
  const subject = legacyGraph.subject || '未命名学科';
  const key = toSubjectKey(subject);
  const migrated = {
    ...makeSubject(subject),
    graph: legacyGraph,
    progress: safeGet('tll_v1_progress') || {},
    chats: safeGet('tll_v1_chats') || {},
    cards: safeGet('tll_v1_cards') || {},
    notes: safeGet('tll_v1_notes') || {},
    collapsed: safeGet('tll_v1_collapsed') || [],
    selectedId: safeGet('tll_v1_selected') || null,
  };
  LEGACY_KEYS.forEach((k) => safeSet(k, null));
  return { [key]: migrated };
}

export function loadAll() {
  const legacy = migrateLegacy();
  const raw = safeGet(SUBJECTS_KEY) || {};
  const subjects = { ...legacy };
  for (const [key, s] of Object.entries(raw)) {
    if (s && s.graph) {
      try {
        validateGraph(s.graph);
        subjects[key] = s;
      } catch {
        // 损坏的旧数据丢弃
      }
    }
  }
  const current = safeGet(CURRENT_KEY) || null;
  return { subjects, current: current && subjects[current] ? current : null };
}

export function persistSubjects(subjects) {
  safeSet(SUBJECTS_KEY, subjects);
}

export function persistCurrent(current) {
  safeSet(CURRENT_KEY, current);
}
