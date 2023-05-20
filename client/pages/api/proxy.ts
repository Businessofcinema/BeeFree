// pages/api/proxy.ts
import { NextApiRequest, NextApiResponse } from 'next';
import EventSource from 'eventsource';


const EXTERNAL_URL = process.env.SERVER_URL || 'http://localhost:3001';

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query: { endpoint, url } } = req;

  if (endpoint !== 'list' && endpoint !== 'sync') {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  if (endpoint == 'sync' && !url) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    let req_url = `${EXTERNAL_URL}/${endpoint}`;
    if (url) {
        req_url += `?url=${encodeURIComponent(url as string)}`;
    }

    if (endpoint == 'sync') {
        // Set necessary response headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Create a new EventSource instance
        const eventSource = new EventSource(req_url);

        // Set up a message listener and proxy the events to the client
        eventSource.onmessage = (event: any) => {
            res.write(`data: ${event.data}\n\n`);
        };

        // Set up error handling
        eventSource.onerror = (error: any) => {
            console.error('Error in SSE proxy:', error);
            res.write(`data: ${ {eventType: "error", event: JSON.stringify(error)} }\n\n`);
            eventSource.close();
        };

        // Clean up when the client closes the connection
        req.on('close', () => {
            eventSource.close();
            res.end();
        });
    } else {
        const response = await fetch(req_url);
        const data = await response.json();
        res.status(200).json(data);
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

export default proxy;
