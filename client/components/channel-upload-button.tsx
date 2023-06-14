import { useState, useEffect } from 'react';
import styles from './channel-upload-button.module.css';
import { SERVER_URL } from './_constants';
import UploadProgressModal from './upload-progress-modal';

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
let defaultJobMap: any = {"https://www.youtube.com/channel/UCynqorMudiQmtI6xfnttQNg": 8};

const ChannelUploadButton = ({ url, limit }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [statusChecking, setStatusChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [totalVideos, setTotalVideos] = useState<number>();
  const [eventData, setEventData] = useState<EventSourceData>();

  const getJobMap = () => {
    try {
      const localMap = JSON.parse(localStorage.getItem("jobChannelMap")+"")
      if (typeof(localMap) == 'object') {
        return localMap
      }
    } finally {
      return defaultJobMap
    }
  };

  const updateJobMap = (url: string, jid: string) => {
    let currentMap: any = getJobMap()
    currentMap[url] = jid
    localStorage.setItem("jobChannelMap", JSON.stringify(currentMap))
  };

  const handleClick = async () => {
    if (!isLoading && !isDone) {
      setIsLoading(true);
      try {
        const response = await fetch(`${SERVER_URL}/syncChannel?url=${url}&limit=${limit}`);
        const data: Response = await response.json();
        setJobId(data.jobId);
        // Stash jobId to prevent multiple submissions and to show status
        updateJobMap(url, data.jobId)
      } catch (error) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    if (!jobId) {
      const jobChannelMap: any = getJobMap()
      console.log("jobChannelMap", jobChannelMap)
      if (jobChannelMap.hasOwnProperty(url)) {
        let prevJobId = jobChannelMap[url]
        setJobId(prevJobId)
      }
    }
  }, [url])

  useEffect(() => {
    if (!jobId) return;

    if (!statusChecking) {
        setStatusChecking(true)
        setIsLoading(true)
        streamSource = new EventSource(`${SERVER_URL}/syncChannel/${jobId}/status`)

        streamSource.addEventListener('open', (e: any) => {
            // successful connection.
            console.log('Channel Upload Status: Open success');
        })

        streamSource.onmessage = (event: any) => {
            const data: EventSourceData = JSON.parse(event.data);
            console.log("onmessage:", data)
            let total = data.totalVideosLimit === -1 ? data.totalVideos : Math.min(data.totalVideosLimit, data.totalVideos);
            if (total < 1) total = 1;
            console.log(data.totalVideosLimit, total)
            setTotalVideos(total)
            const percentage = Math.round(((data.videosUploaded+data.videosDownloaded+data.videosDownloadFailed) / total) * 50);
            setProgress(Math.min(percentage, 100)); // ensure percentage does not exceed 100
            setUploaded(data.videosUploaded);
            setEventData(data);
            // TODO: Display complete
            let finished = data.videosUploaded + data.videosDownloadFailed + data.videosUploadFailed
            if (finished >= total && data.videosUploaded !== 0) {
                streamSource.close();
                setIsLoading(false);
                setStatusChecking(false);
                setIsDone(true);
            }
        }

        streamSource.onerror = (e: any) => {
            // error occurred
            console.log(e);
            streamSource.close();
        }
    }

    return () => streamSource.close();
  }, [jobId]);

  const uploadMessage: string = isDone ? 'Complete' : 'Uploading Channel'

  return (
    <>
      <button
        className={styles.button}
        disabled={isLoading}
        onClick={handleClick}
      >
        {(isLoading || isDone) ? (
          <>
            <div className={styles.loadingText}>
              {uploadMessage} ({uploaded} uploaded of {limit} videos)
            </div>
            {!isDone && (
              <div className={styles.progressBar}>
                <div
                  className={styles.progress}
                  style={{ width: `${progress}%` }}
                >
                  {progress}%
                </div>
              </div>
            )}
          </>
        ) : (
          "Upload Channel"
        )}
        <UploadProgressModal
          percentProgress={isDone ? 100 : progress}
          videosUploaded={uploaded}
          totalVideos={totalVideos || 0}
          videosUploadFailed={eventData?.videosUploadFailed || 0}
          videosDownloadFailed={eventData?.videosDownloadFailed || 0}
          currentState={isDone ? "Process Complete" : "Processing"}
        ></UploadProgressModal>
      </button>
    </>
  );
};

export default ChannelUploadButton;
