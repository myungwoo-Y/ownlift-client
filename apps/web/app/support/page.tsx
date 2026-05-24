import type { Metadata } from "next";
import Link from "next/link";

const faqs = [
  {
    question: "Do I need an account?",
    answer: "No.",
  },
  {
    question: "Where is workout data stored?",
    answer: "On device.",
  },
  {
    question: "Can I back up my data?",
    answer: "Use the in-app export/import features.",
  },
] as const;

export const metadata: Metadata = {
  title: "Support",
  description: "Support information for OwnLift.",
};

export default function SupportPage() {
  return (
    <main className="contentPage">
      <section className="pageIntro" aria-labelledby="support-title">
        <p className="eyebrow">OwnLift</p>
        <h1 id="support-title">Support</h1>
        <p>
          For help with OwnLift, email{" "}
          <a href="mailto:support@ownlift.app">support@ownlift.app</a>.
        </p>
      </section>

      <section className="contentSection" aria-labelledby="faq-title">
        <h2 id="faq-title">FAQ</h2>
        <dl className="faqList">
          {faqs.map((faq) => (
            <div key={faq.question} className="faqItem">
              <dt>{faq.question}</dt>
              <dd>{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="pageLink">
        Read the <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </main>
  );
}
