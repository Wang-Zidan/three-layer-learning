// 统一 AI 调用封装：OpenAI 兼容格式，所有请求都走这里。

import { loadSettings, DEFAULTS } from './storage.js';

const DEFAULT_TIMEOUT = 30000; // 30 秒（生成图谱可能较慢）

/**
 * 调用大模型。
 * @param {Array<{role:string, content:string}>} messages
 * @param {object} options
 * @param {boolean} options.jsonMode 是否强制 JSON 输出（加 response_format）
 * @param {number} options.timeout 超时毫秒
 * @param {AbortSignal} options.signal 可选的取消信号
 */
export async function callLLM(messages, options = {}) {
  const { jsonMode = false, timeout = DEFAULT_TIMEOUT, signal } = options;
  const settings = loadSettings();

  if (!settings.apiKey) {
    throw new Error('API Key 未配置，请先在右上角「设置」中填写。');
  }

  const baseURL = settings.apiBase || DEFAULTS.apiBase;
  const model = settings.apiModel || DEFAULTS.apiModel;

  const body = {
    model,
    messages,
    stream: false,
  };
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const usedSignal = signal || controller.signal;

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: usedSignal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      let detail = '';
      try {
        const err = await res.json();
        detail = err?.error?.message || JSON.stringify(err);
      } catch {
        detail = await res.text();
      }
      throw new Error(`API 请求失败 (${res.status}): ${detail || res.statusText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('API 返回内容为空或格式异常。');
    }
    return content;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`请求超时（>${timeout / 1000} 秒），请检查网络或稍后重试。`);
    }
    throw err;
  }
}
