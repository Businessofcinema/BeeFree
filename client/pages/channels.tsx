import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Layout from "../components/layout"
import AccessDenied from "../components/access-denied"
import VideoThumbnail from "../components/video-thumbnail"
import UploadButton from "../components/upload-button"
import LoadingModal from "../components/loading-modal"
import ChannelUploadButton from "../components/channel-upload-button"
import { SERVER_URL } from "../components/_constants"
import PaginationBar from "../components/pagination-bar"
import { PaginationProps } from "../components/_interfaces"

let streamSource: any = null;

export default function ChannelsPage() {
  const actionTitle = "Uploading Video";

  const { data: session } = useSession()
  const [channel, setChannel] = useState<any>()
  const [uploadsID, setUploadsID] = useState<string>("")
  const [content, setContent] = useState<any[]>()
  const [youtubeCalled, setYoutubeCalled] = useState<boolean>(false)
  const [uploadMap, setUploadMap] = useState<any>({})
  const [uploading, setUploading] = useState<boolean>(false)
  const [uploadEvent, setUploadEvent] = useState<any>()
  const [progressLog, setProgressLog] = useState("")
  const [progress, setProgress] = useState(5)
  const [uploadError, setUploadError] = useState(false)
  const [pageTokens, setPageTokens] = useState<string[]>([])
  const [targetPage, setTargetPage] = useState<number>(1)
  const [pagination, setPagination] = useState<PaginationProps>({currentPage: 1, pageSize: 0, totalItems: 0, totalPages: 0})

  const displayPayload = (payload: any) => {
    if (payload.event && payload.event.title) {
      setProgressLog(payload.event.title);
    } else if (payload.event) {
      setProgressLog(payload.event);
    } else {
      setProgressLog('Error: Stream encountered an issue');
    }
    setUploadEvent(payload);
  };

  const loadVideo = (videoId: string, uploadedUrl?: string) => {
    if (uploadedUrl) {
      window.open(uploadedUrl, '_blank');
      return;
    }
    // const url = "/api/proxy?endpoint=sync&url=https://www.youtube.com/watch?v=" + videoId;
    // const url = "https://beefreecommunity.org/sync?url=https://www.youtube.com/watch?v=" + videoId;
    const url = SERVER_URL + "/sync?url=https://www.youtube.com/watch?v=" + videoId;
    setUploading(true);

    if ('EventSource' in window) {
      streamSource = new EventSource(url); //, {withCredentials: true}
      setProgressLog("Starting upload");
      streamSource.addEventListener('open', (e: any) => {
        // successful connection.
        console.log('Open success');
      });
      streamSource.onmessage = (e: any) => {
        const payload = JSON.parse(e.data);
        displayPayload(payload);
        if (payload.eventType == 'videoUrl') {
          // Map new url to video list
          let newMap: any = {...uploadMap};
          newMap[videoId] = payload.event;
          setUploadMap(newMap);
          setProgress(100);
        }
        if (payload.eventType == 'done') {
          streamSource.close();
        }
      };
      streamSource.onerror = (e: any) => {
        // error occurred
        console.log(e);
        displayPayload({'eventType':'error','event':'Upload stream error encountered'})
        streamSource.close();
      };
    }
  };

  // Fetch content from protected route
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/channels');
      const json = await res.json();
      if (json.channels) {
        setChannel(json.channels[0]);
      }
      if (json.uploadsPlaylist) {
        setUploadsID(json.uploadsPlaylist);
      }
    };
    if (!youtubeCalled) {
      setYoutubeCalled(true);
      fetchData();
    }
  }, [session]);

  // Load videos
  // if (json.videos) {
  //   setContent(json.videos);
  // }

  // Load page of uploaded videos
  useEffect(() => {
    const fetchVideos = async () => {
      let url = `/api/playlist?id=${uploadsID}`
      if (targetPage != pagination.currentPage) {
        if (targetPage < pagination.currentPage) {
          // go back a page
          url += `&pageToken=${pageTokens[0]}`
        } else if (pageTokens[1]) {
          // go forward a page
          url += `&pageToken=${pageTokens[1]}`
        }
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.videos) {
        setContent(json.videos);
      }
      if (json.pageInfo) {
        let {totalResults, resultsPerPage} = json.pageInfo;
        let newInfo = {...pagination}
        newInfo.totalItems = totalResults
        newInfo.pageSize = resultsPerPage
        newInfo.totalPages = Math.ceil(totalResults/resultsPerPage)
        newInfo.currentPage = targetPage
        setPagination(newInfo)
      }
      if (json.pageTokens) {
        setPageTokens(json.pageTokens)
      } else {
        setPageTokens([])
      }
    };
    if (uploadsID) {
      fetchVideos();
    }
  }, [uploadsID, targetPage]);

  useEffect(() => {
    if (uploadEvent) {
      if (['download','info','youtube'].indexOf(uploadEvent.eventType) > -1) {
        if (progress < 60) {
          setProgress(progress + 10)
        }
      }
      if (uploadEvent.eventType == 'upload') {
        if (progress < 80) {
          setProgress(progress + 20)
        }
      }
      if (uploadEvent.eventType == 'error') {
        setUploadError(true)
        setProgress(100)
      }
    }
  }, [uploadEvent])

  // If no session exists, display access denied message
  if (!session) {
    return (
      <Layout>
        <AccessDenied />
      </Layout>
    );
  }

  const uploadCleanup = () => {
    if (streamSource) {
      streamSource.close();
      streamSource = null;
    }
    setProgress(5);
    setProgressLog("");
  }

  const handleCancel = () => {
    console.log("Upload canceled by user");
    uploadCleanup();
    setUploading(false);
  }

  const handleConfirm = () => {
    console.log("Uploaded, modal closed");
    uploadCleanup();
    setUploading(false);
  }

  const channelUrl = 'https://www.youtube.com/channel/' + channel?.id;

  // If session exists, display content
  return (
    <Layout>
      <h2>
        <a href={channelUrl} target='_blank'>
          {channel?.title}
        </a>{' '}
        Videos
      </h2>
      <ChannelUploadButton url={channelUrl} limit={5} />
      {channel && <p>{channel?.description}</p>}
      <LoadingModal
        title={actionTitle}
        isLoading={uploading}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        message={progressLog}
        progress={progress}
        hasError={uploadError}
      />
      <div className="row">
        {content && content.map((video: any) => {
            return (
              <div className='col-33' key={video.id}>
                <VideoThumbnail {...video} />
                {video.status !== 'private' && (
                  <UploadButton onClick={() => loadVideo(video.id, uploadMap[video.id])} uploadedUrl={uploadMap[video.id]} />
                )}
              </div>
            );
          })}
      </div>
      <div className="row">
        <PaginationBar onPageChange={(p) => setTargetPage(p)}
            currentPage={pagination.currentPage}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize} />
      </div>
    </Layout>
  );
}
