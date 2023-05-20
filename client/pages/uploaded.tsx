import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Layout from "../components/layout"
import AccessDenied from "../components/access-denied"
import VideoPreview from "../components/video-preview"
import { PaginationProps, VideoMetadata } from "../components/_interfaces"
import ModalVideoPlayer from "../components/modal-video-player"
import { SERVER_URL } from "../components/_constants"
import PaginationBar from "../components/pagination-bar"


export default function UploadedPage() {

  const { data: session } = useSession()
  const [list, setList] = useState<VideoMetadata[]>()
  const [targetPage, setTargetPage] = useState<number>(1)
  const [pagination, setPagination] = useState<PaginationProps>({currentPage: 1, pageSize: 0, totalItems: 0, totalPages: 0})
  const [loading, setLoading] = useState<boolean>(false)
  const [activeVideo, setActiveVideo] = useState<VideoMetadata | null>()

  // Fetch content from protected route
  useEffect(() => {
    const fetchList = async () => {
      setLoading(true)

      // const res = await fetch('/api/proxy?endpoint=list')
      // const res = await fetch('https://beefreecommunity.org/list')
      try {
        const res = await fetch(SERVER_URL + '/list?page=' + targetPage)
        const json: any = await res.json()
        const uploads: VideoMetadata[] = json['uploads']
        const pageObj: PaginationProps = json['pagination']
        // shape: [cid, name, size, url]
        if (uploads.length > 0 && uploads[0]?.url) {
          setList(uploads)
        } else {
          setList([])
        }
        if (pageObj) {
          setPagination(pageObj)
        }
      } catch (e) {
        console.log("Error fetching list:", e)
      } finally {
        setLoading(false)
      }
    };
    // get first page or new page
    if (!list || targetPage !== pagination?.currentPage) {
      setList([])
      fetchList()
    }
  }, [session, targetPage])


  // If no session exists, display access denied message
  if (!session) {
    return (
      <Layout>
        <AccessDenied />
      </Layout>
    );
  }

  // If session exists, display content
  return (
    <Layout>
      <h2>Uploaded Videos</h2>
      <div className="row">
        { loading && <><br/><p>Loading...</p></>}
        {list && list.slice(0,200).map((video: any) => {
            return (
              <div className='col-33' key={video.cid}>
                {/* <h3>{video.name}</h3> */}
                {/* <a href={video.url} target="_blank">Open</a> */}
                <VideoPreview video={video} onClick={() => setActiveVideo(video)} />
              </div>
            );
          })}
        { !loading && list?.length == 0 && (<p><br/>No uploaded videos found.</p>)}
        { activeVideo && (<ModalVideoPlayer video={activeVideo} onClose={() => setActiveVideo(null)} />)}
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
