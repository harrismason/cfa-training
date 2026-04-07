import { QRCodeSVG } from 'qrcode.react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { ROLE_COLORS } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import styles from './QRModal.module.css';

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function QRModal({ trainee, isOpen, onClose }) {
  const { preferences } = useAppContext();

  if (!isOpen || !trainee) return null;

  const baseUrl = preferences.checkInBaseUrl?.trim();
  const origin = baseUrl || window.location.origin;
  const checkInUrl = `${origin}/checkin?traineeId=${trainee.id}`;
  const needsUrl = !baseUrl && window.location.origin.startsWith('file:');

  const roleColor = ROLE_COLORS[trainee.role] || ROLE_COLORS['Team Member'];

  function handlePrint() {
    window.print();
  }

  return (
    <Modal title="Check-In QR Code" isOpen={true} onClose={onClose}>
      <div className={styles.body}>
        {needsUrl && (
          <div className={styles.urlWarning}>
            <strong>⚠ Check-In URL not configured.</strong> This QR code uses a local file path
            that phones can't open. Go to <em>Settings → QR Check-In</em> and enter your
            app's web URL so scanned QR codes actually reach the check-in page.
          </div>
        )}
        <div className={styles.printArea} id="qr-print-area">
          <div className={styles.qrCard}>
            <div className={styles.traineeHeader}>
              <div className={styles.avatar} style={{ backgroundColor: roleColor.avatar }}>
                {trainee.photoUrl
                  ? <img src={trainee.photoUrl} alt={trainee.name} className={styles.avatarImg} />
                  : getInitials(trainee.name)
                }
              </div>
              <div>
                <div className={styles.traineeName}>{trainee.name}</div>
                <span className={styles.roleTag} style={{ background: roleColor.bg, color: roleColor.text }}>
                  {trainee.role}
                </span>
              </div>
            </div>

            <div className={styles.qrWrap}>
              <QRCodeSVG
                value={checkInUrl}
                size={220}
                bgColor="#ffffff"
                fgColor="#1A1A1A"
                level="M"
              />
            </div>

            <p className={styles.qrHint}>Scan to log a training shift</p>
            <p className={styles.qrUrl}>{checkInUrl}</p>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handlePrint}>🖨 Print QR Code</Button>
        </div>
      </div>
    </Modal>
  );
}
