export function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">Telefya</div>
          <p>
            Enterprise-grade meetings, webinars, events, and collaboration for
            teams that need secure connection at scale.
          </p>
        </div>

        <div>
          <h4>Platform</h4>
          <a href="/conference-lobby">Conference Lobby</a>
          <a href="/live-stage">Live Stage</a>
          <a href="/speaker-dashboard">Speaker Dashboard</a>
        </div>

        <div>
          <h4>Business</h4>
          <a href="/host-console">Host Console</a>
          <a href="/attendee-portal">Attendee Portal</a>
          <a href="/admin-portal">Admin Portal</a>
        </div>

        <div>
          <h4>Company</h4>
          <a href="#">Security</a>
          <a href="#">Pricing</a>
          <a href="#">Contact Sales</a>
        </div>
      </div>
    </footer>
  );
}