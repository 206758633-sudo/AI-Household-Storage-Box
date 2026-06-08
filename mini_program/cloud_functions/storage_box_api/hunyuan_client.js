const https = require('https');

const DEFAULT_BASE_URL = 'https://api.hunyuan.cloud.tencent.com/v1';
const DEFAULT_MODEL = 'hunyuan-turbos-latest';
const DEFAULT_TIMEOUT_MS = 3000;

function getRequestTimeoutMs() {
  return Number(process.env.LLM_TIMEOUT_MS || process.env.HUNYUAN_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
}

function requestJson(options, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let responseText = '';
      response.on('data', (chunk) => { responseText += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Hunyuan status ${response.statusCode}`));
          return;
        }
        resolve(JSON.parse(responseText));
      });
    });

    request.setTimeout(getRequestTimeoutMs(), () => request.destroy(new Error('LLM timeout')));
    request.on('error', reject);
    request.write(JSON.stringify(body));
    request.end();
  });
}

function buildChatOptions(apiKey, baseUrl) {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/chat/completions`);
  return {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };
}

async function callHunyuanJson(messages) {
  const apiKey = process.env.LLM_API_KEY || process.env.HUNYUAN_API_KEY;
  if (!apiKey) {
    throw new Error('Missing LLM_API_KEY');
  }

  const baseUrl = process.env.LLM_BASE_URL || process.env.HUNYUAN_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.LLM_MODEL || process.env.HUNYUAN_MODEL || DEFAULT_MODEL;
  const response = await requestJson(buildChatOptions(apiKey, baseUrl), {
    model,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.2
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = {
  callHunyuanJson
};
