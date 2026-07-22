// 全局冻结常量：颜色、状态、层级半径。实现时勿改。

export const COLORS = {
  bg: '#0F1115',
  panel: '#171A21',
  border: '#2A2F3A',
  textPrimary: '#E6EAF0',
  textSecondary: '#9AA4B2',
  accent: '#4F8CFF',
  link: '#2A2F3A',
};

// 节点掌握状态：颜色覆盖在节点上，与层级大小无关
export const STATUS = {
  unlearned: { key: 'unlearned', label: '未学', color: '#5A6472' },
  learning: { key: 'learning', label: '学习中', color: '#4F8CFF' },
  mastered: { key: 'mastered', label: '已掌握', color: '#34D399' },
};

// 节点半径按层级区分（px，世界坐标）
export const LEVEL_RADIUS = { 1: 18, 2: 12, 3: 7 };
