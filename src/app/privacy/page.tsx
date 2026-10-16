import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - AIVideoGenerator',
  description: 'Privacy Policy and Google API Disclosure for AIVideoGenerator (operated by MovieDecoded AI)'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-[#ece1b2] py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="border-b-2 border-[#fe017f] pb-6">
          <Link href="/" className="text-xs font-black uppercase text-[#fe017f] hover:underline mb-4 block">
            ← Back to AIVideoGenerator
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            AIVideoGenerator (operated by MovieDecoded AI) • Last Updated: October 2026
          </p>
        </div>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#26e200] uppercase">1. Application Overview & Purpose</h2>
          <p>
            <strong>AIVideoGenerator</strong> (operated by MovieDecoded AI, "we", "our", or "us") operates the publicly accessible website located at 
            <strong className="text-white"> https://moviedecodedai.onrender.com</strong>.
          </p>
          <p>
            AIVideoGenerator is an automated multimedia creation tool designed for digital creators, educators, and video publishers. It automates the scripting, synthetic narration, and split-screen video compilation for short-form video content (such as movie analysis, pop culture commentary, and educational shorts).
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#ffff00] uppercase">2. Google & YouTube API Services</h2>
          <p>
            Our service uses Google OAuth 2.0 and the YouTube Data API v3 (<code className="text-[#2fcaee] bg-slate-900 px-1 py-0.5 rounded font-mono">https://www.googleapis.com/auth/youtube.upload</code>) to allow authorized users to connect their YouTube accounts and publish generated, user-approved short-form video content directly to their own YouTube channel.
          </p>
          <p>
            By connecting a YouTube channel, you agree to be bound by the{' '}
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
              <strong className="text-white">Account Information:</strong> When you sign in with Google, we access your basic profile information (name, email address, profile picture) solely to authenticate and create your user profile.
            </li>
            <li>
              <strong className="text-white">YouTube Permissions:</strong> When you connect your YouTube channel, we request the <code className="text-[#ffff00] bg-slate-900 px-1 py-0.5 rounded font-mono">youtube.upload</code> permission. We use this scope strictly to upload videos that you have approved in your review dashboard.
            </li>
            <li>
              <strong className="text-white">Encrypted Credentials:</strong> We securely store encrypted OAuth access and refresh tokens in our protected database to communicate with the YouTube Data API on your behalf.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#2fcaee] uppercase">4. Google API Limited Use Disclosure</h2>
          <p>
            AIVideoGenerator does not sell, rent, or trade your personal data or your YouTube account information to third parties. We do not use your YouTube data for advertising or any purpose other than providing the core automated publishing features you explicitly initiate.
          </p>
          <p>
            AIVideoGenerator's use and transfer of information received from Google APIs to any other app will strictly adhere to the{' '}
            <a 
              href="https://developers.google.com/terms/api-services-user-data-policy" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#2fcaee] underline hover:text-white font-bold"
            >
              Google API Services User Data Policy
            </a>, including the Limited Use requirements.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-red-400 uppercase">5. Strict AI NCII & Content Safety Policy</h2>
          <p>
            In strict compliance with the Google APIs Terms of Service and developer policies, AIVideoGenerator explicitly and strictly prohibits:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>
              <strong className="text-white">AI Non-Consensual Intimate Imagery (AI NCII):</strong> The generation, synthesis, editing, or distribution of synthetic or AI-generated sexually explicit, nudity, or intimate imagery of any individual without their explicit consent is strictly prohibited.
            </li>
            <li>
              <strong className="text-white">Hate Speech & Harassment:</strong> Content that incites violence, promotes hatred, or harasses individuals or groups.
            </li>
            <li>
              <strong className="text-white">Copyright Violations:</strong> Misuse of media or copyrighted works outside of legitimate fair use / commentary.
            </li>
          </ul>
          <p className="text-xs text-red-300">
            Any account found attempting to generate AI NCII or harmful content will be permanently banned and reported to relevant authorities in accordance with applicable laws.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#26e200] uppercase">6. Revocation of Access & Data Deletion</h2>
          <p>
            You can revoke AIVideoGenerator's access to your YouTube channel at any time:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>From within your dashboard under the <strong>Providers</strong> tab by clicking <em>"Disconnect"</em>.</li>
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
          <h2 className="text-xl font-black text-white uppercase">7. Contact Information</h2>
          <p>
            If you have any questions regarding this Privacy Policy, please contact our team at: <strong className="text-white">parth.khanna1509@gmail.com</strong>.
          </p>
        </section>

        <div className="pt-8 border-t border-slate-900 text-xs text-slate-500 font-mono">
          © 2026 AIVideoGenerator (MovieDecoded AI). All rights reserved.
        </div>

      </div>
    </div>
  );
}
