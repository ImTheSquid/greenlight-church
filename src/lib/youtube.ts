const YOUTUBE_API_KEY = import.meta.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = import.meta.env.YOUTUBE_CHANNEL_ID;

export async function getLiveVideo(): Promise<{ videoId: string } | null> {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) return null;
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "id");
    url.searchParams.set("channelId", YOUTUBE_CHANNEL_ID);
    url.searchParams.set("eventType", "live");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("key", YOUTUBE_API_KEY);
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      items?: { id?: { videoId?: string } }[];
    };
    const videoId = data.items?.[0]?.id?.videoId;
    return videoId ? { videoId } : null;
  } catch {
    return null;
  }
}
