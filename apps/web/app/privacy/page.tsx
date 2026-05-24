import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for OwnLift.",
};

export default function PrivacyPage() {
  return (
    <main className="contentPage">
      <article className="policyArticle" aria-labelledby="privacy-title">
        <header className="pageIntro">
          <p className="eyebrow">OwnLift</p>
          <h1 id="privacy-title">Privacy Policy</h1>
          <p>Last updated: May 23, 2026</p>
        </header>

        <section className="contentSection" aria-labelledby="summary-title">
          <h2 id="summary-title">Summary</h2>
          <p>
            OwnLift is designed to run without an account. Workout data,
            training maxes, settings, and workout history are stored locally on
            your device.
          </p>
        </section>

        <section className="contentSection" aria-labelledby="data-title">
          <h2 id="data-title">Data Stored By The App</h2>
          <p>
            OwnLift stores your training information on your device so the app
            can show your prescribed lifts, saved settings, workout history,
            training maxes, and local progress.
          </p>
          <p>
            Backup, export, import, and sharing features only use files you
            select or files created by the app at your request.
          </p>
        </section>

        <section className="contentSection" aria-labelledby="tracking-title">
          <h2 id="tracking-title">Tracking, Ads, And Sale Of Data</h2>
          <p>OwnLift does not sell personal data.</p>
          <p>OwnLift does not show ads.</p>
          <p>OwnLift does not use third-party tracking.</p>
        </section>

        <section className="contentSection" aria-labelledby="updates-title">
          <h2 id="updates-title">App Updates And Functionality</h2>
          <p>
            The app may connect to app update infrastructure to deliver updates
            and maintain app functionality. OwnLift does not upload workout data
            as part of this process.
          </p>
          <p>Workout data is not uploaded by OwnLift.</p>
        </section>

        <section className="contentSection" aria-labelledby="support-title">
          <h2 id="support-title">Support</h2>
          <p>
            If you contact support by email, your email address and message are
            used only to respond to support requests.
          </p>
          <p>
            Contact:{" "}
            <a href="mailto:support@ownlift.app">support@ownlift.app</a>
          </p>
        </section>
      </article>
    </main>
  );
}
