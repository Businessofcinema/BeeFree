// VideoThumbnail.tsx
import React from 'react';
import styles from './video-thumbnail.module.css';

interface VideoThumbnailProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: Date;
  status: string;
}

const handleClick = (id: string) => {
  window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
};

const formatDate = (date: Date) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  // @ts-ignore
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  id,
  title,
  thumbnailUrl,
  publishedAt,
  status,
}) => {
  return (
    <div className={styles.linkWrap} onClick={() => handleClick(id)}>
      <div className={styles.thumbnailWrapper}>
        <img
          className={styles.thumbnailImage}
          src={thumbnailUrl}
          alt={`Thumbnail of ${title}`}
        />
      </div>
      <h3 className={styles.videoTitle}>{title}</h3>
      <div className={styles.videoInfo}>
        <span>Published on {formatDate(new Date(publishedAt))}</span>
        <span>Status: <b className={`titlecase ${status == 'private' ? 'red-font' : ''}`}>{status}</b></span>
      </div>
    </div>
  );
};

export default VideoThumbnail;
