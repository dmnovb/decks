import Script from "next/script";

const UMAMI_SCRIPT_URL =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js";
const UMAMI_WEBSITE_ID =
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ||
  "521057e2-b094-4553-b03c-92fe7b5ea227";

export function UmamiAnalytics() {
  return (
    <Script
      id="umami-analytics"
      src={UMAMI_SCRIPT_URL}
      data-website-id={UMAMI_WEBSITE_ID}
      strategy="afterInteractive"
    />
  );
}
