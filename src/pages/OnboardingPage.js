import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/shared/Button';
import { ROLE_COLORS, CHECKLIST_CATEGORIES } from '../constants/theme';
import styles from './OnboardingPage.module.css';

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function OnboardingPage() {
  const {
    trainees,
    checklistItems,
    checklistProgress,
    setChecklistItemProgress,
    getOnboardingProgress,
  } = useAppContext();

  const [selectedTraineeId, setSelectedTraineeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedItems = useMemo(() => [...checklistItems].sort((a, b) => a.order - b.order), [checklistItems]);

  const filteredTrainees = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return trainees.filter(t => t.name.toLowerCase().includes(q));
  }, [trainees, searchQuery]);

  const selectedTrainee = trainees.find(t => t.id === selectedTraineeId);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    CHECKLIST_CATEGORIES.forEach(cat => { groups[cat] = []; });
    sortedItems.forEach(item => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [sortedItems]);

  // Get progress record for a trainee + item
  function getProgress(traineeId, itemId) {
    return checklistProgress.find(p => p.traineeId === traineeId && p.itemId === itemId);
  }

  // --- Detail View ---
  if (selectedTrainee) {
    const ob = getOnboardingProgress(selectedTrainee.id);
    const roleColor = ROLE_COLORS[selectedTrainee.role] || ROLE_COLORS['Team Member'];

    return (
      <PageContainer>
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={() => setSelectedTraineeId(null)}>
            ← Back to All
          </button>
          <div className={styles.traineeInfo}>
            <div className={styles.detailAvatar} style={{ backgroundColor: roleColor.avatar }}>
              {selectedTrainee.photoUrl
                ? <img src={selectedTrainee.photoUrl} alt={selectedTrainee.name} className={styles.detailAvatarImg} />
                : getInitials(selectedTrainee.name)
              }
            </div>
            <div>
              <div className={styles.detailName}>{selectedTrainee.name}</div>
              <span className={styles.roleBadge} style={{ backgroundColor: roleColor.bg, color: roleColor.text }}>
                {selectedTrainee.role}
              </span>
            </div>
          </div>
          <div className={styles.detailProgress}>
            <div className={styles.progressSummary}>
              <span className={styles.progressNum}>{ob.completed}</span>
              <span className={styles.progressDen}> / {ob.total} items complete</span>
            </div>
            <div className={styles.progressBarWrap}>
              <div className={styles.progressBarFill} style={{ width: `${ob.pct}%`, backgroundColor: ob.pct === 100 ? '#2E7D32' : ob.pct > 0 ? '#E65100' : '#bdbdbd' }} />
            </div>
            <span className={styles.progressPct}>{ob.pct}%</span>
          </div>
        </div>

        <div className={styles.checklistContainer}>
          {Object.entries(groupedItems).map(([category, items]) => {
            if (!items.length) return null;
            return (
              <div key={category} className={styles.checklistGroup}>
                <div className={styles.groupTitle}>{category}</div>
                {items.map(item => {
                  const prog = getProgress(selectedTrainee.id, item.id);
                  const done = prog?.completed || false;
                  return (
                    <label key={item.id} className={`${styles.checklistItem} ${done ? styles.itemDone : ''}`}>
                      <input
                        type="checkbox"
                        className={styles.itemCheckbox}
                        checked={done}
                        onChange={() => setChecklistItemProgress(selectedTrainee.id, item.id, !done)}
                      />
                      <div className={styles.itemBody}>
                        <span className={styles.itemLabel}>{item.label}</span>
                        <div className={styles.itemMeta}>
                          {item.required && <span className={styles.requiredBadge}>Required</span>}
                          {done && prog?.completedAt && (
                            <span className={styles.completedDate}>
                              ✓ {new Date(prog.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      </PageContainer>
    );
  }

  // --- List View ---
  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Onboarding</h1>
          <p className={styles.subtitle}>Track new hire checklists for each team member</p>
        </div>
      </div>

      <input
        className={styles.search}
        type="text"
        placeholder="Search team members..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      {filteredTrainees.length === 0 ? (
        <div className={styles.empty}>No team members found.</div>
      ) : (
        <div className={styles.traineeGrid}>
          {filteredTrainees.map(trainee => {
            const ob = getOnboardingProgress(trainee.id);
            const roleColor = ROLE_COLORS[trainee.role] || ROLE_COLORS['Team Member'];
            const barColor = ob.pct === 100 ? '#2E7D32' : ob.pct > 0 ? '#E65100' : '#bdbdbd';

            return (
              <div key={trainee.id} className={styles.traineeCard}>
                <div className={styles.cardTop}>
                  <div className={styles.cardAvatar} style={{ backgroundColor: roleColor.avatar }}>
                    {trainee.photoUrl
                      ? <img src={trainee.photoUrl} alt={trainee.name} className={styles.cardAvatarImg} />
                      : getInitials(trainee.name)
                    }
                  </div>
                  <div className={styles.cardInfo}>
                    <div className={styles.cardName}>{trainee.name}</div>
                    <span className={styles.cardRole} style={{ backgroundColor: roleColor.bg, color: roleColor.text }}>
                      {trainee.role}
                    </span>
                  </div>
                </div>

                <div className={styles.cardProgress}>
                  <div className={styles.cardProgressBar}>
                    <div className={styles.cardProgressFill} style={{ width: `${ob.pct}%`, backgroundColor: barColor }} />
                  </div>
                  <div className={styles.cardProgressText}>
                    <span style={{ color: barColor, fontWeight: 600 }}>{ob.pct}%</span>
                    <span className={styles.cardProgressSub}>{ob.completed} / {ob.total} items</span>
                  </div>
                </div>

                <Button
                  variant={ob.pct === 100 ? 'ghost' : 'primary'}
                  size="sm"
                  onClick={() => setSelectedTraineeId(trainee.id)}
                >
                  {ob.pct === 100 ? '✓ View Checklist' : 'View Checklist →'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
