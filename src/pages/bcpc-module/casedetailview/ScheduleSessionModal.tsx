import { useState } from 'react';
import {
  XIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon,
  AlertTriangleIcon, CheckCircleIcon, ChevronDownIcon, MapPinIcon, Loader2Icon
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WORKING_SESSIONS = [
  { label: 'Morning Session', display: '7:00 AM – 11:30 AM', start: '07:00', end: '11:30' },
  { label: 'Afternoon Session', display: '1:00 PM – 5:00 PM', start: '13:00', end: '17:00' },
];
const VENUE_OPTIONS = [
  'Barangay Hall – Session Room',
  'Barangay Hall – Conference Room',
  'BCPC Office',
  'Other (specify)',
];

const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDay  = (y: number, m: number) => new Date(y, m, 1).getDay();
const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const timeToMin = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const to12h = (t: string) => {
  if (!t) return '';
  const [h,m] = t.split(':').map(Number);
  return `${h%12||12}:${pad(m)} ${h>=12?'PM':'AM'}`;
};

type TimeStatus = 'valid'|'outside'|'crosses_lunch'|'end_before_start'|null;
const getTimeStatus = (s: string, e: string): TimeStatus => {
  if (!s||!e) return null;
  const sm=timeToMin(s), em=timeToMin(e);
  if (em<=sm) return 'end_before_start';
  if ((sm>=timeToMin('07:00')&&em<=timeToMin('11:30'))||(sm>=timeToMin('13:00')&&em<=timeToMin('17:00'))) return 'valid';
  if (sm<timeToMin('11:30')&&em>timeToMin('13:00')) return 'crosses_lunch';
  return 'outside';
};
const TIME_MSG: Record<string,string> = {
  end_before_start: 'End time must be after start time.',
  crosses_lunch: 'Schedule crosses the lunch break (11:30 AM – 1:00 PM).',
  outside: 'Selected time is outside office working hours.',
};

interface Props {
  sessionNumber: number;
  childName: string;
  respondentName: string;
  caseNumber: string;
  onSave: (data: { date: string; startTime: string; endTime: string; venue: string; notes: string }) => Promise<void>;
  onCancel: () => void;
}

export function ScheduleSessionModal({ sessionNumber, onSave, onCancel }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [venueOption, setVenueOption] = useState(VENUE_OPTIONS[0]);
  const [customVenue, setCustomVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isCustom = venueOption === 'Other (specify)';
  const finalVenue = isCustom ? customVenue.trim() : venueOption;
  const timeStatus = getTimeStatus(startTime, endTime);
  const isValid = !!selectedDate && timeStatus === 'valid' && !!finalVenue;

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDay(viewYear, viewMonth);

  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
    : null;

  const prevMonth = () => { if (viewMonth===0){setViewYear(y=>y-1);setViewMonth(11);}else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth===11){setViewYear(y=>y+1);setViewMonth(0);}else setViewMonth(m=>m+1); };

  const handleSubmit = async () => {
    if (!isValid) { setError(timeStatus&&timeStatus!=='valid' ? TIME_MSG[timeStatus] : 'Please complete all required fields.'); return; }
    try {
      setLoading(true);
      setError('');
      await onSave({ date: selectedDate, startTime, endTime, venue: finalVenue, notes: notes.trim() });
    } catch (err: any) {
      setError(err.message || 'Failed to schedule mediation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Schedule Mediation #{sessionNumber}</h3>
            <p className="text-sm text-gray-500 mt-0.5">Pick a date, set a time within office hours, then confirm. A summon letter (Paanyaya) will be generated automatically.</p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-y-auto">
          {/* Left — Calendar */}
          <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeftIcon className="w-4 h-4 text-gray-500" /></button>
              <span className="text-sm font-bold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRightIcon className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1 uppercase tracking-wide">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstDay }).map((_,i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_,i)=>i+1).map(day => {
                const ds = toDateStr(viewYear, viewMonth, day);
                const isPast = ds < todayStr;
                const isSel = ds === selectedDate;
                const isToday = ds === todayStr;
                return (
                  <button key={day} disabled={isPast} onClick={() => setSelectedDate(ds)}
                    className={`relative mx-auto w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all
                      ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'}
                      ${isSel ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-600' : ''}
                      ${isToday&&!isSel ? 'ring-2 ring-blue-400 text-blue-600' : ''}
                      ${!isSel&&!isToday&&!isPast ? 'text-gray-700' : ''}`}>
                    {day}
                  </button>
                );
              })}
            </div>
            {/* Office Hours */}
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Office Working Hours</p>
              <div className="grid grid-cols-2 gap-2">
                {WORKING_SESSIONS.map(s => (
                  <div key={s.label} className="bg-white border border-gray-200 rounded-md px-3 py-2">
                    <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{s.display}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="w-full md:w-72 p-5 space-y-4 bg-white shrink-0">
            {/* Selected date */}
            <div className={`rounded-lg border p-3.5 transition-colors ${selectedDate ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
              {selectedDate ? (
                <>
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Selected Date</p>
                  <p className="text-sm font-semibold text-blue-800 leading-snug">{formattedDate}</p>
                  <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium">No conflicts on this date</p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center py-1">← Pick a date from the calendar</p>
              )}
            </div>

            {/* Time Range */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Time Range *</p>
              <div className="flex items-center gap-2">
                <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="flex-1 px-2 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-800" />
                <span className="text-gray-300 text-xs font-bold shrink-0">–</span>
                <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="flex-1 px-2 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-800" />
              </div>
              {timeStatus && timeStatus !== 'valid' && (
                <div className="mt-2 flex items-start gap-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertTriangleIcon className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-medium leading-snug">{TIME_MSG[timeStatus]}</p>
                </div>
              )}
              {timeStatus === 'valid' && (
                <div className="mt-2 flex items-center gap-1.5 px-2.5 py-2 bg-emerald-50 border border-emerald-100 rounded-md">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">Within office hours</p>
                </div>
              )}
            </div>

            {/* Venue */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><MapPinIcon className="w-3 h-3" /> Venue *</p>
              <div className="relative">
                <select value={venueOption} onChange={e=>{setVenueOption(e.target.value);setCustomVenue('');}}
                  className="w-full appearance-none px-3 py-2.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-800 pr-8">
                  {VENUE_OPTIONS.map(v=><option key={v} value={v}>{v}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              {isCustom && (
                <input type="text" autoFocus placeholder="Type venue name..." value={customVenue} onChange={e=>setCustomVenue(e.target.value)}
                  className="mt-2 w-full px-3 py-2.5 text-xs border border-blue-200 bg-blue-50/30 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800" />
              )}
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Notes (Optional)</p>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
                placeholder="Additional instructions for the parties..."
                className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-white text-gray-800" />
            </div>

            {error && (
              <div className="flex items-start gap-1.5 p-2.5 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangleIcon className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={!isValid || loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" /> Scheduling...
                </>
              ) : (
                'Schedule Mediation & Generate Paanyaya'
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Ang Paanyaya (summon letter) ay awtomatikong mabubuo pagkatapos mag-schedule.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
