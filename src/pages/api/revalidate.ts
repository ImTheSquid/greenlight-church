import type { APIContext } from "astro"

export const prerender = false

export async function GET({ request }: APIContext): Promise<Response> {
	const bypassToken = process.env.ISR_BYPASS_TOKEN
	if (!bypassToken) {
		return new Response("ISR_BYPASS_TOKEN not configured", { status: 500 })
	}

	// Vercel cron uses UTC; only run the reset at 1 AM Pacific, including DST.
	// Leave the other refresh schedules and manual revalidation unchanged.
	if (request.headers.get("x-vercel-cron-schedule") === "0 8,9 * * 6") {
		const hour = new Intl.DateTimeFormat("en-US", {
			timeZone: "America/Los_Angeles",
			hourCycle: "h23",
			hour: "2-digit",
		}).format(new Date())
		if (hour !== "01") return new Response(null, { status: 204 })
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
