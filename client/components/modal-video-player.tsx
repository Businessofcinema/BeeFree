// ModalVideoPlayer
import React from 'react';
import styles from './modal-video-player.module.css';
import { VideoMetadata } from './_interfaces';

interface ModalVideoPlayerProps {
  video: VideoMetadata;
  onClose: () => void;
}

const ModalVideoPlayer: React.FC<ModalVideoPlayerProps> = ({ video, onClose }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal}>
        <video className={styles.video} src={video.url} controls autoPlay />
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2 className={styles.title}>{video.title}</h2>
        {video?.description && (<p className={styles.description}>{video.description}</p>)}
      </div>
    </div>
  );
};

export default ModalVideoPlayer;
