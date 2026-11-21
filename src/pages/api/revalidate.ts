import type { APIContext } from "astro"

export const prerender = false

export async function GET({ request }: APIContext): Promise<Response> {
	const bypassToken = process.env.ISR_BYPASS_TOKEN
	if (!bypassToken) {
		return new Response("ISR_BYPASS_TOKEN not configured", { status: 500 })
	}

	const { origin } = new URL(request.url)
	const results = await Promise.all(
		["/", "/archive"].map(async (path) => {
			const res = await fetch(`${origin}${path}`, {
				headers: { "x-prerender-revalidate": bypassToken },
			})
			return { path, status: res.status, ok: res.ok }
		}),
	)

	return new Response(
		results.map(({ path, status }) => `${path} revalidated (${status})`).join("\n"),
		{ status: results.every(({ ok }) => ok) ? 200 : 502 },
	)
}
