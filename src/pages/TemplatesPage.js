import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import Modal from '../components/shared/Modal';
import Button from '../components/shared/Button';
import { TIER_LABELS, TIER_COLORS } from '../constants/theme';
import styles from './TemplatesPage.module.css';

function TierBadge({ tier }) {
  const colors = TIER_COLORS[tier] || TIER_COLORS[1];
  return (
    <span className={styles.tierBadge} style={{ background: colors.bg, color: colors.text }}>
      {TIER_LABELS[tier] || 'Basic'}
    </span>
  );
}

const EMPTY_TEMPLATE = { name: '', description: '', positionIds: [], estimatedWeeks: 2, tier: 1 };

export default function TemplatesPage() {
  const {
    trainingTemplates,
    addTrainingTemplate,
    updateTrainingTemplate,
    deleteTrainingTemplate,
    applyTemplateToTrainee,
    positions,
    trainees,
  } = useAppContext();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [applyModal, setApplyModal] = useState(null); // template object
  const [formValues, setFormValues] = useState(EMPTY_TEMPLATE);
  const [applyTraineeId, setApplyTraineeId] = useState('');
  const [applyStartDate, setApplyStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [applySuccess, setApplySuccess] = useState(false);

  function openCreate() {
    setEditingTemplate(null);
    setFormValues(EMPTY_TEMPLATE);
    setFormOpen(true);
  }

  function openEdit(tpl) {
    setEditingTemplate(tpl);
    setFormValues({ name: tpl.name, description: tpl.description, positionIds: [...tpl.positionIds], estimatedWeeks: tpl.estimatedWeeks, tier: tpl.tier });
    setFormOpen(true);
  }

  function handleFormSave() {
    if (!formValues.name.trim()) return;
    if (editingTemplate) {
      updateTrainingTemplate(editingTemplate.id, formValues);
    } else {
      addTrainingTemplate(formValues);
    }
    setFormOpen(false);
  }

  function togglePosition(posId) {
    setFormValues(prev => {
      const ids = prev.positionIds.includes(posId)
        ? prev.positionIds.filter(id => id !== posId)
        : [...prev.positionIds, posId];
      return { ...prev, positionIds: ids };
    });
  }

  function movePosition(idx, dir) {
    setFormValues(prev => {
      const ids = [...prev.positionIds];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= ids.length) return prev;
      [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
      return { ...prev, positionIds: ids };
    });
  }

  function openApply(tpl) {
    setApplyModal(tpl);
    setApplyTraineeId(trainees[0]?.id || '');
    setApplyStartDate(new Date().toISOString().split('T')[0]);
    setApplySuccess(false);
  }

  function handleApply() {
    if (!applyTraineeId || !applyStartDate) return;
    applyTemplateToTrainee(applyModal.id, applyTraineeId, applyStartDate);
    setApplySuccess(true);
  }

  // Preview: estimated end date
  const applyEndDate = useMemo(() => {
    if (!applyModal || !applyStartDate) return '';
    const d = new Date(applyStartDate + 'T00:00:00');
    d.setDate(d.getDate() + applyModal.estimatedWeeks * 7);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [applyModal, applyStartDate]);

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Training Templates</h1>
          <p className={styles.subtitle}>Create reusable training plans and apply them to team members</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ New Template</Button>
      </div>

      {trainingTemplates.length === 0 ? (
        <div className={styles.empty}>No templates yet. Create one to get started.</div>
      ) : (
        <div className={styles.templateGrid}>
          {trainingTemplates.map(tpl => {
            const posNames = tpl.positionIds.map(id => positions.find(p => p.id === id)?.name).filter(Boolean);
            return (
              <div key={tpl.id} className={styles.templateCard}>
                <div className={styles.cardTop}>
                  <div className={styles.cardMeta}>
                    <TierBadge tier={tpl.tier} />
                    {tpl.isBuiltIn && <span className={styles.builtInBadge}>Built-in</span>}
                  </div>
                  <h3 className={styles.cardName}>{tpl.name}</h3>
                  {tpl.description && <p className={styles.cardDesc}>{tpl.description}</p>}
                </div>

                <div className={styles.cardStats}>
                  <span className={styles.stat}>⏱ ~{tpl.estimatedWeeks} {tpl.estimatedWeeks === 1 ? 'week' : 'weeks'}</span>
                  <span className={styles.stat}>📍 {tpl.positionIds.length} {tpl.positionIds.length === 1 ? 'position' : 'positions'}</span>
                </div>

                {posNames.length > 0 && (
                  <div className={styles.positionList}>
                    {posNames.map((name, i) => (
                      <span key={i} className={styles.positionChip}>{name}</span>
                    ))}
                  </div>
                )}

                <div className={styles.cardActions}>
                  <Button variant="primary" size="sm" onClick={() => openApply(tpl)}>Apply to Trainee</Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(tpl)}>Edit</Button>
                  {!tpl.isBuiltIn && (
                    <Button variant="danger" size="sm" onClick={() => deleteTrainingTemplate(tpl.id)}>Delete</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {formOpen && (
        <Modal title={editingTemplate ? 'Edit Template' : 'New Template'} isOpen={true} onClose={() => setFormOpen(false)}>
          <div className={styles.formBody}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Template Name *</label>
              <input
                className={styles.formInput}
                value={formValues.name}
                onChange={e => setFormValues(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. New Hire – 2 Week"
                autoFocus
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Description</label>
              <textarea
                className={styles.formTextarea}
                value={formValues.description}
                onChange={e => setFormValues(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this training plan..."
                rows={2}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Estimated Weeks</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  className={styles.formInput}
                  value={formValues.estimatedWeeks}
                  onChange={e => setFormValues(p => ({ ...p, estimatedWeeks: Number(e.target.value) }))}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Difficulty Tier</label>
                <div className={styles.tierSegment}>
                  {[1, 2, 3].map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.tierSegBtn} ${formValues.tier === t ? styles.tierSegActive : ''}`}
                      onClick={() => setFormValues(p => ({ ...p, tier: t }))}
                    >
                      {TIER_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Positions (in training order)</label>
              {editingTemplate?.isBuiltIn && (
                <p className={styles.builtInHint}>
                  This is a built-in template. You can add positions to customize it for your store.
                </p>
              )}
              <div className={styles.posCheckList}>
                {positions.map(pos => {
                  const checked = formValues.positionIds.includes(pos.id);
                  const idx = formValues.positionIds.indexOf(pos.id);
                  return (
                    <div key={pos.id} className={`${styles.posCheckRow} ${checked ? styles.posChecked : ''}`}>
                      <label className={styles.posCheckLabel}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePosition(pos.id)}
                        />
                        <span>{pos.name}</span>
                        <span className={styles.posCat}>{pos.category}</span>
                      </label>
                      {checked && (
                        <div className={styles.posOrder}>
                          <span className={styles.posOrderNum}>#{idx + 1}</span>
                          <button type="button" className={styles.orderBtn} onClick={() => movePosition(idx, -1)} disabled={idx === 0}>↑</button>
                          <button type="button" className={styles.orderBtn} onClick={() => movePosition(idx, 1)} disabled={idx === formValues.positionIds.length - 1}>↓</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.formActions}>
              <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleFormSave} disabled={!formValues.name.trim()}>
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Apply to Trainee Modal */}
      {applyModal && (
        <Modal title={`Apply: ${applyModal.name}`} isOpen={true} onClose={() => setApplyModal(null)}>
          {applySuccess ? (
            <div className={styles.applySuccess}>
              <div className={styles.successIcon}>✓</div>
              <div className={styles.successTitle}>Template Applied!</div>
              <p className={styles.successMsg}>
                {applyModal.positionIds.length} planned shifts created for {trainees.find(t => t.id === applyTraineeId)?.name}.
              </p>
              <div className={styles.formActions}>
                <Button variant="ghost" onClick={() => setApplyModal(null)}>Close</Button>
                <Button variant="primary" onClick={() => setApplySuccess(false)}>Apply to Another</Button>
              </div>
            </div>
          ) : (
            <div className={styles.formBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Select Team Member</label>
                <select
                  className={styles.formInput}
                  value={applyTraineeId}
                  onChange={e => setApplyTraineeId(e.target.value)}
                >
                  {trainees.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Start Date</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={applyStartDate}
                  onChange={e => setApplyStartDate(e.target.value)}
                />
              </div>

              {applyModal.positionIds.length > 0 && applyStartDate && (
                <div className={styles.applyPreview}>
                  <div className={styles.previewTitle}>Preview</div>
                  <p className={styles.previewText}>
                    Creates <strong>{applyModal.positionIds.length} planned shifts</strong> spread from{' '}
                    <strong>{new Date(applyStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>{' '}
                    to approximately <strong>{applyEndDate}</strong>
                    {' '}(~{applyModal.estimatedWeeks} {applyModal.estimatedWeeks === 1 ? 'week' : 'weeks'}).
                  </p>
                </div>
              )}

              {applyModal.positionIds.length === 0 && (
                <div className={styles.applyWarning}>
                  ⚠️ This template has no positions assigned. Edit it first to add positions.
                </div>
              )}

              <div className={styles.formActions}>
                <Button variant="ghost" onClick={() => setApplyModal(null)}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={handleApply}
                  disabled={!applyTraineeId || !applyStartDate || applyModal.positionIds.length === 0}
                >
                  Apply Template
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </PageContainer>
  );
}
