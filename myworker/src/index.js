const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
	});
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: CORS_HEADERS });
		}

		// GET /themes — 讀取所有主題
		if (request.method === 'GET' && url.pathname === '/themes') {
			const data = await env.DB.get('themes');
			if (!data) {
				return json({ themes: [] });
			}
			return json(JSON.parse(data));
		}

		// POST /themes — 儲存所有主題
		if (request.method === 'POST' && url.pathname === '/themes') {
			const body = await request.json();
			await env.DB.put('themes', JSON.stringify({ themes: body.themes, updatedAt: Date.now() }));
			return json({ ok: true });
		}

		// --- 保留原有 API ---
		if (request.method === 'POST' && url.pathname === '/save') {
			const body = await request.json();
			const id = crypto.randomUUID();
			await env.DB.put(id, JSON.stringify({ ...body, createdAt: Date.now() }));
			return json({ ok: true, id });
		}

		if (request.method === 'GET' && url.pathname === '/list') {
			const { keys } = await env.DB.list({ limit: 100 });
			const results = [];
			for (const k of keys) {
				const v = await env.DB.get(k.name);
				if (v) results.push(JSON.parse(v));
			}
			return json(results);
		}

		return new Response('not found', { status: 404, headers: CORS_HEADERS });
	},
};
