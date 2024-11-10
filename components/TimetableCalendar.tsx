import { useState, useEffect } from 'react';

interface CalendarEvent {
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
  source: 'calendar1' | 'calendar2';  // カレンダーの識別子
}

interface TimeSlot {
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

const TIME_SLOTS: TimeSlot[] = [
  { name: "1限", startHour: 8, startMinute: 50, endHour: 10, endMinute: 20 },
  { name: "2限", startHour: 10, startMinute: 30, endHour: 12, endMinute: 0 },
  { name: "昼休み", startHour: 12, startMinute: 0, endHour: 13, endMinute: 0 },
  { name: "3限", startHour: 13, startMinute: 0, endHour: 14, endMinute: 30 },
  { name: "4限", startHour: 14, startMinute: 40, endHour: 16, endMinute: 10 },
  { name: "5限", startHour: 16, startMinute: 20, endHour: 17, endMinute: 50 }
];

// カレンダーごとの表示スタイル設定
const CALENDAR_STYLES = {
  calendar1: {
    icon: '6️⃣',  // 教室1のアイコン
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    hoverShadow: 'hover:shadow-blue-100',
    label: '6Fラウンジ'
  },
  calendar2: {
    icon: '5️⃣',  // 教室2のアイコン
    borderColor: 'border-green-200',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    hoverShadow: 'hover:shadow-green-100',
    label: '5Fラウンジ'
  }
};

export const TimetableCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);
  
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/public-calendar');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'カレンダーの取得に失敗しました');
      }
      setEvents(data.value || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知のエラー');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

    // 特定の時限の全てのイベントを取得
    const getEventsForTimeSlot = (date: Date, timeSlot: TimeSlot): CalendarEvent[] => {
      return events.filter(event => {
        const eventDate = new Date(event.start.dateTime);
        const eventHour = eventDate.getHours();
        const eventMinute = eventDate.getMinutes();

        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear() &&
          eventHour === timeSlot.startHour &&
          eventMinute === timeSlot.startMinute
        );
      });
    };

    // イベントカードのレンダリング
    const renderEventCard = (event: CalendarEvent) => {
      const style = CALENDAR_STYLES[event.source];
      return (
        <div 
          key={event.id}
          className={`mb-1 ${style.bgColor} ${style.borderColor} border rounded-lg p-2 shadow-sm hover:shadow transition-shadow ${style.hoverShadow}`}
        >
          <div className={`font-medium ${style.textColor} flex items-center gap-1`}>
            <span>{style.icon}</span>
            <span>{event.subject}</span>
          </div>
          {event.location?.displayName && (
            <div className="text-sm text-gray-600">
              📍 {event.location.displayName}
            </div>
          )}
        </div>
      );
    };

    if (loading) return <div className="text-center py-8">読み込み中...</div>;
    if (error) return <div className="text-red-500 text-center py-8">エラー: {error}</div>;

    const days = getDaysInMonth();  // ここで days を定義

    return (
      <div className="p-6 bg-white rounded-xl shadow-lg">
        {/* タイトルと予約ボタン */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            {/* 予約ボタン */}
            <a
              href="https://forms.office.com/r/nfDyZ9s8Yc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              ✏️ 予約する
            </a>
            {/* 凡例 */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-md">
                <span className="text-green-800">5️⃣</span>
                <span className="text-sm font-medium">５Fラウンジ</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-md">
                <span className="text-blue-800">6️⃣</span>
                <span className="text-sm font-medium">６Fラウンジ</span>
              </div>
            </div>
          </div>
        </div>

        {/* 月切り替えボタン */}
        <div className="flex justify-end mb-6">
          <div className="space-x-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              前月
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 transition-colors"
            >
              今月
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              翌月
            </button>
          </div>
        </div>
        {/* テーブル部分 */}
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="sticky left-0 z-10 bg-gray-100 border-b border-r border-gray-200 p-4 text-gray-700 font-semibold text-left w-32">
                  日付
                </th>
                {TIME_SLOTS.map(slot => (
                  <th key={slot.name} className="border-b border-r border-gray-200 p-4 text-gray-700 font-semibold text-center min-w-[180px] last:border-r-0">
                    {slot.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, rowIndex) => (
                <tr key={day.getTime()} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`sticky left-0 z-10 border-b border-r border-gray-200 p-4 font-medium 
                    ${day.getDay() === 0 ? 'bg-red-50 text-red-800' : 
                      day.getDay() === 6 ? 'bg-blue-50 text-blue-800' : 
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{day.getDate()}</span>
                      <span className="text-sm text-gray-600">
                        ({['日', '月', '火', '水', '木', '金', '土'][day.getDay()]})
                      </span>
                    </div>
                  </td>
                  {TIME_SLOTS.map(slot => {
                    const slotEvents = getEventsForTimeSlot(day, slot);
                    return (
                      <td key={`${day.getTime()}-${slot.name}`} 
                          className="border-b border-r border-gray-200 p-3 align-top last:border-r-0">
                        <div className="min-h-[80px]">
                          {slotEvents.map(event => (
                            <div 
                              key={event.id}
                              className={`mb-2 last:mb-0 rounded-lg p-2.5 
                                ${event.source === 'calendar1' ? 
                                  'bg-blue-50 border border-blue-200 shadow-sm hover:shadow-md hover:bg-blue-100' : 
                                  'bg-green-50 border border-green-200 shadow-sm hover:shadow-md hover:bg-green-100'} 
                                transition-all duration-200`}
                            >
                              <div className={`font-medium flex items-center gap-1.5 mb-1
                                ${event.source === 'calendar1' ? 'text-blue-900' : 'text-green-900'}`}>
                                <span>{event.source === 'calendar1' ? '6️⃣' : '5️⃣'}</span>
                                <span>{event.subject}</span>
                              </div>
                              {event.location?.displayName && (
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                  <span className="text-xs">📍</span>
                                  {event.location.displayName}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  export default TimetableCalendar;