import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - MovieDecoded AI',
  description: 'Privacy Policy for MovieDecoded AI platform and YouTube API integration'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-[#ece1b2] py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="border-b-2 border-[#fe017f] pb-6">
          <Link href="/" className="text-xs font-black uppercase text-[#fe017f] hover:underline mb-4 block">
            ← Back to MovieDecoded AI
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">Last Updated: October 2026</p>
        </div>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#26e200] uppercase">1. Overview</h2>
          <p>
            MovieDecoded AI ("we", "our", or "us") operates the website located at 
            <strong className="text-white"> https://moviedecodedai.onrender.com</strong>. This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#ffff00] uppercase">2. Google & YouTube API Services</h2>
          <p>
            Our service uses Google APIs and the YouTube Data API to allow authorized users to connect their YouTube accounts and publish generated short-form video content directly to their own YouTube channel.
          </p>
          <p>
            By using our YouTube integration features, you agree to be bound by the{' '}
            <a 
              href="https://www.youtube.com/t/terms" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#2fcaee] underline hover:text-white"
            >
              YouTube Terms of Service
            </a>{' '}
            and the{' '}
            <a 
              href="https://policies.google.com/privacy" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#2fcaee] underline hover:text-white"
            >
              Google Privacy Policy
            </a>.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#fe017f] uppercase">3. Information We Collect and Access</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>
              <strong className="text-white">Account Information:</strong> When you sign in with Google, we access your name, email address, and profile picture to create your user account.
            </li>
            <li>
              <strong className="text-white">YouTube Permissions:</strong> When you connect your YouTube channel, we request the <code className="text-[#ffff00] bg-slate-900 px-1 py-0.5 rounded font-mono">https://www.googleapis.com/auth/youtube.upload</code> scope. We use this scope strictly to upload videos that you have approved in your review dashboard.
            </li>
            <li>
              <strong className="text-white">Tokens & Security:</strong> We securely store encrypted OAuth access and refresh tokens to communicate with the YouTube Data API on your behalf.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#2fcaee] uppercase">4. Data Usage and Non-Disclosure</h2>
          <p>
            MovieDecoded AI does not sell, rent, or trade your personal data or your YouTube account information to third parties. We do not use your YouTube data for advertising or any purpose other than providing the core automated publishing features you explicitly initiate.
          </p>
          <p>
            MovieDecoded AI's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a 
              href="https://developers.google.com/terms/api-services-user-data-policy" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#2fcaee] underline hover:text-white"
            >
              Google API Services User Data Policy
            </a>, including the Limited Use requirements.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#26e200] uppercase">5. Revocation of Access</h2>
          <p>
            You can revoke MovieDecoded AI's access to your YouTube channel at any time:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>From within your MovieDecoded AI dashboard under the <strong>Providers</strong> tab by clicking <em>"Disconnect"</em>.</li>
            <li>Via Google's security settings page at{' '}
              <a 
                href="https://myaccount.google.com/permissions" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[#2fcaee] underline hover:text-white"
              >
                Google Security Settings - Third-party apps with account access
              </a>.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-white uppercase">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or your personal data, please contact us at: <strong className="text-white">parth.khanna1509@gmail.com</strong>.
          </p>
        </section>

        <div className="pt-8 border-t border-slate-900 text-xs text-slate-500 font-mono">
          © 2026 MovieDecoded AI. All rights reserved.
        </div>

      </div>
    </div>
  );
}
