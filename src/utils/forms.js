// 多形态图谱的元数据与纯规则建议逻辑（MVP 仅 3 种：辐射 / 层级 / 时间轴）。

export const FORM_TYPES = {
  radial: {
    key: 'radial',
    label: '辐射 / 心智图',
    desc: '中心主题向外发散，适合概念拆解、核心词延伸',
    keywords: [],
  },
  hierarchy: {
    key: 'hierarchy',
    label: '层级 / 树状',
    desc: '父→子分类，适合知识体系、大纲、分类',
    keywords: ['分类', '体系', '大纲', '结构', '框架', '目录', 'category', 'taxonomy'],
  },
  timeline: {
    key: 'timeline',
    label: '时间轴 / 时序',
    desc: '按时间先后排布，适合发展脉络、历史事件',
    keywords: ['脉络', '发展', '历史', '演进', '时间', '年代', 'timeline', 'history', '演变', '历程'],
  },
};

export const FORM_ORDER = ['radial', 'hierarchy', 'timeline'];

// 纯规则：根据学习目的关键词推荐形态，返回有序候选（首选在前）。
// 不调用模型——更可控、零额外 token。
export function recommendForms(goal = '') {
  const g = (goal || '').toLowerCase();
  const scored = FORM_ORDER.map((key) => ({
    key,
    score: FORM_TYPES[key].keywords.some((k) => g.includes(k.toLowerCase())) ? 1 : 0,
  }));
  scored.sort((a, b) => b.score - a.score);
  return [scored[0].key, ...FORM_ORDER.filter((k) => k !== scored[0].key)];
}

// 形态缩略图（内联 SVG 字符串），用于 LandingPage 的建议卡片。
export function formThumbSVG(key) {
  const stroke = '#9AA4B2';
  const accent = '#4F8CFF';
  if (key === 'hierarchy') {
    return `<svg viewBox="0 0 64 40" width="64" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="4" width="16" height="9" rx="2" fill="${accent}"/>
      <line x1="32" y1="13" x2="14" y2="24" stroke="${stroke}"/>
      <line x1="32" y1="13" x2="32" y2="24" stroke="${stroke}"/>
      <line x1="32" y1="13" x2="50" y2="24" stroke="${stroke}"/>
      <rect x="6" y="25" width="14" height="9" rx="2" fill="none" stroke="${stroke}"/>
      <rect x="25" y="25" width="14" height="9" rx="2" fill="none" stroke="${stroke}"/>
      <rect x="44" y="25" width="14" height="9" rx="2" fill="none" stroke="${stroke}"/>
    </svg>`;
  }
  if (key === 'timeline') {
    return `<svg viewBox="0 0 64 40" width="64" height="40" xmlns="http://www.w3.org/2000/svg">
      <line x1="6" y1="20" x2="58" y2="20" stroke="${stroke}"/>
      <polygon points="58,16 58,24 64,20" fill="${stroke}"/>
      <circle cx="14" cy="20" r="4" fill="${accent}"/>
      <circle cx="32" cy="20" r="4" fill="${accent}"/>
      <circle cx="50" cy="20" r="4" fill="${accent}"/>
    </svg>`;
  }
  // radial（默认）
  return `<svg viewBox="0 0 64 40" width="64" height="40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="20" r="6" fill="${accent}"/>
    <line x1="32" y1="20" x2="10" y2="8" stroke="${stroke}"/>
    <line x1="32" y1="20" x2="54" y2="8" stroke="${stroke}"/>
    <line x1="32" y1="20" x2="10" y2="32" stroke="${stroke}"/>
    <line x1="32" y1="20" x2="54" y2="32" stroke="${stroke}"/>
    <circle cx="10" cy="8" r="3.5" fill="none" stroke="${stroke}"/>
    <circle cx="54" cy="8" r="3.5" fill="none" stroke="${stroke}"/>
    <circle cx="10" cy="32" r="3.5" fill="none" stroke="${stroke}"/>
    <circle cx="54" cy="32" r="3.5" fill="none" stroke="${stroke}"/>
  </svg>`;
}
