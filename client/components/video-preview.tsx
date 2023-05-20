// VideoPreview.tsx
import React from 'react';
import styles from './video-preview.module.css';
import { VideoMetadata } from './_interfaces';

interface VideoPreviewProps {
  video: VideoMetadata;
  onClick: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ video, onClick }) => {
  return (
    <div className={styles.container} onClick={onClick}>
      <video className={styles.video} src={video.url} preload="none" poster={video.thumbnail} />
      <div className={styles.title}>{video.title}</div>
    </div>
  );
};

export default VideoPreview;
