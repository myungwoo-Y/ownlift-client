import Link from "next/link";

const productPoints = [
  'Plan your next prescribed lift',
  'Log sets with low friction',
  'Track training maxes and workout history locally',
  'No account required',
] as const;

const sessionRows = [
  { label: 'Main lift', value: 'Squat' },
  { label: 'Top set', value: '295 x 5+' },
  { label: 'Training max', value: '345 lb' },
] as const;

export default function Home() {
  return (
    <main>
      <section className="heroSection" aria-labelledby="home-title">
        <div className="heroCopy">
          <p className="eyebrow">Available now on the App Store</p>
          <h1 id="home-title">OwnLift</h1>
          <p className="lead">
            An offline-first 5/3/1 strength training program runner.
          </p>
          <ul className="featureList" aria-label="OwnLift features">
            {productPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="actionRow" aria-label="Download and support links">
            <a
              className="storeBadge"
              href="https://apps.apple.com/app/id6762624258"
              aria-label="Download OwnLift on the App Store"
            >
              Download on the App Store
            </a>
            <Link className="textLink" href="/support">
              Support
            </Link>
            <Link className="textLink" href="/privacy">
              Privacy
            </Link>
          </div>
        </div>
        <aside className="programPanel" aria-label="Example OwnLift session">
          <div className="panelHeader">
            <div>
              <p className="panelLabel">Today</p>
              <h2>5/3/1 Week</h2>
            </div>
            <span className="liftIcon" aria-hidden="true" />
          </div>
          <dl className="sessionList">
            {sessionRows.map((row) => (
              <div key={row.label} className="sessionRow">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="nextSet">Next prescribed action</p>
          <p className="setNumber">315 x 1+</p>
        </aside>
      </section>
    </main>
  );
}
