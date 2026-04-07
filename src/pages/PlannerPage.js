import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import ScheduleShiftModal from '../components/planner/ScheduleShiftModal';
import CompleteShiftDialog from '../components/planner/CompleteShiftDialog';
import { STATUS } from '../constants/theme';
import styles from './PlannerPage.module.css';

// ── helpers ──────────────────────────────────────────────────────────────────
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toYMD(date) {
  return date.toISOString().split('T')[0];
}

function formatDayHeader(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(time) {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

const TODAY = toYMD(new Date());
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Build the 35-42 day grid for a given month (padded to full weeks, Mon-first)
function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday-first: 0=Mon…6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(1 - startOffset);
  gridStart.setHours(0, 0, 0, 0);
  const days = [];
  const totalDays = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  for (let i = 0; i < totalDays; i++) {
    days.push(addDays(gridStart, i));
  }
  return days;
}

// ── component ────────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const {
    trainees, positions, plannedShifts,
    addPlannedShift, updatePlannedShift, deletePlannedShift, completePlannedShift, uncompleteShift,
    deriveStatus, recordMap,
  } = useAppContext();

  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [monthYear, setMonthYear] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [completingShift, setCompletingShift] = useState(null);
  const [defaultDate, setDefaultDate] = useState(TODAY);
  const [expandedDay, setExpandedDay] = useState(null); // for month overflow

  const trainers = useMemo(
    () => trainees.filter(t => t.role === 'Trainer' || t.role === 'Team Lead'),
    [trainees]
  );

  // ── week helpers ──────────────────────────────────────────────────────────
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEnd = addDays(weekStart, 6);
  const weekShifts = useMemo(() => {
    const startYMD = toYMD(weekStart);
    const endYMD = toYMD(weekEnd);
    return plannedShifts.filter(s => s.scheduledDate >= startYMD && s.scheduledDate <= endYMD);
  }, [plannedShifts, weekStart, weekEnd]);

  // ── month helpers ─────────────────────────────────────────────────────────
  const monthGrid = useMemo(
    () => getMonthGrid(monthYear.year, monthYear.month),
    [monthYear]
  );
  const monthStart = toYMD(new Date(monthYear.year, monthYear.month, 1));
  const monthEnd = toYMD(new Date(monthYear.year, monthYear.month + 1, 0));
  const monthShifts = useMemo(
    () => plannedShifts.filter(s => s.scheduledDate >= monthStart && s.scheduledDate <= monthEnd),
    [plannedShifts, monthStart, monthEnd]
  );

  // ── unscheduled banner ────────────────────────────────────────────────────
  const unscheduledTrainees = useMemo(() => {
    const sevenDaysOut = toYMD(addDays(new Date(), 7));
    const today = TODAY;
    const hasPendingShift = new Set(
      plannedShifts
        .filter(s => !s.completedAt && s.scheduledDate >= today && s.scheduledDate <= sevenDaysOut)
        .map(s => s.traineeId)
    );
    return trainees.filter(t => {
      if (hasPendingShift.has(t.id)) return false;
      return positions.some(p => {
        const record = recordMap.get(`${t.id}::${p.id}`);
        const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
        return deriveStatus(t.id, p.id, required) === STATUS.IN_PROGRESS;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannedShifts, trainees, positions, recordMap, deriveStatus]);

  const weekPending = weekShifts.filter(s => !s.completedAt).length;
  const weekDone = weekShifts.filter(s => s.completedAt).length;
  const monthPending = monthShifts.filter(s => !s.completedAt).length;
  const monthDone = monthShifts.filter(s => s.completedAt).length;

  // ── actions ───────────────────────────────────────────────────────────────
  function openSchedule(date) {
    setDefaultDate(date ? toYMD(date) : TODAY);
    setEditingShift(null);
    setScheduleOpen(true);
  }

  function openEdit(shift) {
    setEditingShift(shift);
    setDefaultDate(shift.scheduledDate);
    setScheduleOpen(true);
  }

  function handleScheduleSubmit(data) {
    if (editingShift) updatePlannedShift(editingShift.id, data);
    else addPlannedShift(data);
  }

  function handleDelete(id) { deletePlannedShift(id); }

  function getTraineeName(id) { return trainees.find(t => t.id === id)?.name ?? '?'; }
  function getPositionName(id) { return positions.find(p => p.id === id)?.name ?? '?'; }
  function getTrainerName(id) { if (!id) return null; return trainees.find(t => t.id === id)?.name ?? null; }

  // Navigate month
  function prevMonth() {
    setMonthYear(prev => {
      const m = prev.month === 0 ? 11 : prev.month - 1;
      const y = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: y, month: m };
    });
  }
  function nextMonth() {
    setMonthYear(prev => {
      const m = prev.month === 11 ? 0 : prev.month + 1;
      const y = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: y, month: m };
    });
  }
  function goToday() {
    const n = new Date();
    setMonthYear({ year: n.getFullYear(), month: n.getMonth() });
    setWeekStart(getMonday(n));
  }

  // Jump from month to week view at a specific date
  function jumpToWeek(day) {
    setWeekStart(getMonday(day));
    setViewMode('week');
  }

  const MONTH_NAME = new Date(monthYear.year, monthYear.month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ── shift card (shared week/month) ────────────────────────────────────────
  function ShiftCard({ shift, compact = false }) {
    const done = !!shift.completedAt;
    const trainerName = getTrainerName(shift.trainerId);
    return (
      <div className={`${styles.shiftCard} ${done ? styles.shiftCardDone : ''} ${compact ? styles.shiftCardCompact : ''}`}>
        {!compact && shift.scheduledTime && (
          <div className={styles.shiftTime}>⏰ {formatTime(shift.scheduledTime)}</div>
        )}
        <div className={styles.shiftTrainee}>{getTraineeName(shift.traineeId)}</div>
        {!compact && (
          <div className={styles.shiftPos}>
            {getPositionName(shift.positionId)}
            {trainerName && <span className={styles.shiftTrainer}> · {trainerName}</span>}
          </div>
        )}
        {compact && <div className={styles.shiftPosCompact}>{getPositionName(shift.positionId)}</div>}
        {!compact && shift.notes && <div className={styles.shiftNotes}>{shift.notes}</div>}
        {done ? (
          !compact && (
            <div className={styles.doneRow}>
              <div className={styles.doneLabel}>✓ Completed {shift.completedDate}</div>
              <button
                className={styles.undoCompleteBtn}
                onClick={() => uncompleteShift(shift.id)}
                title="Undo this completion and move shift back to pending"
              >↩ Undo</button>
            </div>
          )
        ) : (
          <div className={styles.shiftActions}>
            {!compact && (
              <button className={styles.completeBtn} onClick={() => setCompletingShift(shift)}>✓ Complete</button>
            )}
            {!compact && (
              <button className={styles.editBtn} onClick={() => openEdit(shift)} title="Edit">✎</button>
            )}
            {!compact && (
              <button className={styles.deleteBtn} onClick={() => handleDelete(shift.id)} title="Remove">✕</button>
            )}
            {compact && (
              <button className={styles.completeBtnMini} onClick={() => setCompletingShift(shift)} title="Complete">✓</button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>📅 Shift Planner</h1>
          <p className={styles.subtitle}>Schedule upcoming training shifts and mark them complete when done</p>
        </div>
        <div className={styles.headerRight}>
          {/* Week / Month toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'week' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'month' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
          <button className={styles.scheduleBtn} onClick={() => openSchedule(null)}>+ Schedule Shift</button>
        </div>
      </div>

      {/* Navigation bar */}
      <div className={styles.weekNav}>
        <button className={styles.navBtn} onClick={() => viewMode === 'week' ? setWeekStart(prev => addDays(prev, -7)) : prevMonth()}>‹</button>
        <span className={styles.weekLabel}>
          {viewMode === 'week'
            ? `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : MONTH_NAME
          }
        </span>
        <button className={styles.navBtn} onClick={() => viewMode === 'week' ? setWeekStart(prev => addDays(prev, 7)) : nextMonth()}>›</button>
        <button className={styles.todayBtn} onClick={goToday}>Today</button>
      </div>

      {/* Unscheduled trainees banner */}
      {unscheduledTrainees.length > 0 && (
        <div className={styles.alertBanner}>
          <span>⚠️</span>
          <span>
            <strong>{unscheduledTrainees.length} trainee{unscheduledTrainees.length !== 1 ? 's' : ''}</strong> are
            in progress but have no shift scheduled in the next 7 days:{' '}
            {unscheduledTrainees.map(t => t.name).join(', ')}
          </span>
        </div>
      )}

      {/* ── WEEK VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'week' && (
        <>
          <div className={styles.calendarGrid}>
            {weekDays.map(day => {
              const ymd = toYMD(day);
              const isToday = ymd === TODAY;
              const dayShifts = weekShifts
                .filter(s => s.scheduledDate === ymd)
                .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99'));

              return (
                <div key={ymd} className={styles.dayCol}>
                  <div className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ''}`}>
                    {formatDayHeader(day)}
                  </div>
                  {dayShifts.map(shift => <ShiftCard key={shift.id} shift={shift} />)}
                  <button className={styles.addDayBtn} onClick={() => openSchedule(day)} title={`Schedule for ${formatDayHeader(day)}`}>+</button>
                </div>
              );
            })}
          </div>
          <div className={styles.summary}>
            This week: {weekShifts.length} shift{weekShifts.length !== 1 ? 's' : ''} scheduled
            {weekDone > 0 && ` · ${weekDone} completed`}
            {weekPending > 0 && ` · ${weekPending} pending`}
          </div>
        </>
      )}

      {/* ── MONTH VIEW ────────────────────────────────────────────────────── */}
      {viewMode === 'month' && (
        <>
          {/* Day-of-week headers */}
          <div className={styles.monthGrid}>
            {DAY_LABELS.map(d => (
              <div key={d} className={styles.monthDayLabel}>{d}</div>
            ))}

            {monthGrid.map(day => {
              const ymd = toYMD(day);
              const isToday = ymd === TODAY;
              const isCurrentMonth = day.getMonth() === monthYear.month;
              const dayShifts = monthShifts
                .filter(s => s.scheduledDate === ymd)
                .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99'));
              const visible = dayShifts.slice(0, 3);
              const overflow = dayShifts.length - 3;
              const isExpanded = expandedDay === ymd;

              return (
                <div
                  key={ymd}
                  className={`${styles.monthCell} ${isToday ? styles.monthCellToday : ''} ${!isCurrentMonth ? styles.monthCellOther : ''}`}
                >
                  <div className={styles.monthCellHeader}>
                    <span className={`${styles.monthDateNum} ${isToday ? styles.monthDateToday : ''}`}>
                      {day.getDate()}
                    </span>
                    <button className={styles.monthAddBtn} onClick={() => openSchedule(day)} title="Add shift">+</button>
                  </div>

                  {(isExpanded ? dayShifts : visible).map(shift => (
                    <div
                      key={shift.id}
                      className={`${styles.monthPill} ${shift.completedAt ? styles.monthPillDone : ''}`}
                      onClick={() => { setCompletingShift(shift.completedAt ? null : shift); openEdit(shift); }}
                      title={`${getTraineeName(shift.traineeId)} — ${getPositionName(shift.positionId)}${shift.completedAt ? ' (done)' : ''}`}
                    >
                      <span className={shift.completedAt ? styles.monthPillCheck : styles.monthPillDot}>
                        {shift.completedAt ? '✓' : '●'}
                      </span>
                      {getTraineeName(shift.traineeId)}
                    </div>
                  ))}

                  {overflow > 0 && !isExpanded && (
                    <button
                      className={styles.monthOverflow}
                      onClick={() => setExpandedDay(isExpanded ? null : ymd)}
                    >
                      +{overflow} more
                    </button>
                  )}
                  {isExpanded && (
                    <button className={styles.monthOverflow} onClick={() => setExpandedDay(null)}>
                      Show less
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.summary}>
            {MONTH_NAME}: {monthShifts.length} shift{monthShifts.length !== 1 ? 's' : ''} scheduled
            {monthDone > 0 && ` · ${monthDone} completed`}
            {monthPending > 0 && ` · ${monthPending} pending`}
            <button className={styles.switchToWeek} onClick={() => jumpToWeek(new Date())}>
              Switch to week view →
            </button>
          </div>
        </>
      )}

      {/* Empty state hint */}
      {(trainees.length === 0 || positions.length === 0) && (
        <p className={styles.emptyHint}>
          Add <Link to="/trainees" className={styles.emptyLink}>trainees</Link> and{' '}
          <Link to="/positions" className={styles.emptyLink}>positions</Link> first.
        </p>
      )}

      {/* Modals */}
      <ScheduleShiftModal
        isOpen={scheduleOpen}
        onClose={() => { setScheduleOpen(false); setEditingShift(null); }}
        onSubmit={handleScheduleSubmit}
        initialValues={editingShift ?? {}}
        defaultDate={defaultDate}
        trainees={trainees}
        positions={positions}
        trainers={trainers}
      />

      <CompleteShiftDialog
        isOpen={!!completingShift}
        onClose={() => setCompletingShift(null)}
        plannedShift={completingShift}
        traineeName={completingShift ? getTraineeName(completingShift.traineeId) : ''}
        positionName={completingShift ? getPositionName(completingShift.positionId) : ''}
        onConfirm={completePlannedShift}
      />
    </PageContainer>
  );
}
