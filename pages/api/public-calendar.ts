// pages/api/public-calendar.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import ical from 'node-ical';
import { unstable_cache } from 'next/cache';

interface ICalEvent {
  type: string;
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}

type CalendarEvent = {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  description?: string;
  source: 'calendar1' | 'calendar2';
};

const formatEvents = (
  events: Record<string, any>,
  source: 'calendar1' | 'calendar2'
): CalendarEvent[] => {
  return Object.values(events)
    .filter((event): event is ICalEvent => event.type === 'VEVENT')
    .map(event => ({
      id: event.uid,
      subject: event.summary,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      location: event.location ? { displayName: event.location } : undefined,
      description: event.description,
      source,
    }));
};

// モジュールレベルでキャッシュ関数を定義（Vercel Data Cache対応）
const getCachedCalendarEvents = unstable_cache(
  async () => {
    const calendar1Url = process.env.PUBLIC_CALENDAR_URL_1;
    const calendar2Url = process.env.PUBLIC_CALENDAR_URL_2;

    if (!calendar1Url || !calendar2Url) {
      throw new Error('カレンダーURLが設定されていません');
    }

    const [res1, res2] = await Promise.all([
      fetch(calendar1Url),
      fetch(calendar2Url),
    ]);

    if (!res1.ok) throw new Error(`calendar1取得失敗: ${res1.status}`);
    if (!res2.ok) throw new Error(`calendar2取得失敗: ${res2.status}`);

    const [text1, text2] = await Promise.all([res1.text(), res2.text()]);

    const events1 = ical.parseICS(text1);
    const events2 = ical.parseICS(text2);

    return [
      ...formatEvents(events1, 'calendar1'),
      ...formatEvents(events2, 'calendar2'),
    ];
  },
  ['calendar-events'],
  { revalidate: 300, tags: ['calendar'] }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const calendar1Url = process.env.PUBLIC_CALENDAR_URL_1;
    const calendar2Url = process.env.PUBLIC_CALENDAR_URL_2;

    if (!calendar1Url || !calendar2Url) {
      return res.status(400).json({ error: 'カレンダーURLが設定されていません' });
    }

    const combinedEvents = await getCachedCalendarEvents();

    res.status(200).json({
      value: combinedEvents,
      cachedAt: Date.now(),
    });
  } catch (error) {
    console.error('Calendar fetch error:', error);
    res.status(500).json({
      error: 'カレンダーの取得に失敗しました',
      details: error instanceof Error ? error.message : '未知のエラー',
    });
  }
}
