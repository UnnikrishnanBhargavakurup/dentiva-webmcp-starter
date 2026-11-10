import {
  addDays,
  BOOKING_WINDOW_DAYS,
  formatDate,
  isBookableDate,
} from "@/lib/clinic";
import { Icon } from "./icons";

export function Calendar({
  today,
  selected,
  month,
  onMonth,
  onSelect,
}: {
  today: string;
  selected: string;
  month: string;
  onMonth: (month: string) => void;
  onSelect: (date: string) => void;
}) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const offset = (start.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cells = Array.from(
    { length: Math.ceil((offset + days) / 7) * 7 },
    (_, index) => {
      const day = index - offset + 1;
      return day >= 1 && day <= days
        ? `${month}-${String(day).padStart(2, "0")}`
        : null;
    },
  );
  function adjacentMonth(amount: number) {
    return new Date(Date.UTC(year, monthNumber - 1 + amount, 1))
      .toISOString()
      .slice(0, 7);
  }
  return (
    <div className="calendar">
      <div className="calendar-heading">
        <h3>
          {formatDate(`${month}-01`, {
            month: "long",
            year: "numeric",
            day: undefined,
          })}
        </h3>
        <div>
          <button
            type="button"
            className="calendar-arrow"
            aria-label="Previous month"
            disabled={adjacentMonth(-1) < today.slice(0, 7)}
            onClick={() => onMonth(adjacentMonth(-1))}
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            className="calendar-arrow"
            aria-label="Next month"
            disabled={
              adjacentMonth(1) > addDays(today, BOOKING_WINDOW_DAYS).slice(0, 7)
            }
            onClick={() => onMonth(adjacentMonth(1))}
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>
      <table aria-label="Appointment calendar">
        <thead>
          <tr>
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <th key={day} scope="col" abbr={day}>
                {day.slice(0, 2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <tr key={week}>
              {cells.slice(week * 7, week * 7 + 7).map((date, index) => (
                <td key={date ?? `empty-${index}`}>
                  {date ? (
                    <button
                      type="button"
                      aria-label={formatDate(date, { weekday: "long" })}
                      aria-pressed={date === selected}
                      aria-current={date === today ? "date" : undefined}
                      disabled={!isBookableDate(date, today)}
                      onClick={() => onSelect(date)}
                    >
                      {Number(date.slice(-2))}
                    </button>
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="calendar-caption">
        <span className="status-dot" /> Booking the next four weeks. Sundays
        off.
      </p>
    </div>
  );
}
