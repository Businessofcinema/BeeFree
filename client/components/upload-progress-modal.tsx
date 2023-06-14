// UploadProgressModal.tsx
import React, { useState } from 'react';
import styles from './upload-progress-modal.module.css';
import Modal from 'react-modal';

interface UploadProgressModalProps {
  percentProgress: number;
  videosUploaded: number;
  videosUploadFailed: number;
  videosDownloadFailed: number;
  currentState: string;
  totalVideos: number;
}

Modal.setAppElement('#__next'); // assuming your app root ID is "__next"

const UploadProgressModal: React.FC<UploadProgressModalProps> = (props) => {
  const [modalIsOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <button className={styles.button} onClick={openModal}>
        ℹ️ Details
      </button>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        <div className={styles.modalHeader}>
          <h2>Channel Upload Details</h2>
          <button className={styles.closeButton} onClick={closeModal}>×</button>
        </div>
        <p><b>Status:</b>&nbsp;{props.currentState} • {props.percentProgress}%</p>
        <div className={styles.modalDetails}>
          <p>Total videos: {props.totalVideos}</p>
          <p>Videos uploaded: {props.videosUploaded}</p>
          <p>Videos upload failed: {props.videosUploadFailed}</p>
          <p>Videos download failed: {props.videosDownloadFailed}</p>
        </div>
      </Modal>
    </div>
  );
}

export default UploadProgressModal;
