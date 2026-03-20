import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import TraineeList from '../components/trainees/TraineeList';
import TraineeForm from '../components/trainees/TraineeForm';
import TraineeReport from '../components/trainees/TraineeReport';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Button from '../components/shared/Button';
import styles from './TraineesPage.module.css';

export default function TraineesPage() {
  const { trainees, addTrainee, updateTrainee, deleteTrainee } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState(null);
  const [deletingTrainee, setDeletingTrainee] = useState(null);
  const [reportTrainee, setReportTrainee] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = trainees.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

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
        <Button variant="primary" onClick={handleAdd}>+ Add Trainee</Button>
      </div>

      {trainees.length > 0 && (
        <div className={styles.searchBar}>
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
    </PageContainer>
  );
}
