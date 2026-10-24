/**
 * The Data API can return a video still instead of an uploaded playlist cover.
 * YouTube's public playlist page exposes the cover in its Open Graph metadata.
 */
export async function getPlaylistThumbnail(
	playlistId: string,
): Promise<string | null> {
	try {
		const url = new URL("https://www.youtube.com/playlist")
		url.searchParams.set("list", playlistId)
		const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
		if (!response.ok) return null

		const html = await response.text()
		const images: { url: string; width: number }[] = []
		for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
			const attributes = new Map(
				Array.from(
					tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g),
					([, name, doubleQuoted, singleQuoted]) => [
						name.toLowerCase(),
						doubleQuoted ?? singleQuoted,
					],
				),
			)
			const property = attributes.get("property")
			const content = attributes.get("content")
			if (!content) continue

			if (property === "og:image") {
				images.push({ url: content, width: 0 })
			} else if (property === "og:image:width" && images.length > 0) {
				images[images.length - 1].width = Number(content) || 0
			}
		}

		images.sort((left, right) => right.width - left.width)
		for (const image of images) {
			const decoded = image.url.replace(
				/&(?:amp|quot|apos|#(\d+)|#x([\da-f]+));/gi,
				(entity, decimal, hex) => {
					if (decimal || hex) {
						const code = Number.parseInt(decimal ?? hex, decimal ? 10 : 16)
						return code <= 0x10ffff ? String.fromCodePoint(code) : entity
					}
					if (entity.toLowerCase() === "&amp;") return "&"
					return entity.toLowerCase() === "&quot;" ? '"' : "'"
				},
			)
			try {
				const imageUrl = new URL(decoded)
				if (
					imageUrl.protocol === "https:" &&
					imageUrl.hostname === "i.ytimg.com"
				) {
					return imageUrl.href
				}
			} catch {
				// Ignore malformed metadata and try the next image.
			}
		}
	} catch {
		// Unavailable pages, consent pages, and timeouts use the API thumbnail.
	}
	return null
}
