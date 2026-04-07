import Button from '../shared/Button';
import styles from './TraineeCard.module.css';
import { ROLE_COLORS } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_TAG_CONFIG = {
  on_track:     { label: 'On Track',     bg: '#E8F5E9', color: '#2E7D32' },
  needs_review: { label: 'Needs Review', bg: '#FFF8E1', color: '#E65100' },
  on_hold:      { label: 'On Hold',      bg: '#F5F5F5', color: '#616161' },
};

export default function TraineeCard({ trainee, onEdit, onDelete, onReport, onQR, onCopyPlan }) {
  const roleColor = ROLE_COLORS[trainee.role] || ROLE_COLORS['Team Member'];
  const { getOnboardingProgress, updateTrainee } = useAppContext();
  const ob = getOnboardingProgress(trainee.id);

  const obClass = ob.pct === 100 ? styles.obDone : ob.pct > 0 ? styles.obPartial : styles.obNone;

  return (
    <div className={styles.card}>
      <div
        className={styles.avatar}
        style={{ backgroundColor: roleColor.avatar }}
      >
        {trainee.photoUrl
          ? <img src={trainee.photoUrl} alt={trainee.name} className={styles.avatarImg} />
          : getInitials(trainee.name)
        }
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{trainee.name}</div>
        <div className={styles.meta}>
          <span
            className={styles.role}
            style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
          >
            {trainee.role}
          </span>
          <span className={`${styles.onboardingBadge} ${obClass}`}>
            {ob.pct}% onboarded
          </span>
          {trainee.startDate && (
            <span className={styles.date}>Started {formatDate(trainee.startDate)}</span>
          )}
          <select
            className={styles.statusTagPicker}
            value={trainee.statusTag || ''}
            onChange={e => updateTrainee(trainee.id, { statusTag: e.target.value || null })}
            style={trainee.statusTag ? {
              backgroundColor: STATUS_TAG_CONFIG[trainee.statusTag]?.bg,
              color: STATUS_TAG_CONFIG[trainee.statusTag]?.color,
            } : {}}
          >
            <option value="">+ Status</option>
            <option value="on_track">On Track</option>
            <option value="needs_review">Needs Review</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
        {trainee.notes && <div className={styles.notes}>{trainee.notes}</div>}
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={() => onReport(trainee)}>📋 Report</Button>
        {onQR && <Button variant="ghost" size="sm" onClick={() => onQR(trainee)}>🔲 QR</Button>}
        {onCopyPlan && <Button variant="ghost" size="sm" onClick={() => onCopyPlan(trainee)}>📄 Copy Plan</Button>}
        <Button variant="ghost" size="sm" onClick={() => onEdit(trainee)}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(trainee)}>Delete</Button>
      </div>
    </div>
  );
}
