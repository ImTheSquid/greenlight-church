export async function getArchivedAlbum(slug: string) {
	try {
		const [lossless, compressed] = await Promise.all(
			[".zip", ".aac.zip"].map(async (extension) => {
				const url = `https://night.jackhogan.me/albums/${slug}${extension}`
				const response = await fetch(url, {
					method: "HEAD",
					cache: "no-store",
					signal: AbortSignal.timeout(8000),
				})
				if (response.status !== 200 && response.status !== 202) return null
				const bytes = response.status === 200
					? Number(response.headers.get("content-length")) : 0
				const size = bytes > 0
					? bytes >= 1024 ** 3
						? `${(bytes / 1024 ** 3).toFixed(1)}GB`
						: `${Math.round(bytes / 1024 ** 2)}MB`
					: ""
				return { url, size }
			}),
		)
		if (!lossless || !compressed) return null
		return {
			losslessUrl: lossless.url,
			losslessSize: lossless.size,
			compressedUrl: compressed.url,
			compressedSize: compressed.size,
		}
	} catch {
		return null
	}
}
