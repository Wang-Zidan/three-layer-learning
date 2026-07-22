// Phase 0 演示数据：一份符合 PRD 契约的"现代管理学"三层图谱。
// 结构冻结：nodes 含 id / label / level(1-3) / parentId / isLeaf。
// 前端会根据 parentId 自动生成连线（links），模型也只返回 nodes。

export const mockGraph = {
  subject: '现代管理学',
  nodes: [
    { id: 'n1', label: '现代管理学', level: 1, parentId: null, isLeaf: false },

    { id: 'n2', label: '科学管理', level: 2, parentId: 'n1', isLeaf: false },
    { id: 'n3', label: '人际关系学派', level: 2, parentId: 'n1', isLeaf: false },
    { id: 'n4', label: '系统管理理论', level: 2, parentId: 'n1', isLeaf: false },
    { id: 'n5', label: '战略管理', level: 2, parentId: 'n1', isLeaf: false },

    { id: 'n6', label: '泰勒制', level: 3, parentId: 'n2', isLeaf: true },
    { id: 'n7', label: '动作研究', level: 3, parentId: 'n2', isLeaf: true },
    { id: 'n8', label: '甘特图', level: 3, parentId: 'n2', isLeaf: true },

    { id: 'n9', label: '霍桑实验', level: 3, parentId: 'n3', isLeaf: true },
    { id: 'n10', label: '需求层次', level: 3, parentId: 'n3', isLeaf: true },
    { id: 'n11', label: '权威接受论', level: 3, parentId: 'n3', isLeaf: true },

    { id: 'n12', label: '权变理论', level: 3, parentId: 'n4', isLeaf: true },
    { id: 'n13', label: '系统动力学', level: 3, parentId: 'n4', isLeaf: true },

    { id: 'n14', label: 'SWOT 分析', level: 3, parentId: 'n5', isLeaf: true },
    { id: 'n15', label: '波特五力', level: 3, parentId: 'n5', isLeaf: true },
    { id: 'n16', label: '蓝海战略', level: 3, parentId: 'n5', isLeaf: true },
  ],
};
