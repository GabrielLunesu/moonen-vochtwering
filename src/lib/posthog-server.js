import { PostHog } from 'posthog-node';

/**
 * Returns a short-lived PostHog client for server-side event capture.
 * flushAt=1 and flushInterval=0 ensure events are sent immediately in
 * short-lived serverless/edge functions. Always call client.shutdown()
 * after use.
 */
export function getPostHogClient() {
  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}
