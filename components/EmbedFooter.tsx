/** The credit line every embed ends with: site, date line, licence. */
export default function EmbedFooter({ dateLine }: { dateLine: string }) {
  return (
    <p className="embed-foot">
      Israel Votes 2026,{" "}
      <a href="https://www.israelielection.org/?utm_source=embed" target="_blank" rel="noopener">
        israelielection.org
      </a>
      . {dateLine}. CC BY-NC 4.0.
    </p>
  );
}
