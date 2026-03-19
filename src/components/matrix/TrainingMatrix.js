import MatrixCell from './MatrixCell';
import EmptyState from '../shared/EmptyState';
import styles from './TrainingMatrix.module.css';

export default function TrainingMatrix({ trainees, positions, recordMap, shifts, deriveStatus, getCompletedShiftCount, onCellClick }) {
  function getRecord(traineeId, positionId) {
    return recordMap.get(`${traineeId}::${positionId}`) || null;
  }

  if (!trainees.length && !positions.length) {
    return (
      <EmptyState
        icon="📊"
        message="Add trainees and positions to see the training matrix."
      />
    );
  }

  if (!trainees.length) {
    return (
      <EmptyState
        icon="👤"
        message="No trainees match your search. Add trainees to track their training."
      />
    );
  }

  if (!positions.length) {
    return (
      <EmptyState
        icon="📍"
        message="No positions defined yet. Add positions to build the matrix."
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={`${styles.th} ${styles.cornerCell}`}>
              <span className={styles.cornerLabel}>Trainee ↓ / Position →</span>
            </th>
            {positions.map((pos) => (
              <th key={pos.id} className={styles.th}>
                <div className={styles.posHeader}>
                  <span className={styles.posName}>{pos.name}</span>
                  <span className={styles.posCat}>{pos.category}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trainees.map((trainee) => (
            <tr key={trainee.id} className={styles.row}>
              <td className={`${styles.td} ${styles.nameCell}`}>
                <div className={styles.traineeInfo}>
                  <div className={styles.avatar}>
                    {trainee.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <div className={styles.traineeName}>{trainee.name}</div>
                    <div className={styles.traineeRole}>{trainee.role}</div>
                  </div>
                </div>
              </td>
              {positions.map((pos) => {
                const record = getRecord(trainee.id, pos.id);
                const required = record?.requiredShifts ?? pos.requiredShifts ?? 3;
                const completed = getCompletedShiftCount(trainee.id, pos.id);
                const status = deriveStatus(trainee.id, pos.id, required);
                return (
                  <MatrixCell
                    key={pos.id}
                    trainee={trainee}
                    position={pos}
                    completedCount={completed}
                    requiredShifts={required}
                    status={status}
                    onCellClick={onCellClick}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
