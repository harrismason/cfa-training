import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import TraineeList from '../components/trainees/TraineeList';
import TraineeForm from '../components/trainees/TraineeForm';
import TraineeReport from '../components/trainees/TraineeReport';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Button from '../components/shared/Button';
import CsvImportModal from '../components/trainees/CsvImportModal';
import QRModal from '../components/trainees/QRModal';
import CopyTrainingPlanModal from '../components/trainees/CopyTrainingPlanModal';
import styles from './TraineesPage.module.css';

export default function TraineesPage() {
  const { trainees, addTrainee, updateTrainee, deleteTrainee } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState(null);
  const [deletingTrainee, setDeletingTrainee] = useState(null);
  const [reportTrainee, setReportTrainee] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [importOpen, setImportOpen] = useState(false);
  const [qrTrainee, setQrTrainee] = useState(null);
  const [copyPlanTrainee, setCopyPlanTrainee] = useState(null);

  const filtered = trainees
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => {
      if (statusFilter === 'all') return true;
      return (t.statusTag || '') === statusFilter;
    });

  function handleAdd() {
    setEditingTrainee(null);
    setModalOpen(true);
  }

  function handleEdit(trainee) {
    setEditingTrainee(trainee);
    setModalOpen(true);
  }

  function handleSubmit(values) {
    if (editingTrainee) {
      updateTrainee(editingTrainee.id, values);
    } else {
      addTrainee(values);
    }
    setModalOpen(false);
    setEditingTrainee(null);
  }

  function handleDelete(trainee) {
    setDeletingTrainee(trainee);
  }

  function confirmDelete() {
    deleteTrainee(deletingTrainee.id);
    setDeletingTrainee(null);
  }

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Trainees</h1>
          <p className={styles.subtitle}>{trainees.length} team member{trainees.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={() => setImportOpen(true)}>↑ Import CSV</Button>
          <Button variant="primary" onClick={handleAdd}>+ Add Trainee</Button>
        </div>
      </div>

      {trainees.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.statusPills}>
            {[
              { key: 'all',          label: 'All' },
              { key: 'on_track',     label: 'On Track' },
              { key: 'needs_review', label: 'Needs Review' },
              { key: 'on_hold',      label: 'On Hold' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.statusPill} ${statusFilter === key ? styles.statusPillActive : ''}`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <TraineeList
        trainees={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onReport={(t) => setReportTrainee(t)}
        onQR={(t) => setQrTrainee(t)}
        onCopyPlan={(t) => setCopyPlanTrainee(t)}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTrainee(null); }}
        title={editingTrainee ? 'Edit Trainee' : 'Add Trainee'}
      >
        <TraineeForm
          initialValues={editingTrainee || {}}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditingTrainee(null); }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingTrainee}
        onClose={() => setDeletingTrainee(null)}
        onConfirm={confirmDelete}
        title="Delete Trainee"
        message={`Are you sure you want to delete "${deletingTrainee?.name}"? This will also remove all their training records.`}
      />

      <TraineeReport
        isOpen={!!reportTrainee}
        onClose={() => setReportTrainee(null)}
        trainee={reportTrainee}
      />

      <CsvImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(rows) => { rows.forEach(r => addTrainee(r)); }}
      />

      <QRModal
        trainee={qrTrainee}
        isOpen={!!qrTrainee}
        onClose={() => setQrTrainee(null)}
      />

      <CopyTrainingPlanModal
        sourceTrainee={copyPlanTrainee}
        isOpen={!!copyPlanTrainee}
        onClose={() => setCopyPlanTrainee(null)}
      />
    </PageContainer>
  );
}
