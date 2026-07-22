// 文件解析服务：统一入口，把用户上传的各种文件转成纯文本。
// 第一版支持 .txt / 粘贴文本；后续逐步加 PDF / Word / PPT。

// 读 txt 文件为纯文本。
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => reject(new Error('读取文本文件失败'));
    reader.readAsText(file);
  });
}

// 解析 PDF：用 pdfjs-dist 在浏览器端提取文字。
// 动态导入避免首屏加载全部解析库。
async function parsePDF(file) {
  const pdfjs = await import('pdfjs-dist');
  // Vite 原生支持 new URL + import.meta.url 方式加载 worker
  pdfjs.GlobalWorkerOptions.workerPort = new Worker(
    new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
    { type: 'module' }
  );

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n';
  }
  return text.trim();
}

// 解析 .docx：用 mammoth 转成 HTML 再提纯文本。
async function parseDocx(file) {
  const mammoth = await import('mammoth/mammoth.browser.js');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || '').trim();
}

// 解析 .pptx：用 JSZip 解压，从 slide XML 中提取文字。
async function parsePptx(file) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)[1], 10);
      const nb = parseInt(b.match(/slide(\d+)/)[1], 10);
      return na - nb;
    });
  let text = '';
  for (const name of slideFiles) {
    const xml = await zip.files[name].async('string');
    // 提取 <a:t> 标签里的文字
    const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
    const slideText = matches
      .map((m) => m.replace(/<[^>]+>/g, ''))
      .join(' ')
      .trim();
    if (slideText) text += slideText + '\n';
  }
  return text.trim();
}

// 把纯文本切成「章节」列表，供用户勾选范围。
// 启发式：短行 + 符合标题模式（#、第X章、Chapter、1. 等）即视为章节标题。
// 章节不足 1 个时返回 []（不展示勾选）。
function splitSections(text) {
  const lines = (text || '').split(/\r?\n/);
  const headingRe =
    /^(#{1,6}\s+|第[一二三四五六七八九十百0-9]+[章节目部分卷篇]\s*|chapter\s+\d+|^\d+(\.\d+)*[\.、\s])/i;
  const secs = [];
  let cur = null;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    const isHeading =
      headingRe.test(t) && t.length <= 50 && !/[。！？!?，,]/.test(t);
    if (isHeading) {
      if (cur) secs.push(cur);
      cur = { title: t.slice(0, 40), text: '' };
    } else {
      if (!cur) cur = { title: '全文', text: '' };
      cur.text += t + '\n';
    }
  }
  if (cur) secs.push(cur);
  return secs.length > 1 ? secs : [];
}

// 统一入口：根据文件类型分发到对应解析器。
// 返回 { text, fileName, wordCount, sections }。
export async function parseFile(file) {
  const name = (file.name || '').toLowerCase();
  let text = '';

  if (name.endsWith('.txt') || file.type === 'text/plain') {
    text = await readAsText(file);
  } else if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    text = await parsePDF(file);
  } else if (name.endsWith('.docx')) {
    text = await parseDocx(file);
  } else if (name.endsWith('.pptx')) {
    text = await parsePptx(file);
  } else {
    throw new Error('暂不支持此格式，请上传 .txt / .pdf / .docx / .pptx，或直接粘贴文本。');
  }

  text = (text || '').trim();
  if (!text) {
    throw new Error('文件中没读到文字。如果是扫描版 PDF 或图片，目前无法识别。');
  }
  // 截断过长文本（避免超出模型上下文限制，约 8000 字 ≈ 12000 token）
  const MAX_CHARS = 8000;
  let truncated = false;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
    truncated = true;
  }
  const sections = splitSections(text);
  return { text, fileName: file.name, wordCount: text.length, truncated, sections };
}
