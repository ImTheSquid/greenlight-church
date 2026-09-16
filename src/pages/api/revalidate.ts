import type { APIContext } from "astro";

export const prerender = false;

export async function GET({ request }: APIContext): Promise<Response> {
  const bypassToken = process.env.ISR_BYPASS_TOKEN;
  if (!bypassToken) {
    return new Response("ISR_BYPASS_TOKEN not configured", { status: 500 });
  }

  const { origin } = new URL(request.url);
  const res = await fetch(`${origin}/`, {
    headers: { "x-prerender-revalidate": bypassToken },
  });

  return new Response(
    `homepage revalidated (${res.status})`,
    res.ok ? { status: 200 } : { status: 502 }
  );
}
