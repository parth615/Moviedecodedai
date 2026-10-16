'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { 
  Sparkles, 
  Flame, 
  Zap, 
  Play, 
  Pause, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Share2, 
  Brain, 
  Eye, 
  Video as VideoIcon,
  HelpCircle,
  ChevronDown,
  X,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';

interface LandingPageProps {
  session: any;
}

const DEMO_SCENES = [
  {
    sceneNumber: 1,
    title: 'The Viral Hook',
    narration: 'HAVE YOU EVER FELT SO STRESSED THAT YOU JUST WANTED TO HIT THE COMPLETE RESET BUTTON ON YOUR ENTIRE LIFE?',
    image: '/images/8d0aafd7-8138-41f0-a4fb-4ffc95bf1916_scene_1.jpg',
    tag: 'RETENTION HOOK',
    color: '#fe017f'
  },
  {
    sceneNumber: 2,
    title: 'The Visual Anomaly',
    narration: 'MEET TURRITOPSIS DOHRNII — THE ONLY CREATURE ON EARTH THAT CAN CHEAT DEATH FOREVER.',
    image: '/images/8d0aafd7-8138-41f0-a4fb-4ffc95bf1916_scene_2.jpg',
    tag: 'BIOLOGY GLITCH',
    color: '#2fcaee'
  },
  {
    sceneNumber: 3,
    title: 'The Science Breakdown',
    narration: 'WHEN FACED WITH STARVATION, IT UNDERGOES TRANSDIFFERENTIATION, REVERTING ITS ADULT CELLS BACK INTO A BABY POLYP.',
    image: '/images/8d0aafd7-8138-41f0-a4fb-4ffc95bf1916_scene_3.jpg',
    tag: 'TRANSDIFFERENTIATION',
    color: '#26e200'
  },
  {
    sceneNumber: 4,
    title: 'The Viral Cliffhanger',
    narration: 'THIS CELLULAR HACK RESETS ITS BIOLOGICAL CLOCK TO ZERO. COULD HUMANS HARNESS THIS SAME CODE?',
    image: '/images/8d0aafd7-8138-41f0-a4fb-4ffc95bf1916_scene_4.jpg',
    tag: 'CLIFFHANGER',
    color: '#ffff00'
  }
];

export function LandingPageClient({ session }: LandingPageProps) {
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [gateAccepted, setGateAccepted] = useState(true);
  const [showTrollError, setShowTrollError] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Auto-cycle demo scenes
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveSceneIdx((prev) => (prev + 1) % DEMO_SCENES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Scroll listener for progress bar, parallax stickers, and scroll reveals
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((currentScrollY / totalHeight) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // IntersectionObserver for kinetic scroll-triggered reveals
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
    elements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const activeScene = DEMO_SCENES[activeSceneIdx];

  const handleTrollClick = () => {
    setShowTrollError(true);
    setTimeout(() => {
      setShowTrollError(false);
      setGateAccepted(true);
    }, 2500);
  };

  return (
    <div className="relative min-h-screen bg-black text-[#ece1b2] font-sans selection:bg-[#fe017f] selection:text-white overflow-x-hidden">
      
      {/* ── TOP STICKY SCROLL PROGRESS BAR ──────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-black/60 backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-[#fe017f] via-[#ffff00] to-[#26e200] transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ── BACKGROUND NEON GRID ACCENTS ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#fe017f_1px,transparent_1px)] [background-size:24px_24px] z-0" />

      {/* ── DYNAMIC PARALLAX FLOATING RETRO STICKERS ───────────────────────── */}
      <div 
        className="fixed top-28 left-6 pointer-events-none hidden lg:block z-20 transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${Math.sin(scrollY * 0.004) * 15}px) rotate(${-12 + scrollY * 0.01}deg)` }}
      >
        <span className="bg-[#fe017f] text-black text-xs font-black px-3.5 py-1.5 uppercase rounded-sm border-2 border-black brutal-shadow-pink block animate-wiggle">
          ⚡️ 100% Autopilot
        </span>
      </div>

      <div 
        className="fixed top-1/3 right-8 pointer-events-none hidden lg:block z-20 transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${Math.cos(scrollY * 0.003) * 18}px) rotate(${8 - scrollY * 0.008}deg)` }}
      >
        <span className="bg-[#26e200] text-black text-xs font-black px-3.5 py-1.5 uppercase rounded-sm border-2 border-black brutal-shadow-green block">
          🎬 Dual-Brain Video
        </span>
      </div>

      <div 
        className="fixed bottom-14 left-8 pointer-events-none hidden lg:block z-20 transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${-Math.sin(scrollY * 0.003) * 12}px) rotate(${-6 + scrollY * 0.005}deg)` }}
      >
        <span className="bg-[#ffff00] text-black text-xs font-black px-3 py-1 uppercase rounded-sm border-2 border-black brutal-shadow-yellow block">
          🚀 Zero Mic / Camera
        </span>
      </div>

      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="relative z-30 border-b-2 border-[#fe017f]/40 bg-black/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-white group-hover:text-[#fe017f] transition-colors">
                AI<span className="text-[#fe017f]">VIDEO</span>GENERATOR
              </span>
              <span className="bg-[#ffff00] text-black text-[9px] sm:text-[10px] font-black px-2 py-0.5 uppercase tracking-widest rounded-sm border border-black rotate-2 whitespace-nowrap">
                by MovieDecoded
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-black tracking-wider uppercase">
            <a href="#about" className="text-[#2fcaee] hover:text-white transition-colors">
              App Purpose & Safety
            </a>
            <a href="#demo" className="text-slate-300 hover:text-[#fe017f] transition-colors">
              Live Simulator
            </a>
            <a href="#features" className="text-slate-300 hover:text-[#26e200] transition-colors">
              How It Prints
            </a>
            <a href="#faq" className="text-slate-300 hover:text-[#ffff00] transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="bg-[#26e200] text-black text-xs font-black px-4 py-2 rounded uppercase tracking-wider border-2 border-black brutal-shadow-green hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="bg-[#fe017f] text-white text-xs font-black px-5 py-2.5 rounded uppercase tracking-wider border-2 border-black brutal-shadow-pink hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Google Sign-In</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION: WTF IS MOVIE DECODED? ───────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-20 px-6 overflow-hidden">
        
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#fe017f]/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-2/3 right-1/4 w-[400px] h-[400px] bg-[#26e200]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center">
          
          {/* Neon Kicker Pill */}
          <div className="inline-flex items-center gap-2 bg-black border-2 border-[#26e200] px-4 py-1.5 rounded-full brutal-shadow-green mb-8">
            <span className="w-2.5 h-2.5 rounded-full bg-[#26e200] animate-ping" />
            <span className="text-xs font-black uppercase text-[#26e200] tracking-widest">
              Autonomous Faceless Video Engine
            </span>
          </div>

          {/* Massive Bonga-Bonga Inspired Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight text-white uppercase leading-[0.95] mb-6 select-none">
            WTF IS <br />
            <span className="text-[#fe017f] neon-text-pink">MOVIE DECODED</span> <br />
            <span className="text-[#ffff00] neon-text-yellow">AI?</span>
          </h1>

          <p className="text-base sm:text-xl font-bold text-[#ece1b2] max-w-2xl mx-auto leading-relaxed mb-10">
            The unhinged, fully-automated content engine that researches movie lore, drafts viral dopamine scripts, syncs dual-brain visuals, and publishes directly to YouTube Shorts.
          </p>

          {/* Interactive Bonga-Bonga Style Gatekeeper */}
          <div className="max-w-md mx-auto bg-black border-4 border-black p-6 rounded-2xl brutal-shadow-pink relative mb-8">
            
            {showTrollError && (
              <div className="absolute inset-0 bg-[#fe017f] text-black font-black flex flex-col items-center justify-center p-6 rounded-xl z-20 animate-wiggle">
                <p className="text-xl uppercase mb-2">🚨 WRONG ANSWER!</p>
                <p className="text-xs uppercase text-center">
                  Nobody enjoys editing timeline keyframes for 4 hours. Opening autopilot mode now...
                </p>
              </div>
            )}

            <div className="text-xs font-black uppercase text-[#2fcaee] mb-2 tracking-widest">
              CONFIDENTIAL PROTOCOL
            </div>
            <h3 className="text-base font-black uppercase text-white mb-4">
              ARE YOU READY TO STOP EDITING VIDEOS MANUALLY?
            </h3>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto bg-[#26e200] text-black text-sm font-black px-6 py-3 rounded-lg border-2 border-black brutal-shadow-green hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>LAUNCH STUDIO</span>
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="w-full sm:w-auto bg-[#fe017f] text-white text-sm font-black px-6 py-3 rounded-lg border-2 border-black brutal-shadow-pink hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>YES, LET AI PRINT IT</span>
                  <ArrowRight size={16} />
                </button>
              )}

              <button
                type="button"
                onClick={handleTrollClick}
                className="w-full sm:w-auto bg-transparent text-slate-400 hover:text-white text-xs font-black px-4 py-3 rounded-lg border border-slate-700 hover:border-slate-500 uppercase tracking-wider transition-colors cursor-pointer"
              >
                NO, I ENJOY SUFFERING
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 mt-4">
              ⚡ Pay-as-you-go via UPI (Google Pay, PhonePe, Paytm). Starting at just ₹9 per video. No monthly commitments.
            </p>
          </div>

          {/* Quick Live Stats Pill Bar */}
          <div className="inline-flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-400 uppercase pt-2">
            <span className="flex items-center gap-1.5 text-white">
              <CheckCircle2 size={14} className="text-[#26e200]" /> 1,420+ Videos Rendered
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <TrendingUp size={14} className="text-[#fe017f]" /> 12.8M+ Organic Impressions
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <Activity size={14} className="text-[#ffff00]" /> 99.4% YouTube Shorts Acceptance
            </span>
          </div>

        </div>
      </section>

      {/* ── TILTED MARQUEE TICKER 1 (Hot Pink) ────────────────────────────────── */}
      <div className="relative z-20 overflow-hidden bg-[#fe017f] text-black py-3 border-y-4 border-black rotate-[-1.5deg] scale-105 my-8 shadow-[0_4px_25px_rgba(254,1,127,0.4)]">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 font-black text-sm sm:text-base tracking-wider uppercase">
          <span>✦ ZERO CAMERA</span>
          <span>✦ ZERO MICROPHONE</span>
          <span>✦ 100% VIRAL SHORTS</span>
          <span>✦ GEMINI FLASH RESEARCH</span>
          <span>✦ ELEVENLABS NEURAL AUDIO</span>
          <span>✦ 50/50 SPLIT-SCREEN</span>
          <span>✦ AUTO YOUTUBE PUBLISH</span>
          <span>✦ UPI PAY-AS-YOU-GO (₹9)</span>
          <span>✦ ZERO CAMERA</span>
          <span>✦ ZERO MICROPHONE</span>
          <span>✦ 100% VIRAL SHORTS</span>
          <span>✦ GEMINI FLASH RESEARCH</span>
          <span>✦ ELEVENLABS NEURAL AUDIO</span>
          <span>✦ 50/50 SPLIT-SCREEN</span>
          <span>✦ AUTO YOUTUBE PUBLISH</span>
          <span>✦ UPI PAY-AS-YOU-GO (₹9)</span>
        </div>
      </div>

      {/* ── INTERACTIVE LIVE SPLIT-SCREEN SIMULATOR ──────────────────────────── */}
      <section id="demo" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-14 scroll-reveal">
            <span className="text-xs font-black text-[#2fcaee] tracking-widest uppercase border-b-2 border-[#2fcaee] pb-1">
              THE VIRAL DUAL-SCREEN ENGINE
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase mt-3">
              WHAT YOUR AUDIENCE SEES
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mt-2">
              Top half illustrates every sentence spoken with real movie imagery. Bottom half locks hypnotic retention with high-energy gameplay.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Controls & Scene Breakdown */}
            <div className="lg:col-span-5 space-y-4 order-2 lg:order-1 scroll-reveal-left">
              
              <div className="bg-black border-2 border-[#2fcaee] rounded-2xl p-6 brutal-shadow-blue brutal-card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-[#2fcaee] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2fcaee] animate-pulse" />
                    CURRENT SCRIPT & TIMING
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Scene {activeScene.sceneNumber} / {DEMO_SCENES.length}
                  </span>
                </div>
                
                <p className="text-sm font-bold text-white uppercase leading-relaxed mb-5">
                  "{activeScene.narration}"
                </p>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-black uppercase bg-[#2fcaee]/20 text-[#2fcaee] px-2.5 py-1 rounded border border-[#2fcaee]/40">
                    Tag: {activeScene.tag}
                  </span>
                  <span className="text-[10px] font-black uppercase bg-[#26e200]/20 text-[#26e200] px-2.5 py-1 rounded border border-[#26e200]/40">
                    Duration: ~4.5s
                  </span>
                  <span className="text-[10px] font-black uppercase bg-[#ffff00]/20 text-[#ffff00] px-2.5 py-1 rounded border border-[#ffff00]/40">
                    Visual: Auto-Fetched
                  </span>
                </div>
              </div>

              {/* Scene Switcher Buttons */}
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  CLICK TO PREVIEW SCENE:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_SCENES.map((scene, idx) => (
                    <button
                      key={scene.sceneNumber}
                      onClick={() => {
                        setActiveSceneIdx(idx);
                        setIsPlaying(false);
                      }}
                      className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        activeSceneIdx === idx
                          ? 'border-[#fe017f] bg-[#fe017f]/15 text-white font-black translate-x-1 brutal-shadow-pink'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600 font-bold'
                      }`}
                    >
                      <div className="text-[10px] text-[#fe017f] font-mono">SCENE 0{scene.sceneNumber}</div>
                      <div className="text-xs truncate">{scene.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Play / Pause toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Auto-Advance Simulator:
                </span>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-black border border-slate-700 hover:border-white text-xs font-black px-3.5 py-1.5 rounded-lg text-white flex items-center gap-1.5 cursor-pointer"
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
              </div>

            </div>

            {/* Right: Phone Frame Simulator */}
            <div className="lg:col-span-7 flex justify-center order-1 lg:order-2 scroll-reveal-right">
              <div className="relative w-[310px] sm:w-[340px] h-[600px] sm:h-[660px] bg-black border-4 border-slate-800 rounded-[38px] p-2.5 shadow-[0_0_60px_rgba(254,1,127,0.3)] flex flex-col overflow-hidden brutal-shadow-pink transition-transform duration-300 hover:scale-[1.01]">
                
                {/* Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-30" />

                <div className="relative flex-1 w-full h-full rounded-[28px] overflow-hidden flex flex-col bg-slate-950">
                  
                  {/* TOP HALF: Scene Visual */}
                  <div className="relative h-1/2 w-full overflow-hidden bg-slate-900">
                    <img
                      key={activeScene.image}
                      src={activeScene.image}
                      alt={activeScene.title}
                      className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                    />
                    
                    {/* Scene Overlay Pill */}
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono font-bold text-white uppercase border border-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fe017f]" />
                      TOPIC VISUAL
                    </div>
                  </div>

                  {/* SPLIT DIVIDER WITH NEON LASER */}
                  <div className="relative h-1 w-full bg-gradient-to-r from-[#fe017f] via-[#ffff00] to-[#26e200] z-20 shadow-[0_0_15px_#fe017f]" />

                  {/* BOTTOM HALF: Looping GTA / Subway Gameplay */}
                  <div className="relative h-1/2 w-full overflow-hidden bg-slate-950">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover opacity-85"
                      src="/gameplay/satisfying-abstract-01.mp4"
                    />

                    {/* Gameplay Pill */}
                    <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono font-bold text-white uppercase border border-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#26e200]" />
                      RETENTION LOOP
                    </div>
                  </div>

                  {/* DYNAMIC KINETIC CAPTIONS IN CENTER */}
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-25 pointer-events-none">
                    <div className="bg-black/90 backdrop-blur-md border-2 border-[#ffff00] px-3.5 py-2.5 rounded-xl text-center shadow-[0_0_20px_rgba(255,255,0,0.6)]">
                      <p className="text-xs sm:text-sm font-black uppercase text-white tracking-wide leading-tight">
                        {activeScene.narration.split(' ').slice(0, 7).join(' ')}{' '}
                        <span className="text-[#ffff00] bg-black px-1 rounded underline decoration-[#fe017f] decoration-2">
                          {activeScene.narration.split(' ').slice(7, 9).join(' ')}
                        </span>{' '}
                        {activeScene.narration.split(' ').slice(9).join(' ')}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── TILTED MARQUEE TICKER 2 (Acid Green - Reverse Kinetic Direction) ───── */}
      <div className="relative z-20 overflow-hidden bg-[#26e200] text-black py-3 border-y-4 border-black rotate-[1.5deg] scale-105 my-12 shadow-[0_4px_25px_rgba(38,226,0,0.4)]">
        <div className="animate-marquee-reverse whitespace-nowrap flex items-center gap-8 font-black text-sm sm:text-base tracking-wider uppercase">
          <span>✦ AUTOMATED FFmpeg PIPELINE</span>
          <span>✦ PUBLIC YOUTUBE SHORTS</span>
          <span>✦ KINETIC ASS SUBTITLES</span>
          <span>✦ REAL TIME SCENE VISUALS</span>
          <span>✦ MULTI-TENANT STUDIO</span>
          <span>✦ UPI PAY-AS-YOU-GO (₹9)</span>
          <span>✦ AUTOMATED FFmpeg PIPELINE</span>
          <span>✦ PUBLIC YOUTUBE SHORTS</span>
          <span>✦ KINETIC ASS SUBTITLES</span>
          <span>✦ REAL TIME SCENE VISUALS</span>
          <span>✦ MULTI-TENANT STUDIO</span>
          <span>✦ UPI PAY-AS-YOU-GO (₹9)</span>
        </div>
      </div>

      {/* ── THE 4-STEP AUTONOMOUS ENGINE (Neo-Brutalist Architecture) ─────────── */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16 scroll-reveal">
            <span className="text-xs font-black text-[#26e200] tracking-widest uppercase border-b-2 border-[#26e200] pb-1">
              THE 4-STAGE PIPELINE
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase mt-3">
              HOW IT AUTOMATICALLY PRINTS
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mt-2">
              From trending cinematic hooks to public YouTube Shorts in 60 seconds flat without touching an editor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Box 1: Neon Pink */}
            <div className="bg-black border-4 border-dashed border-[#fe017f] rounded-2xl p-8 brutal-shadow-pink brutal-card-hover scroll-reveal-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🧠</span>
                <span className="bg-[#fe017f] text-black text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                  STAGE 01
                </span>
              </div>
              <h3 className="text-2xl font-black text-[#fe017f] uppercase mb-2">
                VIRAL LORE RESEARCH
              </h3>
              <p className="text-sm text-[#ece1b2] leading-relaxed">
                Autonomous LLM scans movie databases and cultural curiosities (Christopher Nolan Easter eggs, biological anomalies, psychological quirks) and extracts high-retention 60-second narrative scripts.
              </p>
            </div>

            {/* Box 2: Electric Blue */}
            <div className="bg-black border-4 border-dashed border-[#2fcaee] rounded-2xl p-8 brutal-shadow-blue brutal-card-hover scroll-reveal-right">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🎙️</span>
                <span className="bg-[#2fcaee] text-black text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                  STAGE 02
                </span>
              </div>
              <h3 className="text-2xl font-black text-[#2fcaee] uppercase mb-2">
                NEURAL VOICE & TIMINGS
              </h3>
              <p className="text-sm text-[#ece1b2] leading-relaxed">
                ElevenLabs generates studio-quality voice narration. The engine calculates precise millisecond timestamps for each scene and word to synchronize visual cuts without robotic artifacts.
              </p>
            </div>

            {/* Box 3: Acid Green */}
            <div className="bg-black border-4 border-dashed border-[#26e200] rounded-2xl p-8 brutal-shadow-green brutal-card-hover scroll-reveal-left scroll-delay-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">⚡️</span>
                <span className="bg-[#26e200] text-black text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                  STAGE 03
                </span>
              </div>
              <h3 className="text-2xl font-black text-[#26e200] uppercase mb-2">
                WORD-SYNCED SPLIT-SCREEN
              </h3>
              <p className="text-sm text-[#ece1b2] leading-relaxed">
                FFmpeg renders a 1080x1920 vertical video. Top half switches images precisely when narration changes scenes. Bottom half streams hypnotizing gameplay. Word-by-word neon ASS subtitles burned in.
              </p>
            </div>

            {/* Box 4: Cyber Yellow */}
            <div className="bg-black border-4 border-dashed border-[#ffff00] rounded-2xl p-8 brutal-shadow-yellow brutal-card-hover scroll-reveal-right scroll-delay-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🚀</span>
                <span className="bg-[#ffff00] text-black text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                  STAGE 04
                </span>
              </div>
              <h3 className="text-2xl font-black text-[#ffff00] uppercase mb-2">
                1-CLICK YOUTUBE PUBLISHING
              </h3>
              <p className="text-sm text-[#ece1b2] leading-relaxed">
                Connect your YouTube channel in 1 click. Once approved in the Review queue, the video is published directly to your channel as a Public YouTube Short with hashtags and descriptions included automatically.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── APPLICATION PURPOSE & GOOGLE API COMPLIANCE DISCLOSURE ───────────── */}
      <section id="about" className="relative z-10 py-20 px-6 bg-slate-900/60 border-t-2 border-b-2 border-slate-800">
        <div className="max-w-4xl mx-auto space-y-10 scroll-reveal">
          
          <div className="text-center">
            <span className="text-xs font-black text-[#2fcaee] tracking-widest uppercase border-b-2 border-[#2fcaee] pb-1">
              TRANSPARENCY & COMPLIANCE DISCLOSURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase mt-3">
              About AIVideoGenerator
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
              Operated by MovieDecoded AI • Publicly accessible cloud-based multimedia creation platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            
            {/* Box 1: App Purpose */}
            <div className="bg-black/80 border-2 border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-base font-black text-white uppercase">Application Purpose</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong>AIVideoGenerator</strong> is an automated multimedia creation tool designed for digital creators, educators, and video publishers. It automates the scripting, synthetic narration, and split-screen video compilation for short-form video content (such as movie analysis, pop culture commentary, and educational shorts).
              </p>
            </div>

            {/* Box 2: Google & YouTube API Usage */}
            <div className="bg-black/80 border-2 border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📺</span>
                <h3 className="text-base font-black text-[#ffff00] uppercase">Google & YouTube API Usage</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                AIVideoGenerator uses Google OAuth 2.0 and the YouTube Data API v3 (<code className="text-xs text-[#2fcaee]">youtube.upload</code>) solely to allow authenticated channel owners to upload their approved video shorts directly to their own YouTube channel. No personal Google data is sold or shared.
              </p>
            </div>

            {/* Box 3: Human Review & Zero Unapproved Uploads */}
            <div className="bg-black/80 border-2 border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h3 className="text-base font-black text-[#26e200] uppercase">Human Approval & Data Safety</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                All generated videos remain strictly in a private user staging area until the user explicitly previews, edits, and approves them. AIVideoGenerator strictly adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-[#2fcaee] underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </p>
            </div>

            {/* Box 4: Strict AI NCII Prohibition */}
            <div className="bg-black/80 border-2 border-red-500/40 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚫</span>
                <h3 className="text-base font-black text-red-400 uppercase">Strict AI NCII Prohibition</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                In strict compliance with Google Developer Policies, AIVideoGenerator <strong>strictly prohibits the generation, rendering, or uploading of AI-generated Non-Consensual Intimate Imagery (AI NCII)</strong>, sexually explicit media, harassment, hate speech, or defamatory content. Violations result in immediate permanent termination.
              </p>
            </div>

          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              For complete legal terms and data handling procedures, read our{' '}
              <Link href="/privacy" className="text-[#fe017f] underline font-bold">Privacy Policy</Link>{' '}
              and{' '}
              <Link href="/terms" className="text-[#fe017f] underline font-bold">Terms of Service</Link>.
            </p>
          </div>

        </div>
      </section>

      {/* ── FAQ ACCORDION ────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 py-20 px-6 bg-slate-950/40 border-t border-slate-900">
        <div className="max-w-3xl mx-auto">
          
          <div className="text-center mb-14 scroll-reveal">
            <span className="text-xs font-black text-[#26e200] tracking-widest uppercase border-b-2 border-[#26e200] pb-1">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase mt-3">
              FAQ
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "DO I NEED TO RECORD MY VOICE OR SHOW MY FACE?",
                a: "Never. The engine handles 100% of the scripting, ElevenLabs neural voiceover, visual fetching, and video rendering. Zero face, zero mic."
              },
              {
                q: "HOW DOES IT PUBLISH TO YOUTUBE?",
                a: "You connect your YouTube channel in 1 click via official Google OAuth. Once you approve a video in the Review tab, the worker uploads it as a public YouTube Short automatically."
              },
              {
                q: "HOW MUCH DOES IT COST TO START?",
                a: "Affordable Pay-As-You-Go! Generate videos from just ₹9 each using instant UPI (Google Pay, PhonePe, Paytm, CRED). Zero monthly subscriptions, zero lock-ins — top up only when you need videos."
              },
              {
                q: "CAN I RUN THIS 24/7 ON THE CLOUD?",
                a: "Yes! The entire project includes a Dockerfile and start.sh script pre-configured for Render.com. It runs the Next.js app and background worker continuously."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-black border-2 border-slate-800 rounded-xl overflow-hidden hover:border-[#fe017f] transition-colors scroll-reveal"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left p-5 font-black text-sm uppercase flex items-center justify-between text-white cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 text-[#fe017f] ${openFaq === idx ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-[#ece1b2] leading-relaxed border-t border-slate-900">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── HIGH CONVERSION FOOTER CTA ───────────────────────────────────────── */}
      <footer className="relative z-10 border-t-4 border-[#fe017f] bg-black py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto scroll-reveal">
          
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter uppercase mb-6 leading-none">
            STOP EDITING. <br />
            <span className="text-[#fe017f] neon-text-pink">START PRINTING VIEWS.</span>
          </h2>

          <p className="text-base sm:text-xl font-bold text-[#ece1b2] max-w-xl mx-auto mb-10">
            Sign in with Google, top up ₹9 via UPI, and generate your first viral short in 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto bg-[#26e200] text-black text-base font-black px-10 py-5 rounded-xl border-4 border-black brutal-shadow-green hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all uppercase tracking-wider"
              >
                OPEN YOUR DASHBOARD →
              </Link>
            ) : (
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full sm:w-auto bg-[#fe017f] text-white text-base font-black px-10 py-5 rounded-xl border-4 border-black brutal-shadow-pink hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all uppercase tracking-wider cursor-pointer"
              >
                GET STARTED FROM ₹9 VIA UPI 🚀
              </button>
            )}
          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-4">
            <div>
              © 2026 AIVideoGenerator (MovieDecoded AI). ALL RIGHTS RESERVED.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">PRIVACY POLICY</Link>
              <Link href="/terms" className="hover:text-white transition-colors">TERMS OF SERVICE</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">DASHBOARD</Link>
              <Link href="/approval" className="hover:text-white transition-colors">REVIEW HUB</Link>
              <Link href="/providers" className="hover:text-white transition-colors">YOUTUBE SETUP</Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
