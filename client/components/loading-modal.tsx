// LoadingModal.tsx
import React, { useState, useEffect } from "react";
import styles from "./loading-modal.module.css";

interface LoadingModalProps {
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  progress?: number;
  hasError?: boolean;
}

const LoadingModal: React.FC<LoadingModalProps> = ({
  isLoading,
  onCancel,
  onConfirm,
  title,
  message,
  progress,
  hasError
}) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [confirmButtonEnabled, setConfirmButtonEnabled] = useState(false);

  useEffect(() => {
    if (isLoading && !progress) {
      setLoadingProgress(0);
      setConfirmButtonEnabled(false);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setConfirmButtonEnabled(true);
            return prev;
          }
          return prev + 1;
        });
      }, 50);
    }
  }, [isLoading]);

  useEffect(() => {
    if (progress && progress > 0) {
      if (progress >= 100) {
        setConfirmButtonEnabled(true);
      } else {
        setConfirmButtonEnabled(false);
      }
    }
  }, [progress]);

  if (!isLoading) {
    return null;
  }

  console.log('progresslog:', message)

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={`${styles.loadingBar} ${hasError && styles.hasError}`}>
          <div
            className={styles.loadingBarProgress}
            style={{ width: `${progress ? progress : loadingProgress}%` }}
          />
        </div>
        <div className={styles.buttons}>
          {!confirmButtonEnabled && (<button className={styles.button+" "+styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>)}
          <button
            className={styles.button+" "+styles.confirmButton}
            onClick={onConfirm}
            disabled={!confirmButtonEnabled}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
