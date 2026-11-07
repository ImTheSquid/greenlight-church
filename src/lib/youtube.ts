import { getPlaylistThumbnail } from "./youtube-thumbnail"
import { getArchivedAlbum } from "./albums"

const YOUTUBE_API_KEY = import.meta.env.YOUTUBE_API_KEY
const YOUTUBE_CHANNEL_ID = import.meta.env.YOUTUBE_CHANNEL_ID

export async function getShowVideo(
	windowStart: number,
	windowEnd: number,
	now = Date.now(),
): Promise<{ videoId: string } | null> {
	if (now < windowStart || now >= windowEnd) return null
	if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) return null
	try {
		for (const eventType of ["live", "completed"] as const) {
			const url = new URL("https://www.googleapis.com/youtube/v3/search")
			url.searchParams.set("part", "snippet")
			url.searchParams.set("channelId", YOUTUBE_CHANNEL_ID)
			url.searchParams.set("eventType", eventType)
			url.searchParams.set("type", "video")
			url.searchParams.set("order", "date")
			url.searchParams.set("maxResults", eventType === "live" ? "1" : "10")
			url.searchParams.set("key", YOUTUBE_API_KEY)
			const res = await fetch(url)
			if (!res.ok) return null
			const data = (await res.json()) as {
				items?: { id?: { videoId?: string } }[]
			}
			const videoIds = (data.items ?? [])
				.map(({ id }) => id?.videoId)
				.filter((id): id is string => Boolean(id))
			if (eventType === "live") {
				if (videoIds[0]) return { videoId: videoIds[0] }
				continue
			}
			if (!videoIds.length) return null

			// Recordings can be published long before the show is scheduled.
			// Match the actual broadcast start, not the video's publication date.
			const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos")
			videosUrl.searchParams.set("part", "liveStreamingDetails")
			videosUrl.searchParams.set("id", videoIds.join(","))
			videosUrl.searchParams.set("key", YOUTUBE_API_KEY)
			const videosRes = await fetch(videosUrl)
			if (!videosRes.ok) return null
			const videos = (await videosRes.json()) as {
				items?: {
					id: string
					liveStreamingDetails?: { actualStartTime?: string }
				}[]
			}
			const recording = (videos.items ?? [])
				.map(({ id, liveStreamingDetails }) => ({
					videoId: id,
					startedAt: Date.parse(liveStreamingDetails?.actualStartTime ?? ""),
				}))
				.filter(({ startedAt }) => startedAt >= windowStart && startedAt <= now)
				.sort((left, right) => right.startedAt - left.startedAt)[0]
			if (recording) return { videoId: recording.videoId }
		}
		return null
	} catch {
		return null
	}
}

export type ArchivedShow = {
	title: string
	number: string
	playlistId: string
	watchUrl: string
	compressedUrl: string
	compressedSize: string
	losslessUrl: string
	losslessSize: string
	thumbnailUrl: string | null
	date: string
}

export async function getArchivedShows(): Promise<ArchivedShow[]> {
	if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) return []

	try {
		const url = new URL("https://www.googleapis.com/youtube/v3/playlists")
		url.searchParams.set("part", "snippet")
		url.searchParams.set("channelId", YOUTUBE_CHANNEL_ID)
		url.searchParams.set("maxResults", "50")
		url.searchParams.set("key", YOUTUBE_API_KEY)

		const res = await fetch(url)
		if (!res.ok) return []

		const data = (await res.json()) as {
			items?: {
				id: string
				snippet: {
					title: string
					thumbnails?: {
						default?: { url: string }
						medium?: { url: string }
						high?: { url: string }
						standard?: { url: string }
						maxres?: { url: string }
					}
				}
			}[]
		}

		const candidates = await Promise.all(
			(data.items ?? [])
				.filter(({ snippet }) =>
					snippet.title.toUpperCase().startsWith("GREEN LIGHT"),
				)
				.map(async ({ id, snippet }) => {
					const numberMatch = snippet.title.match(
						/GREEN LIGHT[^0-9]*(\d+)/i,
					)
					const number = numberMatch?.[1]?.padStart(3, "0") ?? ""
					const slug = snippet.title
						.toLowerCase()
						.trim()
						.replace(/\s+/g, "-")
					const album = await getArchivedAlbum(slug)
					if (!album) return null

					const thumbnailPromise = getPlaylistThumbnail(id)
					const dateStr = await (async () => {
						try {
							const itemsUrl = new URL(
								"https://www.googleapis.com/youtube/v3/playlistItems",
							)
							itemsUrl.searchParams.set("part", "contentDetails")
							itemsUrl.searchParams.set("playlistId", id)
							itemsUrl.searchParams.set("maxResults", "1")
							itemsUrl.searchParams.set("key", YOUTUBE_API_KEY)

							const itemsRes = await fetch(itemsUrl)
							if (!itemsRes.ok) return ""
							const itemsData = (await itemsRes.json()) as {
								items?: {
									contentDetails?: { videoPublishedAt?: string }
								}[]
							}
							const videoPublishedAt =
								itemsData.items?.[0]?.contentDetails?.videoPublishedAt
							if (!videoPublishedAt) return ""

							const videoDate = new Date(videoPublishedAt)
							videoDate.setUTCDate(videoDate.getUTCDate() - 1)
							return videoDate.toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
								year: "numeric",
								timeZone: "UTC",
							})
						} catch {
							return ""
						}
					})()

					return {
						title: snippet.title,
						number,
						playlistId: id,
						watchUrl: `https://www.youtube.com/playlist?list=${id}`,
						...album,
						date: dateStr,
						thumbnailUrl:
							(await thumbnailPromise) ??
							snippet.thumbnails?.maxres?.url ??
							snippet.thumbnails?.standard?.url ??
							snippet.thumbnails?.high?.url ??
							snippet.thumbnails?.medium?.url ??
							snippet.thumbnails?.default?.url ??
							null,
					}
				})
		)
		const shows = candidates.filter((show) => show !== null)
		shows.sort((left, right) => {
			if (!left.number && !right.number) return 0
			if (!left.number) return 1
			if (!right.number) return -1
			return Number(right.number) - Number(left.number)
		})
		return shows
	} catch {
		return []
	}
}
