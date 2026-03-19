import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) {
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : '';
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${sizeClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
