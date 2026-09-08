import { json } from '@sveltejs/kit';
import { removePin } from '$lib/server/cluster';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { cid } = await request.json();
    if (!cid || typeof cid !== 'string') {
      return json({ error: 'cid is required' }, { status: 400 });
    }
    const result = await removePin(cid);
    return json({ ok: true, result });
  } catch (e) {
    return json({ error: String(e) }, { status: 500 });
  }
};