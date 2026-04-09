// pages/api/refresh-calendar.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { invalidateCache } from '../../lib/calendarCache';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  invalidateCache();
  res.status(200).json({ success: true });
}
