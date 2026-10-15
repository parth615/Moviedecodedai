import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - MovieDecoded AI',
  description: 'Terms of Service for MovieDecoded AI platform'
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-[#ece1b2] py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="border-b-2 border-[#26e200] pb-6">
          <Link href="/" className="text-xs font-black uppercase text-[#26e200] hover:underline mb-4 block">
            ← Back to MovieDecoded AI
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">Last Updated: October 2026</p>
        </div>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#ffff00] uppercase">1. Agreement to Terms</h2>
          <p>
            By accessing or using MovieDecoded AI (<strong className="text-white">https://moviedecodedai.onrender.com</strong>), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#fe017f] uppercase">2. Description of Service</h2>
          <p>
            MovieDecoded AI is an automated multimedia platform that allows users to research topics, generate synthetic voiceovers, assemble split-screen video shorts, and publish them to third-party platforms including YouTube.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#2fcaee] uppercase">3. User Responsibilities & Content Guidelines</h2>
          <p>
            Users are solely responsible for all content, scripts, and media generated and uploaded through their accounts. You agree not to use the service to generate:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>Content that violates copyright, trademark, or intellectual property rights.</li>
            <li>Defamatory, hateful, harassing, or illegal material.</li>
            <li>Misinformation or harmful medical/scientific claims.</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-[#26e200] uppercase">4. YouTube Integration</h2>
          <p>
            Users connecting their YouTube channels acknowledge that all uploads must comply with the{' '}
            <a 
              href="https://www.youtube.com/t/terms" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#2fcaee] underline hover:text-white"
            >
              YouTube Terms of Service
            </a>{' '}
            and Community Guidelines. MovieDecoded AI does not claim ownership over videos uploaded to your channel.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-white uppercase">5. Termination</h2>
          <p>
            We may terminate or suspend access to our service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or third-party service providers.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-black text-white uppercase">6. Contact</h2>
          <p>
            For questions regarding these Terms, contact us at: <strong className="text-white">parth.khanna1509@gmail.com</strong>.
          </p>
        </section>

        <div className="pt-8 border-t border-slate-900 text-xs text-slate-500 font-mono">
          © 2026 MovieDecoded AI. All rights reserved.
        </div>

      </div>
    </div>
  );
}
