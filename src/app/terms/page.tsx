import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - AIVideoGenerator',
  description: 'Terms of Service for AIVideoGenerator (operated by MovieDecoded AI)'
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-[#ece1b2] py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="border-b-2 border-[#26e200] pb-6">
          <Link href="/" className="text-xs font-black uppercase text-[#26e200] hover:underline mb-4 block">
            ← Back to AIVideoGenerator
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            AIVideoGenerator (operated by MovieDecoded AI) • Last Updated: October 2026
          </p>
        </div>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#ffff00] uppercase">1. Agreement to Terms</h2>
          <p>
            By accessing or using <strong>AIVideoGenerator</strong> (<strong className="text-white">https://moviedecodedai.onrender.com</strong>, operated by MovieDecoded AI), you agree to be legally bound by these Terms of Service. If you disagree with any part of these terms, you may not access or use the service.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#fe017f] uppercase">2. Description & Purpose of Service</h2>
          <p>
            AIVideoGenerator is an automated multimedia creation platform designed for digital creators, educators, and video publishers. The platform automates research, scriptwriting, synthetic audio narration, split-screen video assembly, and optional 1-click publishing of user-approved videos to authenticated third-party platforms including YouTube.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#2fcaee] uppercase">3. User Responsibilities & Acceptable Use</h2>
          <p>
            Users are solely responsible for all content, scripts, and media generated and uploaded through their accounts. You agree not to use the service to generate, render, or distribute:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>Content that infringes upon copyright, trademark, privacy, or intellectual property rights.</li>
            <li>Defamatory, hateful, abusive, threatening, or unlawful media.</li>
            <li>Misinformation or harmful fraudulent claims.</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-red-400 uppercase">4. Strict Prohibition of AI Non-Consensual Intimate Imagery (AI NCII)</h2>
          <p>
            In strict compliance with the Google APIs Terms of Service, YouTube Community Guidelines, and legal frameworks:
          </p>
          <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-xl space-y-2">
            <p className="text-red-200 font-semibold">
              Users are strictly forbidden from generating, processing, synthesizing, or distributing AI Non-Consensual Intimate Imagery (AI NCII), sexually explicit material, or unauthorized likenesses of any person.
            </p>
            <p className="text-xs text-slate-400">
              Any attempt to utilize AIVideoGenerator or Google APIs for AI NCII or harmful content will result in immediate and permanent account termination and potential reporting to law enforcement.
            </p>
          </div>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#26e200] uppercase">5. YouTube & Google APIs Compliance</h2>
          <p>
            Users connecting their YouTube channels acknowledge that all uploads must comply with the{' '}
            <a 
              href="https://www.youtube.com/t/terms" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#2fcaee] underline hover:text-white"
            >
              YouTube Terms of Service
            </a>,{' '}
            <a 
              href="https://developers.google.com/terms" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#2fcaee] underline hover:text-white"
            >
              Google APIs Terms of Service
            </a>, and Community Guidelines. AIVideoGenerator uploads content solely upon explicit user action and does not claim ownership over videos uploaded to your channel.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-white uppercase">6. Account Termination</h2>
          <p>
            We may terminate or suspend access to our service immediately, without prior notice, for conduct that violates these Terms or harms other users, Google services, or third parties.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-white uppercase">7. Contact Information</h2>
          <p>
            For legal inquiries or questions regarding these Terms, contact us at: <strong className="text-white">parth.khanna1509@gmail.com</strong>.
          </p>
        </section>

        <div className="pt-8 border-t border-slate-900 text-xs text-slate-500 font-mono">
          © 2026 AIVideoGenerator (MovieDecoded AI). All rights reserved.
        </div>

      </div>
    </div>
  );
}
