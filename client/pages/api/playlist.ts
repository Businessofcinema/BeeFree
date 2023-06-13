// pages/api/channels.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { google } from "googleapis";

const youtube = google.youtube("v3");

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session: any = await getSession({ req });
  const playlistId = req.query["id"];

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!playlistId) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  try {
    // Authorize access
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_ID,
      process.env.GOOGLE_SECRET
    );
    auth.setCredentials({ access_token: session.accessToken });

    let playlistParams = <any>{
        auth,
        playlistId: playlistId,
        part: ["snippet", "status"],
        maxResults: 30,
      }
    if (req.query?.pageToken) {
        playlistParams.pageToken = req.query.pageToken
    }

    // Get videos from "Uploads" playlist
    // API doc: https://developers.google.com/youtube/v3/docs/playlistItems/list
    const videoRes: any = await youtube.playlistItems.list(playlistParams);

    const videos = videoRes.data.items?.map((item: any) => ({
      id: item.snippet.resourceId?.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url,
      publishedAt: item.snippet.publishedAt,
      status: item.status.privacyStatus,
    }));
    const {pageInfo, prevPageToken, nextPageToken } = videoRes.data;

    res.status(200).json({ videos, pageInfo: videoRes.data.pageInfo, pageTokens: [prevPageToken, nextPageToken] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default handler;
