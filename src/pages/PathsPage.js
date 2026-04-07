import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import Modal from '../components/shared/Modal';
import Button from '../components/shared/Button';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { STATUS } from '../constants/theme';
import styles from './PathsPage.module.css';

function PathForm({ isOpen, onClose, onSubmit, initialValues = {}, positions }) {
  const EMPTY = { name: '', description: '', positionIds: [] };
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });

  function togglePos(id) {
    setValues(prev => ({
      ...prev,
      positionIds: prev.positionIds.includes(id)
        ? prev.positionIds.filter(x => x !== id)
        : [...prev.positionIds, id],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.name.trim() || values.positionIds.length === 0) return;
    onSubmit(values);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialValues.id ? 'Edit Path' : 'Create Training Path'}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>Path Name *</label>
        <input className={styles.input} value={values.name} onChange={e => setValues(p => ({...p, name: e.target.value}))} placeholder="e.g. New Hire Path" required />
        <label className={styles.label}>Description</label>
        <input className={styles.input} value={values.description} onChange={e => setValues(p => ({...p, description: e.target.value}))} placeholder="Optional description" />
        <label className={styles.label}>Positions in this path ({values.positionIds.length} selected) *</label>
        <div className={styles.positionGrid}>
          {positions.map(p => (
            <label key={p.id} className={`${styles.posCheck} ${values.positionIds.includes(p.id) ? styles.posChecked : ''}`}>
              <input type="checkbox" checked={values.positionIds.includes(p.id)} onChange={() => togglePos(p.id)} style={{display:'none'}} />
              <span className={styles.posCat}>{p.category}</span>
              <span>{p.name}</span>
            </label>
          ))}
        </div>
        <div className={styles.formActions}>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={values.positionIds.length === 0}>Save Path</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function PathsPage() {
  const { paths, positions, trainees, addPath, updatePath, deletePath, deriveStatus, recordMap } = useAppContext();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPath, setEditingPath] = useState(null);
  const [deletingPath, setDeletingPath] = useState(null);
  const [expandedPath, setExpandedPath] = useState(null);

  const pathStats = useMemo(() => {
    return paths.map(path => {
      const pathPositions = path.positionIds
        .map(id => positions.find(p => p.id === id))
        .filter(Boolean);
      const total = trainees.length * pathPositions.length;
      let trained = 0;
      const traineeProgress = trainees.map(t => {
        let tTrained = 0;
        pathPositions.forEach(p => {
          const record = recordMap.get(`${t.id}::${p.id}`);
          const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
          const s = deriveStatus(t.id, p.id, required);
          if (s === STATUS.TRAINED || s === STATUS.NEEDS_RECERT) { tTrained++; trained++; }
        });
        return { trainee: t, trained: tTrained, total: pathPositions.length, pct: pathPositions.length > 0 ? Math.round((tTrained / pathPositions.length) * 100) : 0 };
      }).sort((a, b) => b.pct - a.pct);
      const overallPct = total > 0 ? Math.round((trained / total) * 100) : 0;
      return { path, pathPositions, traineeProgress, overallPct };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, positions, trainees, recordMap, deriveStatus]);

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Training Paths</h1>
          <p className={styles.subtitle}>{paths.length} path{paths.length !== 1 ? 's' : ''} defined</p>
        </div>
        <Button variant="primary" onClick={() => { setEditingPath(null); setFormOpen(true); }}>+ New Path</Button>
      </div>

      {paths.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🗺️</div>
          <p>No training paths yet. Create a path to group positions into a learning sequence.</p>
          <Button variant="secondary" onClick={() => setFormOpen(true)}>Create First Path</Button>
        </div>
      ) : (
        <div className={styles.pathList}>
          {pathStats.map(({ path, pathPositions, traineeProgress, overallPct }) => {
            const isExpanded = expandedPath === path.id;
            const completedTrainees = traineeProgress.filter(t => t.pct === 100).length;
            return (
              <div key={path.id} className={styles.pathCard}>
                <div className={styles.pathHeader}>
                  <div className={styles.pathInfo}>
                    <div className={styles.pathName}>{path.name}</div>
                    {path.description && <div className={styles.pathDesc}>{path.description}</div>}
                    <div className={styles.pathMeta}>
                      <span>{pathPositions.length} position{pathPositions.length !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{completedTrainees}/{trainees.length} trainees complete</span>
                    </div>
                  </div>
                  <div className={styles.pathRight}>
                    <div className={styles.pathPct}>{overallPct}%</div>
                    <div className={styles.pathActions}>
                      <button className={styles.iconBtn} onClick={() => setExpandedPath(isExpanded ? null : path.id)}>
                        {isExpanded ? '▴' : '▾'}
                      </button>
                      <button className={styles.iconBtn} onClick={() => { setEditingPath(path); setFormOpen(true); }}>✏️</button>
                      <button className={styles.iconBtn} onClick={() => setDeletingPath(path)}>🗑️</button>
                    </div>
                  </div>
                </div>
                <div className={styles.pathBarTrack}>
                  <div className={styles.pathBarFill} style={{ width: `${overallPct}%` }} />
                </div>
                {isExpanded && (
                  <div className={styles.pathDetail}>
                    <div className={styles.positionsRow}>
                      {pathPositions.map((p, i) => (
                        <span key={p.id} className={styles.posChip}>{i + 1}. {p.name}</span>
                      ))}
                    </div>
                    <table className={styles.traineeTable}>
                      <thead><tr><th>Trainee</th>{pathPositions.map(p => <th key={p.id}>{p.name}</th>)}<th>Progress</th></tr></thead>
                      <tbody>
                        {traineeProgress.map(({ trainee, pct }) => (
                          <tr key={trainee.id} className={pct === 100 ? styles.rowComplete : ''}>
                            <td className={styles.traineeName}>{trainee.name}</td>
                            {pathPositions.map(p => {
                              const record = recordMap.get(`${trainee.id}::${p.id}`);
                              const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
                              const s = deriveStatus(trainee.id, p.id, required);
                              return (
                                <td key={p.id} className={styles.statusCell}>
                                  {s === STATUS.TRAINED || s === STATUS.NEEDS_RECERT ? '✓' : s === STATUS.IN_PROGRESS ? '◐' : '○'}
                                </td>
                              );
                            })}
                            <td className={styles.pctCell}>{pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PathForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingPath(null); }}
        onSubmit={editingPath ? (data) => updatePath(editingPath.id, data) : addPath}
        initialValues={editingPath || {}}
        positions={positions}
      />
      <ConfirmDialog
        isOpen={!!deletingPath}
        onClose={() => setDeletingPath(null)}
        onConfirm={() => { deletePath(deletingPath.id); setDeletingPath(null); }}
        title="Delete Path"
        message={`Delete "${deletingPath?.name}"? Training records are not affected.`}
      />
    </PageContainer>
  );
}
