import { json } from '@sveltejs/kit';
import { addPin } from '$lib/server/cluster';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { cid, name, replication_min, replication_max } = await request.json();
    if (!cid || typeof cid !== 'string') {
      return json({ error: 'cid is required' }, { status: 400 });
    }
    const result = await addPin(cid, replication_min, replication_max, name);
    return json({ ok: true, result });
  } catch (e) {
    return json({ error: String(e) }, { status: 500 });
  }
};