import type { APIRoute } from 'astro';
import { getLatestIssue } from '@lib/issues';

export const GET: APIRoute = async () => {
  const latest = await getLatestIssue();
  const version = latest.data.issue.number + '-' + latest.data.issue.date;

  return new Response(
    JSON.stringify({
      version,
      issue: latest.data.issue.number,
      date: latest.data.issue.date,
      date_display: latest.data.issue.date_display,
      title: latest.data.cover.title_short || latest.data.cover.title,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
};
