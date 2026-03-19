import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import PositionList from '../components/positions/PositionList';
import PositionForm from '../components/positions/PositionForm';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Button from '../components/shared/Button';
import { CATEGORIES } from '../constants/theme';
import styles from './PositionsPage.module.css';

const ALL = 'All';

export default function PositionsPage() {
  const { positions, addPosition, updatePosition, deletePosition } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [deletingPosition, setDeletingPosition] = useState(null);
  const [activeCategory, setActiveCategory] = useState(ALL);

  const filtered = activeCategory === ALL
    ? positions
    : positions.filter((p) => p.category === activeCategory);

  function handleAdd() {
    setEditingPosition(null);
    setModalOpen(true);
  }

  function handleEdit(position) {
    setEditingPosition(position);
    setModalOpen(true);
  }

  function handleSubmit(values) {
    if (editingPosition) {
      updatePosition(editingPosition.id, values);
    } else {
      addPosition(values);
    }
    setModalOpen(false);
    setEditingPosition(null);
  }

  function confirmDelete() {
    deletePosition(deletingPosition.id);
    setDeletingPosition(null);
  }

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Positions</h1>
          <p className={styles.subtitle}>{positions.length} position{positions.length !== 1 ? 's' : ''} defined</p>
        </div>
        <Button variant="primary" onClick={handleAdd}>+ Add Position</Button>
      </div>

      <div className={styles.categoryTabs}>
        {[ALL, ...CATEGORIES].map((cat) => {
          const count = cat === ALL ? positions.length : positions.filter((p) => p.category === cat).length;
          return (
            <button
              key={cat}
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              {count > 0 && <span className={styles.tabCount}>{count}</span>}
            </button>
          );
        })}
      </div>

      <PositionList
        positions={filtered}
        onEdit={handleEdit}
        onDelete={setDeletingPosition}
        onAdd={handleAdd}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingPosition(null); }}
        title={editingPosition ? 'Edit Position' : 'Add Position'}
      >
        <PositionForm
          initialValues={editingPosition || {}}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditingPosition(null); }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingPosition}
        onClose={() => setDeletingPosition(null)}
        onConfirm={confirmDelete}
        title="Delete Position"
        message={`Are you sure you want to delete "${deletingPosition?.name}"? This will remove all training records for this position.`}
      />
    </PageContainer>
  );
}
