import Modal from './Modal';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm', message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>Delete</Button>
      </div>
    </Modal>
  );
}
