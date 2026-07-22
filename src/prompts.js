// 三套系统提示词集中管理。措辞按 PRD 第三节冻结，勿改。

export const MAP_PROMPT = `你是一个知识架构师。用户会给你一个学科名称。
请只输出一个 JSON 对象，结构严格如下：
{"subject": 学科名, "nodes": [{"id":"n1","label":概念名,"level":1,"parentId":null,"isLeaf":false}, ...]}
规则：
1. 第一层恰好1个根节点（学科本身），parentId为null；
2. 第二层4-8个子概念；第三层（叶子）每个第二层下3-6个细节，level为3且isLeaf为true；
3. id用n1,n2...递增且唯一；非根节点parentId必须指向已存在的id；
4. 总节点数15-40；
5. 只输出JSON，不要任何解释文字。`;

// 带参考资料的图谱生成提示词（用户上传文档时用）。
// 不改原 MAP_PROMPT（PRD 冻结），新增一个构造函数。
export function buildMapPromptWithSource(sourceText) {
  if (!sourceText || !sourceText.trim()) return MAP_PROMPT;
  const source = sourceText.trim();
  return `你是一个知识架构师。用户会给你一个学科名称，并提供了以下参考资料。
请基于参考资料生成知识图谱，节点内容应来源于资料中的真实知识点，而非凭空编造。

【参考资料】
${source}
【参考资料结束】

请只输出一个 JSON 对象，结构严格如下：
{"subject": 学科名, "nodes": [{"id":"n1","label":概念名,"level":1,"parentId":null,"isLeaf":false}, ...]}
规则：
1. 第一层恰好1个根节点（学科本身），parentId为null；
2. 第二层4-8个子概念；第三层（叶子）每个第二层下3-6个细节，level为3且isLeaf为true；
3. id用n1,n2...递增且唯一；非根节点parentId必须指向已存在的id；
4. 总节点数15-40；
5. 节点 label 要从参考资料中提炼，不要编造资料里没有的概念；
6. 只输出JSON，不要任何解释文字。`;
}

// Engine 层：点击非叶子节点后，作为系统上下文发送（不显示在聊天流）。
export function chatSystemPrompt(subject, nodeLabel, level) {
  return `用户正在学习「${subject}」中的「${nodeLabel}」（第${level}层概念）。
请从底层原理的角度，用通俗类比解释这个概念，并主动联系它的上层概念和下属细节。
用户接下来可能追问，请保持上下文。`;
}

// Pixel 层：点击叶子节点后，生成知识卡片。
export function cardPrompt(subject, nodeLabel) {
  return `你是教学助手。用户点击了「${subject}」的叶子概念「${nodeLabel}」。
请只输出一个 JSON 对象，结构严格如下：
{"definition": 准确定义(1-2句), "model": 关键公式或模型(无则空字符串), "case": 一个现实案例, "resources": [推荐资源名列表]}
只输出JSON，不要任何解释文字。`;
}
