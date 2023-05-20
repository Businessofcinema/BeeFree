import { useState, useEffect } from 'react';
import styles from './channel-upload-button.module.css';
import { SERVER_URL } from './_constants';

type Props = {
  url: string;
  limit: number;
};

type Response = {
  jobId: string;
};

type EventSourceData = {
  totalVideos: number;
  totalVideosLimit: number;
  videosDownloaded: number;
  videosUploaded: number;
  videosDownloadFailed: number;
  videosUploadFailed: number;
};

let streamSource: any = null;

const ChannelUploadButton = ({ url, limit }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusChecking, setStatusChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/syncChannel?url=${url}&limit=${limit}`);
      const data: Response = await response.json();
      setJobId(data.jobId);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!jobId) return;

    if (!statusChecking) {
        setStatusChecking(true);
        streamSource = new EventSource(`${SERVER_URL}/syncChannel/${jobId}/status`);

        streamSource.addEventListener('open', (e: any) => {
            // successful connection.
            console.log('Channel Upload Status: Open success');
        })

        streamSource.onmessage = (event: any) => {
            const data: EventSourceData = JSON.parse(event.data);
            console.log(data)
            let total = data.totalVideosLimit === -1 ? data.totalVideos : data.totalVideosLimit;
            if (total < 1) total = 1;
            const percentage = Math.round(((data.videosUploaded+data.videosDownloaded+data.videosDownloadFailed) / total) * 50);
            setProgress(percentage);
            setUploaded(data.videosUploaded);
            // TODO: Display complete
            // if ((data.videosUploaded + data.videosDownloadFailed + data.videosUploadFailed) === total && data.videosUploaded !== 0) {
            //     streamSource.close();
            //     setIsLoading(false);
            //     setStatusChecking(false);
            // }
        }

        streamSource.onerror = (e: any) => {
            // error occurred
            console.log(e);
            streamSource.close();
        }
    }

    return () => streamSource.close();
  }, [jobId]);

  return (
    <button className={styles.button} disabled={isLoading} onClick={handleClick}>
      {isLoading ? (
        <>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: `${progress}%` }}>
              {progress}%
            </div>
          </div>
          <div className={styles.loadingText}>Uploading Channel ({uploaded} uploaded of {limit} videos)</div>
        </>
      ) : (
        'Upload Channel'
      )}
    </button>
  );
};

export default ChannelUploadButton;
