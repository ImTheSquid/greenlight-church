const YOUTUBE_API_KEY = import.meta.env.YOUTUBE_API_KEY
const YOUTUBE_CHANNEL_ID = import.meta.env.YOUTUBE_CHANNEL_ID

export async function getLiveVideo(): Promise<{ videoId: string } | null> {
	if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) return null
	try {
		const url = new URL("https://www.googleapis.com/youtube/v3/search")
		url.searchParams.set("part", "id")
		url.searchParams.set("channelId", YOUTUBE_CHANNEL_ID)
		url.searchParams.set("eventType", "live")
		url.searchParams.set("type", "video")
		url.searchParams.set("maxResults", "1")
		url.searchParams.set("key", YOUTUBE_API_KEY)
		const res = await fetch(url)
		if (!res.ok) return null
		const data = (await res.json()) as {
			items?: { id?: { videoId?: string } }[]
		}
		const videoId = data.items?.[0]?.id?.videoId
		return videoId ? { videoId } : null
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

		const shows = await Promise.all(
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
						compressedUrl: `https://night.jackhogan.me/albums/${slug}.aac.zip`,
						compressedSize: (() => {
							const n = number
							if (n === "003") return "492MB"
							if (n === "002") return "323MB"
							if (n === "001") return "380MB"
							return ""
						})(),
						losslessUrl: `https://night.jackhogan.me/albums/${slug}.zip`,
						losslessSize: (() => {
							const n = number
							if (n === "003") return "1.9GB"
							if (n === "002") return "901MB"
							if (n === "001") return "1.4GB"
							return ""
						})(),
						date: dateStr,
						thumbnailUrl:
							snippet.thumbnails?.maxres?.url ??
							snippet.thumbnails?.standard?.url ??
							snippet.thumbnails?.high?.url ??
							snippet.thumbnails?.medium?.url ??
							snippet.thumbnails?.default?.url ??
							null,
					}
				})
		)
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
