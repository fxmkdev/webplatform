export function AnalyticsScript({
  analyticsDomain,
}: {
  analyticsDomain: string | undefined;
}) {
  return (
    !!analyticsDomain && (
      <script
        defer
        data-domain={analyticsDomain}
        src="https://plausible.io/js/script.js"
      ></script>
    )
  );
}
