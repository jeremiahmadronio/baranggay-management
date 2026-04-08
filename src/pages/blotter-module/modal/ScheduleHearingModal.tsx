import { useEffect, useState } from "react";
import {
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  MapPinIcon,
} from "lucide-react";
import type {
  ScheduleHearingRequest,
  CalendarMarkerDTO,
  BusySlotDTO,
} from "../../../service/blotter-api/blotter-api";
import {
  scheduleHearing,
  getMarkers,
  getBusySlots,
} from "../../../service/blotter-api/blotter-api";
import { generatePaanyaya } from "../modal/GeneratePaanyaya";

// ── Constants ──
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WORKING_SESSIONS = [
  {
    label: "Morning Session",
    start: "07:00",
    end: "11:30",
    display: "7:00 AM – 11:30 AM",
  },
  {
    label: "Afternoon Session",
    start: "13:00",
    end: "17:00",
    display: "1:00 PM – 5:00 PM",
  },
];

const VENUE_OPTIONS = [
  "Barangay Hall – Session Room",
  "Barangay Hall – Mediation Room",
  "Barangay Hall – Conference Room",
  "Lupong Tagapamayapa Office",
  "Other (specify)",
];

// ── Barangay config — i-edit mo ito ──
const BARANGAY_CONFIG = {
  barangayName: "Barangay [Pangalan]",
  cityMunicipality: "[Lungsod/Munisipalidad]",
  province: "[Lalawigan]",
  punongBarangay: "[Punong Barangay]",
};

// ── Helpers ──
const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();
const getFirstDay = (year: number, month: number) =>
  new Date(year, month, 1).getDay();
const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;
const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const normalizeHHMM = (t: string) => {
  if (!t) return "";
  const core = t.trim().slice(0, 5);
  if (!/^\d{1,2}:\d{2}$/.test(core)) return "";
  const [h, m] = core.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const to12Hour = (t: string) => {
  const hhmm = normalizeHHMM(t);
  if (!hhmm) return t;
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

type TimeStatus =
  | "valid"
  | "outside"
  | "crosses_lunch"
  | "end_before_start"
  | null;

const getTimeStatus = (start: string, end: string): TimeStatus => {
  if (!start || !end) return null;
  const s = timeToMin(start);
  const e = timeToMin(end);
  if (e <= s) return "end_before_start";
  const inMorning = s >= timeToMin("07:00") && e <= timeToMin("11:30");
  const inAfternoon = s >= timeToMin("13:00") && e <= timeToMin("17:00");
  if (inMorning || inAfternoon) return "valid";
  const crossesLunch = s < timeToMin("11:30") && e > timeToMin("13:00");
  if (crossesLunch) return "crosses_lunch";
  return "outside";
};

const TIME_MESSAGES: Record<Exclude<TimeStatus, null | "valid">, string> = {
  end_before_start: "End time must be after start time.",
  crosses_lunch:
    "Schedule crosses the lunch break (11:30 AM – 1:00 PM). Please split into two sessions.",
  outside:
    "Selected time is outside office working hours (7:00 AM – 11:30 AM or 1:00 PM – 5:00 PM).",
};

// ── Props ──
interface Props {
  blotterNumber: string;
  hearingNumber: number;
  // ← Para sa paanyaya PDF
  caseNumber: string;
  natureOfComplaint: string;
  complainantName: string;
  respondentName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ScheduleHearingModal({
  blotterNumber,
  hearingNumber,
  caseNumber,
  natureOfComplaint,
  complainantName,
  respondentName,
  onSuccess,
  onCancel,
}: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState("");
  const [markers, setMarkers] = useState<CalendarMarkerDTO[]>([]);
  const [busySlots, setBusySlots] = useState<BusySlotDTO[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [venueOption, setVenueOption] = useState(VENUE_OPTIONS[0]);
  const [customVenue, setCustomVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCustomVenue = venueOption === "Other (specify)";
  const finalVenue = isCustomVenue ? customVenue.trim() : venueOption;

  useEffect(() => {
    getMarkers(viewYear, viewMonth + 1)
      .then(setMarkers)
      .catch(() => {});
  }, [viewYear, viewMonth]);

  useEffect(() => {
    setBusySlots([]);
    if (!selectedDate) return;
    getBusySlots(selectedDate)
      .then((slots) => {
        // Helper: convert 12-hour (AM/PM) to 24-hour format
        function to24Hour(timeStr: string) {
          if (!timeStr) return "";
          // If already 24-hour, return as is
          if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
          const [raw, ampm] = timeStr.split(/\s+/);
          let [h, m] = raw.split(":").map(Number);
          if (ampm && ampm.toUpperCase() === "PM" && h !== 12) h += 12;
          if (ampm && ampm.toUpperCase() === "AM" && h === 12) h = 0;
          return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        }
        const normalized = slots.map((slot) => ({
          ...slot,
          startTime: to24Hour(slot.startTime),
          endTime: to24Hour(slot.endTime),
        }));
        const now = new Date();
        const todayStr = toDateStr(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const filtered = normalized.filter((slot) => {
          if (selectedDate > todayStr) return true;
          if (selectedDate < todayStr) return false;
          const [h, m] = slot.endTime.split(":").map(Number);
          const slotEnd = new Date();
          slotEnd.setHours(h, m, 0, 0);
          return slotEnd > now;
        });
        setBusySlots(filtered);
      })
      .catch(() => {});
  }, [selectedDate]);

  const markerMap = markers.reduce<Record<string, number>>((acc, m) => {
    acc[m.date] = m.totalHearings;
    return acc;
  }, {});

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDay(viewYear, viewMonth);
  const todayStr = toDateStr(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const timeStatus = getTimeStatus(startTime, endTime);
  const startMin = timeToMin(startTime);
  const endMin = timeToMin(endTime);
  const conflictingSlots =
    timeStatus === "valid"
      ? busySlots.filter((slot) => {
          const slotStart = timeToMin(normalizeHHMM(slot.startTime));
          const slotEnd = timeToMin(normalizeHHMM(slot.endTime));
          return startMin < slotEnd && endMin > slotStart;
        })
      : [];
  const hasTimeConflict = conflictingSlots.length > 0;
  const isFormValid =
    !!selectedDate &&
    timeStatus === "valid" &&
    !hasTimeConflict &&
    !!finalVenue;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      if (timeStatus && timeStatus !== "valid") {
        setError(TIME_MESSAGES[timeStatus]);
      } else if (hasTimeConflict) {
        setError(
          "Selected time conflicts with an existing hearing schedule. Please choose another time.",
        );
      } else {
        setError("Please complete all required fields with valid values.");
      }
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body: ScheduleHearingRequest = {
        blotterNumber,
        scheduledStart: `${selectedDate}T${startTime}`,
        scheduledEnd: `${selectedDate}T${endTime}`,
        venue: finalVenue,
        notes: notes.trim() || undefined,
      };
      await scheduleHearing(body);

      generatePaanyaya({
        blotterNumber,
        caseNumber,
        natureOfComplaint,
        complainantName,
        respondentName,
        hearingNumber,
        date: selectedDate,
        startTime,
        endTime,
        venue: finalVenue,
        ...BARANGAY_CONFIG,
      });

      onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to schedule hearing.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = selectedDate
    ? new Date(selectedDate + "T00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Schedule Mediation #{hearingNumber}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Pick a date, set a time within office hours, then confirm. A
              summon letter (Paanyaya) will be generated automatically.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-y-auto">
          {/* ── Left: Calendar ── */}
          <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-sm font-bold text-gray-800">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold text-gray-400 py-1 uppercase tracking-wide"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const dateStr = toDateStr(viewYear, viewMonth, day);
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const hasMarker = (markerMap[dateStr] ?? 0) > 0;
                  const isPast = dateStr < todayStr;
                  return (
                    <button
                      key={day}
                      disabled={isPast}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`
                      relative mx-auto w-9 h-9 rounded-full text-xs font-semibold
                      flex items-center justify-center transition-all
                      ${isPast ? "text-gray-300 cursor-not-allowed" : "hover:bg-blue-50 cursor-pointer"}
                      ${isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-600" : ""}
                      ${isToday && !isSelected ? "ring-2 ring-blue-400 text-blue-600" : ""}
                      ${!isSelected && !isToday && !isPast ? "text-gray-700" : ""}
                    `}
                    >
                      {day}
                      {hasMarker && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-400" />
                      )}
                    </button>
                  );
                },
              )}
            </div>

            {/* ── Office Hours Reference ── */}
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <ClockIcon className="w-3 h-3" /> Office Working Hours
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WORKING_SESSIONS.map((s) => (
                  <div
                    key={s.label}
                    className="bg-white border border-gray-200 rounded-md px-3 py-2"
                  >
                    <p className="text-xs text-slate-400 font-medium">
                      {s.label}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {s.display}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="w-full md:w-72 p-5 space-y-4 bg-white shrink-0">
            {/* Selected Date */}
            <div
              className={`rounded-lg border p-3.5 transition-colors ${selectedDate ? "bg-blue-50 border-blue-100" : "bg-white border-gray-200"}`}
            >
              {selectedDate ? (
                <>
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">
                    Selected Date
                  </p>
                  <p className="text-sm font-semibold text-blue-800 leading-snug">
                    {formattedDate}
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center py-1">
                  ← Pick a date from the calendar
                </p>
              )}
            </div>

            {/* Busy Slots */}
            {selectedDate &&
              (busySlots.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                    Conflicting Schedules
                  </p>
                  <div className="space-y-1.5">
                    {busySlots.map((slot, i) =>
                      (() => {
                        const overlap =
                          timeStatus === "valid" &&
                          startMin < timeToMin(normalizeHHMM(slot.endTime)) &&
                          endMin > timeToMin(normalizeHHMM(slot.startTime));
                        return (
                          <div
                            key={i}
                            className={`rounded-md px-3 py-2 border ${
                              overlap
                                ? "bg-red-50 border-red-200"
                                : "bg-rose-50 border-rose-100"
                            }`}
                          >
                            <p
                              className={`text-xs font-bold ${
                                overlap ? "text-red-700" : "text-rose-700"
                              }`}
                            >
                              {to12Hour(slot.startTime)} –{" "}
                              {to12Hour(slot.endTime)}
                            </p>
                            <p
                              className={`text-[10px] truncate mt-0.5 ${
                                overlap ? "text-red-600" : "text-rose-500"
                              }`}
                            >
                              {slot.caseNumber} · {slot.natureOfComplaint}
                            </p>
                            {overlap && (
                              <p className="text-xs text-red-700 font-semibold mt-1">
                                Conflicts with selected time
                              </p>
                            )}
                          </div>
                        );
                      })(),
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    No conflicts on this date
                  </p>
                </div>
              ))}

            {/* Time Range */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Time Range *
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 px-2 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                />
                <span className="text-gray-300 text-xs font-bold shrink-0">
                  –
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 px-2 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                />
              </div>

              {timeStatus && timeStatus !== "valid" && (
                <div className="mt-2 flex items-start gap-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertTriangleIcon className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-medium leading-snug">
                    {TIME_MESSAGES[timeStatus]}
                  </p>
                </div>
              )}

             

              
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <MapPinIcon className="w-3 h-3" /> Venue *
              </p>
              <div className="relative">
                <select
                  value={venueOption}
                  onChange={(e) => {
                    setVenueOption(e.target.value);
                    setCustomVenue("");
                  }}
                  className="w-full appearance-none px-3 py-2.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 pr-8"
                >
                  {VENUE_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              {isCustomVenue && (
                <input
                  type="text"
                  placeholder="Type venue name..."
                  value={customVenue}
                  onChange={(e) => setCustomVenue(e.target.value)}
                  className="mt-2 w-full px-3 py-2.5 text-xs border border-blue-200 bg-blue-50/30 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
                  autoFocus
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Notes (Optional)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional instructions for the parties..."
                className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-gray-800"
              />
            </div>

            {error && (
              <div className="flex items-start gap-1.5 p-2.5 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangleIcon className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className="w-full py-2.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Schedule Mediation & Generate Summon
            </button>

            {/* PDF notice */}
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Summon letter (Paanyaya) will be generated as a PDF file
              immediately after scheduling. Please download and print the
              document to serve the parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
