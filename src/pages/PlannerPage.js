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
  const day = d.getDay(); // 0 = Sun
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

// ── component ────────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const {
    trainees, positions, plannedShifts,
    addPlannedShift, updatePlannedShift, deletePlannedShift, completePlannedShift,
    deriveStatus, recordMap,
  } = useAppContext();

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [completingShift, setCompletingShift] = useState(null);
  const [defaultDate, setDefaultDate] = useState(TODAY);

  // Trainers = Trainer or Team Lead role
  const trainers = useMemo(
    () => trainees.filter(t => t.role === 'Trainer' || t.role === 'Team Lead'),
    [trainees]
  );

  // Build array of 7 day dates for this week
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const weekEnd = addDays(weekStart, 6);

  // Shifts that fall within this week
  const weekShifts = useMemo(() => {
    const startYMD = toYMD(weekStart);
    const endYMD = toYMD(weekEnd);
    return plannedShifts.filter(s => s.scheduledDate >= startYMD && s.scheduledDate <= endYMD);
  }, [plannedShifts, weekStart, weekEnd]);

  // Unscheduled in-progress trainees: IN_PROGRESS on ≥1 position, no pending planned shift in the next 7 days
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

  // Summary counts for this week
  const weekPending = weekShifts.filter(s => !s.completedAt).length;
  const weekDone = weekShifts.filter(s => s.completedAt).length;

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
    if (editingShift) {
      updatePlannedShift(editingShift.id, data);
    } else {
      addPlannedShift(data);
    }
  }

  function handleDelete(id) {
    deletePlannedShift(id);
  }

  function getTraineeName(id) {
    return trainees.find(t => t.id === id)?.name ?? '?';
  }
  function getPositionName(id) {
    return positions.find(p => p.id === id)?.name ?? '?';
  }
  function getTrainerName(id) {
    if (!id) return null;
    return trainees.find(t => t.id === id)?.name ?? null;
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>📅 Shift Planner</h1>
          <p className={styles.subtitle}>
            Schedule upcoming training shifts and mark them complete when done
          </p>
        </div>
        <button className={styles.scheduleBtn} onClick={() => openSchedule(null)}>
          + Schedule Shift
        </button>
      </div>

      {/* Week navigation */}
      <div className={styles.weekNav}>
        <button className={styles.navBtn} onClick={() => setWeekStart(prev => addDays(prev, -7))}>‹</button>
        <span className={styles.weekLabel}>
          {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' – '}
          {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <button className={styles.navBtn} onClick={() => setWeekStart(prev => addDays(prev, 7))}>›</button>
        <button
          className={styles.todayBtn}
          onClick={() => setWeekStart(getMonday(new Date()))}
        >
          Today
        </button>
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

      {/* 7-day calendar grid */}
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

              {dayShifts.map(shift => {
                const done = !!shift.completedAt;
                const trainerName = getTrainerName(shift.trainerId);
                return (
                  <div key={shift.id} className={`${styles.shiftCard} ${done ? styles.shiftCardDone : ''}`}>
                    {shift.scheduledTime && (
                      <div className={styles.shiftTime}>⏰ {formatTime(shift.scheduledTime)}</div>
                    )}
                    <div className={styles.shiftTrainee}>{getTraineeName(shift.traineeId)}</div>
                    <div className={styles.shiftPos}>
                      {getPositionName(shift.positionId)}
                      {trainerName && <span className={styles.shiftTrainer}> · {trainerName}</span>}
                    </div>
                    {shift.notes && <div className={styles.shiftNotes}>{shift.notes}</div>}
                    {done ? (
                      <div className={styles.doneLabel}>✓ Completed {shift.completedDate}</div>
                    ) : (
                      <div className={styles.shiftActions}>
                        <button
                          className={styles.completeBtn}
                          onClick={() => setCompletingShift(shift)}
                        >
                          ✓ Complete
                        </button>
                        <button
                          className={styles.editBtn}
                          onClick={() => openEdit(shift)}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(shift.id)}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add shift button for this day */}
              <button
                className={styles.addDayBtn}
                onClick={() => openSchedule(day)}
                title={`Schedule a shift for ${formatDayHeader(day)}`}
              >
                +
              </button>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        This week: {weekShifts.length} shift{weekShifts.length !== 1 ? 's' : ''} scheduled
        {weekDone > 0 && ` · ${weekDone} completed`}
        {weekPending > 0 && ` · ${weekPending} pending`}
      </div>

      {/* Empty state hint */}
      {trainees.length === 0 || positions.length === 0 ? (
        <p className={styles.emptyHint}>
          Add <Link to="/trainees" className={styles.emptyLink}>trainees</Link> and{' '}
          <Link to="/positions" className={styles.emptyLink}>positions</Link> first.
        </p>
      ) : null}

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
