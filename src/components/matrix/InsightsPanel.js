import styles from './InsightsPanel.module.css';

export default function InsightsPanel({ isOpen, onToggle, stats, traineeStats, positionStats, assignedForTraining = [] }) {
  if (!stats) return null;

  const needsAttention = positionStats.filter((p) => p.pct === 0);

  return (
    <div className={styles.panel}>
      <button className={styles.toggle} onClick={onToggle}>
        <span className={styles.toggleIcon}>{isOpen ? '▾' : '▸'}</span>
        <span className={styles.toggleLabel}>Insights</span>
        <span className={styles.toggleSummary}>
          {stats.pct}% trained overall
          {stats.inProgress > 0 ? ` · ${stats.inProgress} in progress` : ''}
          {needsAttention.length > 0 ? ` · ${needsAttention.length} position${needsAttention.length !== 1 ? 's' : ''} not started` : ''}
          {assignedForTraining.length > 0 ? ` · ${assignedForTraining.length} assigned for training` : ''}
        </span>
      </button>

      {isOpen && (
        <div className={styles.body}>
          {/* Overall bar */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Overall Completion</div>
            <div className={styles.overallRow}>
              <div className={styles.bigBarTrack}>
                <div
                  className={styles.bigBarFill}
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
              <span className={styles.bigBarPct}>{stats.pct}%</span>
            </div>
            <div className={styles.overallCounts}>
              <span className={styles.countTrained}>✓ {stats.trained} trained</span>
              {stats.inProgress > 0 && (
                <span className={styles.countProgress}>◐ {stats.inProgress} in progress</span>
              )}
              <span className={styles.countTotal}>of {stats.total} total</span>
            </div>
          </div>

          <div className={styles.columns}>
            {/* Needs attention */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>
                {needsAttention.length === 0 ? '🎉 All Positions Started' : '⚠️ Needs Attention'}
              </div>
              {needsAttention.length === 0 ? (
                <p className={styles.allGood}>Every position has at least one trained team member.</p>
              ) : (
                <ul className={styles.attentionList}>
                  {needsAttention.map(({ position }) => (
                    <li key={position.id} className={styles.attentionItem}>
                      <span className={styles.attentionDot} />
                      <span className={styles.attentionName}>{position.name}</span>
                      <span className={styles.attentionCat}>{position.category}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Position progress */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Position Progress</div>
              <ul className={styles.barList}>
                {positionStats.map(({ position, trained, total, pct }) => (
                  <li key={position.id} className={styles.barItem}>
                    <span className={styles.barItemName}>{position.name}</span>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.barItemCount}>{trained}/{total}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trainee progress */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Trainee Progress</div>
              <ul className={styles.barList}>
                {traineeStats.map(({ trainee, trained, total, pct }) => (
                  <li key={trainee.id} className={styles.barItem}>
                    <span className={styles.barItemName}>{trainee.name}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${pct === 100 ? styles.barFillComplete : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={styles.barItemCount}>{trained}/{total}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Assigned for Training */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>🎯 Assigned for Training</div>
              {assignedForTraining.length === 0 ? (
                <p className={styles.allGood}>No active training assignments.</p>
              ) : (
                <ul className={styles.attentionList}>
                  {assignedForTraining.map(({ trainee, position }) => (
                    <li key={`${trainee.id}-${position.id}`} className={styles.attentionItem}>
                      <span className={`${styles.attentionDot} ${styles.assignedDot}`} />
                      <span className={styles.attentionName}>{trainee.name}</span>
                      <span className={styles.attentionCat}>— {position.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
