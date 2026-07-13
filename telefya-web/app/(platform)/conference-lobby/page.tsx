const events = [
  "Product Strategy Summit",
  "Healthcare Innovation Roundtable",
  "Telefya Partner Webinar",
];

export default function ConferenceLobbyPage() {
  return (
    <main className="container section">
      <div className="section-heading">
        <span className="section-eyebrow">Conference Lobby</span>
        <h2>Upcoming and live events</h2>
        <p>Join sessions, read announcements, and prepare before going live.</p>
      </div>

      <div className="pricing-grid">
        {events.map((event) => (
          <article className="pricing-card" key={event}>
            <h3>{event}</h3>
            <p>Live session with speakers, Q&A, polls, and attendee chat.</p>
            <strong>Live</strong>
            <a href="/live-stage">Join event</a>
          </article>
        ))}
      </div>
    </main>
  );
}