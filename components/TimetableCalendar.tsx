// components/TimetableCalendar.tsx
import { useState, useEffect, useRef } from "react";

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
  source: "calendar1" | "calendar2";
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
  { name: "5限", startHour: 16, startMinute: 20, endHour: 17, endMinute: 50 },
  { name: "6限", startHour: 18, startMinute: 0, endHour: 19, endMinute: 30 },
];

const CALENDAR_STYLES = {
  calendar2: {
    icon: "5️⃣",
    borderColor: "border-green-200",
    bgColor: "bg-green-50",
    textColor: "text-green-900",
    hoverShadow: "hover:shadow-green-100",
    label: "5Fラウンジ",
  },
  calendar1: {
    icon: "6️⃣",
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50",
    textColor: "text-blue-900",
    hoverShadow: "hover:shadow-blue-100",
    label: "6Fラウンジ",
  },
};

export const TimetableCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const tableRef = useRef<HTMLDivElement>(null);
  const todayRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  useEffect(() => {
    if (!loading && tableRef.current && todayRowRef.current) {
      const today = new Date();
      if (
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear()
      ) {
        const tableTop = tableRef.current.getBoundingClientRect().top;
        const rowTop = todayRowRef.current.getBoundingClientRect().top;
        const scrollTop = rowTop - tableTop - 100;

        tableRef.current.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        });
      }
    }
  }, [loading, currentDate]);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/public-calendar");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "カレンダーの取得に失敗しました");
      }
      setEvents(data.value || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知のエラー");
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

  const getEventsForTimeSlot = (
    date: Date,
    timeSlot: TimeSlot,
  ): CalendarEvent[] => {
    return events.filter((event) => {
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

  if (loading) return <div className="text-center py-8">読み込み中...</div>;
  if (error)
    return <div className="text-red-500 text-center py-8">エラー: {error}</div>;

  const days = getDaysInMonth();

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <a
            href="https://forms.office.com/r/nfDyZ9s8Yc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            ✏️ 予約する
          </a>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-md">
              <span className="text-green-800">
                {CALENDAR_STYLES.calendar2.icon}
              </span>
              <span className="text-sm font-medium">
                {CALENDAR_STYLES.calendar2.label}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-md">
              <span className="text-blue-800">
                {CALENDAR_STYLES.calendar1.icon}
              </span>
              <span className="text-sm font-medium">
                {CALENDAR_STYLES.calendar1.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <div className="space-x-2">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.setMonth(currentDate.getMonth() - 1)),
              )
            }
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
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.setMonth(currentDate.getMonth() + 1)),
              )
            }
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            翌月
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <div
          ref={tableRef}
          className="max-h-[600px] overflow-auto scroll-smooth"
        >
          <table className="w-full border-collapse relative">
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 bg-gray-100 border-b border-r border-gray-200 p-4 text-gray-700 font-semibold text-left min-w-[120px]">
                  日付
                </th>
                {TIME_SLOTS.map((slot) => (
                  <th
                    key={slot.name}
                    className="bg-gray-100 border-b border-r border-gray-200 p-4 text-gray-700 font-semibold text-center min-w-[180px] last:border-r-0"
                  >
                    {slot.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, rowIndex) => {
                const isToday =
                  day.getDate() === new Date().getDate() &&
                  day.getMonth() === new Date().getMonth() &&
                  day.getFullYear() === new Date().getFullYear();
                return (
                  <tr
                    key={day.getTime()}
                    ref={isToday ? todayRowRef : null}
                    className={`
                      ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      ${isToday ? "relative" : ""}
                    `}
                  >
                    <td
                      className={`
                      sticky left-0 z-10 border-b border-r border-gray-200 p-4 font-medium
                      ${
                        day.getDay() === 0
                          ? "bg-red-50 text-red-800"
                          : day.getDay() === 6
                            ? "bg-blue-50 text-blue-800"
                            : rowIndex % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50"
                      }
                      ${isToday ? "bg-yellow-50 font-bold" : ""}
                    `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {day.getDate()}
                          {isToday && (
                            <span className="ml-2 text-sm text-orange-600">
                              Today
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-gray-600">
                          (
                          {
                            ["日", "月", "火", "水", "木", "金", "土"][
                              day.getDay()
                            ]
                          }
                          )
                        </span>
                      </div>
                      {isToday && (
                        <div className="absolute left-0 w-full h-full bg-yellow-100 opacity-10 pointer-events-none" />
                      )}
                    </td>
                    {TIME_SLOTS.map((slot) => {
                      const slotEvents = getEventsForTimeSlot(day, slot);
                      return (
                        <td
                          key={`${day.getTime()}-${slot.name}`}
                          className={`border-b border-r border-gray-200 p-3 align-top last:border-r-0
                              ${isToday ? "bg-yellow-50/20" : ""}`}
                        >
                          <div className="min-h-[80px]">
                            {slotEvents.map((event) => {
                              const style = CALENDAR_STYLES[event.source];
                              return (
                                <div
                                  key={event.id}
                                  className={`mb-2 last:mb-0 rounded-lg p-2.5 
                                    ${style.bgColor} ${style.borderColor} shadow-sm hover:shadow-md 
                                    transition-all duration-200`}
                                >
                                  <div
                                    className={`font-medium flex items-center gap-1.5 mb-1 ${style.textColor}`}
                                  >
                                    <span>{style.icon}</span>
                                    <span>{event.subject}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimetableCalendar;
