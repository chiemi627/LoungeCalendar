// pages/api/public-calendar.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import ical from 'node-ical';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 2つのカレンダーのURL
    const calendar1Url = process.env.PUBLIC_CALENDAR_URL_1;
    const calendar2Url = process.env.PUBLIC_CALENDAR_URL_2;

    if (!calendar1Url || !calendar2Url) {
      return res.status(400).json({ error: "カレンダーURLが設定されていません" });
    }

    // 両方のカレンダーを並行して取得
    const [events1, events2] = await Promise.all([
      ical.async.fromURL(calendar1Url),
      ical.async.fromURL(calendar2Url)
    ]);

    // イベントを整形して、どのカレンダーかを示すsourceプロパティを追加
    const formatEvents = (events: any, source: string) => {
      return Object.values(events)
        .filter(event => event.type === 'VEVENT')
        .map(event => ({
          id: event.uid,
          subject: event.summary,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: 'Asia/Tokyo'
          },
          end: {
            dateTime: event.end.toISOString(),
            timeZone: 'Asia/Tokyo'
          },
          location: event.location ? {
            displayName: event.location
          } : undefined,
          description: event.description,
          source: source // カレンダーの識別子を追加
        }));
    };

    const combinedEvents = [
      ...formatEvents(events1, 'calendar1'),
      ...formatEvents(events2, 'calendar2')
    ];

    res.status(200).json({ value: combinedEvents });

  } catch (error) {
    console.error('Calendar fetch error:', error);
    res.status(500).json({ 
      error: "カレンダーの取得に失敗しました",
      details: error instanceof Error ? error.message : '未知のエラー'
    });
  }
}