// pages/api/channels.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { google } from "googleapis";

const youtube = google.youtube("v3");

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session: any = await getSession({ req });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Authorize access
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_ID,
      process.env.GOOGLE_SECRET
    );
    auth.setCredentials({ access_token: session.accessToken });
    const response: any = await youtube.channels.list({
        auth,
        mine: true,
        part: ["snippet", "contentDetails"],
      });

    // Get uploads playlist ID
    const playlistId = response.data.items[0].contentDetails.relatedPlaylists.uploads;
    const channels =  response.data.items?.map((item: any) => ({
        id: item.id!,
        title: item.snippet?.title!,
        description: item.snippet?.description!,
        thumbnail: item.snippet?.thumbnails?.high?.url!,
    })) || [];

    res.status(200).json({ channels, uploadsPlaylist: playlistId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default handler;
