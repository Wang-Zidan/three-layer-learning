// 校验 AI 返回的知识图谱 JSON 是否符合 PRD 第三节冻结的契约。

export function validateGraph(raw) {
  const errors = [];

  if (!raw || typeof raw !== 'object') {
    throw new Error('图谱数据不是对象。');
  }

  const { subject, nodes } = raw;
  if (typeof subject !== 'string' || !subject.trim()) {
    errors.push('subject 必须是字符串且非空。');
  }

  if (!Array.isArray(nodes)) {
    throw new Error('nodes 必须是数组。');
  }

  const total = nodes.length;
  if (total < 15 || total > 40) {
    errors.push(`节点数 ${total} 不在 15-40 范围内。`);
  }

  const ids = new Set();
  const idToNode = {};
  let rootCount = 0;
  const levelCounts = { 1: 0, 2: 0, 3: 0 };
  const childrenOfL2 = {};

  nodes.forEach((n, idx) => {
    if (!n || typeof n !== 'object') {
      errors.push(`第 ${idx + 1} 个节点不是对象。`);
      return;
    }

    const { id, label, level, parentId, isLeaf } = n;

    if (typeof id !== 'string' || !id.startsWith('n')) {
      errors.push(`节点 ${idx + 1} 的 id 必须是 "n" 开头的字符串。`);
    }
    if (ids.has(id)) {
      errors.push(`id "${id}" 重复。`);
    } else {
      ids.add(id);
    }

    if (typeof label !== 'string' || !label.trim()) {
      errors.push(`节点 "${id}" 的 label 必须是非空字符串。`);
    }

    if (![1, 2, 3].includes(level)) {
      errors.push(`节点 "${id}" 的 level 必须是 1/2/3 之一。`);
    } else {
      levelCounts[level]++;
    }

    if (level === 1) {
      rootCount++;
      if (parentId !== null) {
        errors.push(`根节点 "${id}" 的 parentId 必须为 null。`);
      }
      if (isLeaf !== false) {
        errors.push(`根节点 "${id}" 的 isLeaf 必须为 false。`);
      }
    } else {
      if (typeof parentId !== 'string' || !parentId.trim()) {
        errors.push(`非根节点 "${id}" 的 parentId 必须是字符串。`);
      } else {
        idToNode[parentId] = idToNode[parentId] || { children: [] };
        idToNode[parentId].children.push(id);
      }
      if (level === 3) {
        if (isLeaf !== true) {
          errors.push(`第三层节点 "${id}" 的 isLeaf 必须为 true。`);
        }
        if (parentId) {
          childrenOfL2[parentId] = (childrenOfL2[parentId] || 0) + 1;
        }
      } else if (level === 2) {
        if (isLeaf !== false) {
          errors.push(`第二层节点 "${id}" 的 isLeaf 必须为 false。`);
        }
      }
    }
  });

  if (rootCount !== 1) {
    errors.push(`第一层根节点必须是恰好 1 个，当前 ${rootCount} 个。`);
  }

  const l2Count = levelCounts[2];
  if (l2Count < 4 || l2Count > 8) {
    errors.push(`第二层节点数 ${l2Count} 不在 4-8 范围内。`);
  }

  Object.entries(childrenOfL2).forEach(([pid, count]) => {
    if (count < 3 || count > 6) {
      errors.push(`第二层节点 "${pid}" 下的叶子数 ${count} 不在 3-6 范围内。`);
    }
  });

  // parentId 必须指向真实存在的 id
  nodes.forEach((n) => {
    if (n.parentId && !ids.has(n.parentId)) {
      errors.push(`节点 "${n.id}" 的 parentId "${n.parentId}" 不存在。`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`图谱校验失败：\n${errors.join('\n')}`);
  }

  return true;
}
