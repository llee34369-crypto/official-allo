'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  AudioLines,
  BookOpenText,
  BrainCircuit,
  Coins,
  Mic,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  Volume2,
  Waypoints,
  Zap,
  ChevronRight,
} from 'lucide-react';

const TOTAL_SUPPLY = 100000000;
const AIRDROP_POOL = 20000000;

const SOCIAL_LINKS = {
  website: 'https://www.speakerai.org',
  x: 'https://x.com/SpeakerAI_BNB',
  discord: 'https://discord.gg/rhtrZHUNb',
} as const;

const productPillars = [
  {
    eyebrow: 'Capture',
    title: 'Voice becomes structured, searchable intelligence.',
    description:
      'SpeakerAI turns raw conversations, recordings, and live speech into usable data that can power apps, workflows, and decision-making.',
    icon: Mic,
  },
  {
    eyebrow: 'Generate',
    title: 'AI responses, summaries, and audio content in one layer.',
    description:
      'The protocol is designed for real output: transcription, summarization, conversational replies, and AI-assisted audio creation.',
    icon: BrainCircuit,
  },
  {
    eyebrow: 'Reward',
    title: 'Usage and ecosystem participation connect to token utility.',
    description:
      'Blockchain infrastructure gives SpeakerAI transparent incentives, on-chain verification, and an economy around access, rewards, and growth.',
    icon: Coins,
  },
] as const;

const useCases = [
  {
    title: 'For Creators',
    text: 'Capture spoken ideas fast, generate polished scripts, and turn audio-first workflows into publishable content.',
  },
  {
    title: 'For Developers',
    text: 'Plug voice AI into dApps, dashboards, and products with APIs, SDKs, and tokenized ecosystem mechanics.',
  },
  {
    title: 'For Businesses',
    text: 'Analyze voice interactions, automate audio-heavy workflows, and turn conversations into measurable insight.',
  },
] as const;

const tokenUtilities = [
  'Access advanced AI features and premium protocol services',
  'Receive ecosystem incentives and airdrop rewards',
  'Stake SPKR to support participation and future network mechanics',
  'Take part in protocol governance as the ecosystem expands',
] as const;

const tokenomics = [
  {
    label: 'Liquidity & Ecosystem',
    amount: 60000000,
    percent: 60,
    color: '#8b0000',
    description: 'Supports liquidity, platform rewards, partnerships, grants, and long-term expansion.',
  },
  {
    label: 'Community Airdrop',
    amount: 15000000,
    percent: 15,
    color: '#b80f0a',
    description: 'Reserved to reward active early participants and bootstrap adoption.',
  },
  {
    label: 'Team Allocation',
    amount: 10000000,
    percent: 10,
    color: '#d72614',
    description: 'Aligns core builders with the long-term success of the SpeakerAI Protocol.',
  },
  {
    label: 'Future Airdrops',
    amount: 5000000,
    percent: 5,
    color: '#f04a24',
    description: 'Held back for future campaigns, community growth, and strategic distribution.',
  },
  {
    label: 'Presale Round 1',
    amount: 5000000,
    percent: 5,
    color: '#ff6f3c',
    description: 'Early capital and community support at the earliest access stage.',
  },
  {
    label: 'Presale Round 2',
    amount: 5000000,
    percent: 5,
    color: '#ff9b66',
    description: 'Broader market access before public-scale growth and ecosystem rollout.',
  },
] as const;

const roadmap = [
  'Advanced voice models with stronger natural language understanding',
  'Mobile experiences for iOS and Android',
  'Developer SDKs and API integrations for third-party products',
  'DAO-style governance and broader multichain compatibility',
] as const;

function XLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.6L6.35 22H3.24l7.24-8.28L1 2h6.26l4.32 5.97L18.9 2Zm-1.07 18h1.72L6.33 3.9H4.48L17.83 20Z" />
    </svg>
  );
}

function DiscordLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.32 4.37A19.79 19.79 0 0 0 15.43 3c-.21.37-.45.86-.62 1.25a18.35 18.35 0 0 0-5.62 0A12.6 12.6 0 0 0 8.56 3a19.66 19.66 0 0 0-4.9 1.38C.57 9.02-.26 13.54.16 18c2.05 1.52 4.03 2.44 5.98 3.05.48-.66.91-1.36 1.28-2.09-.7-.27-1.36-.6-1.99-.98.17-.12.33-.25.49-.38 3.84 1.8 8 1.8 11.8 0 .17.14.33.27.5.38-.63.39-1.3.72-2 .99.37.73.8 1.43 1.28 2.09 1.95-.61 3.93-1.53 5.98-3.05.5-5.16-.85-9.64-3.16-13.63ZM8.85 15.27c-1.15 0-2.1-1.06-2.1-2.35 0-1.3.93-2.36 2.1-2.36 1.18 0 2.12 1.07 2.1 2.36 0 1.29-.93 2.35-2.1 2.35Zm6.3 0c-1.16 0-2.1-1.06-2.1-2.35 0-1.3.93-2.36 2.1-2.36 1.18 0 2.12 1.07 2.1 2.36 0 1.29-.93 2.35-2.1 2.35Z" />
    </svg>
  );
}

function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const normalized = sanitized.length === 3 ? sanitized.split('').map((char) => char + char).join('') : sanitized;
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function darkenHex(hex: string, factor = 0.58) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeDonutSlice(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function describeRadialFace(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  angle: number,
  thickness: number
) {
  const outerTop = polarToCartesian(cx, cy, outerRadius, angle);
  const innerTop = polarToCartesian(cx, cy, innerRadius, angle);
  const outerBottom = polarToCartesian(cx, cy + thickness, outerRadius, angle);
  const innerBottom = polarToCartesian(cx, cy + thickness, innerRadius, angle);

  return [
    `M ${outerTop.x} ${outerTop.y}`,
    `L ${innerTop.x} ${innerTop.y}`,
    `L ${innerBottom.x} ${innerBottom.y}`,
    `L ${outerBottom.x} ${outerBottom.y}`,
    'Z',
  ].join(' ');
}

function describeWall(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  thickness: number
) {
  const topStart = polarToCartesian(cx, cy, radius, startAngle);
  const topEnd = polarToCartesian(cx, cy, radius, endAngle);
  const bottomStart = polarToCartesian(cx, cy + thickness, radius, startAngle);
  const bottomEnd = polarToCartesian(cx, cy + thickness, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${topStart.x} ${topStart.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${topEnd.x} ${topEnd.y}`,
    `L ${bottomEnd.x} ${bottomEnd.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${bottomStart.x} ${bottomStart.y}`,
    'Z',
  ].join(' ');
}

function TokenomicsChart() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tilt, setTilt] = useState({ rotateX: 22, rotateY: -10 });

  const centerX = 170;
  const centerY = 170;
  const outerRadius = 125;
  const innerRadius = 45;
  const thickness = 40;
  // High density layers for a solid look
  const extrusionLayers = Array.from({ length: 20 }, (_, i) => (i + 1) * 2);

  interface TokenomicsSlice {
    label: string;
    amount: number;
    percent: number;
    color: string;
    description: string;
    index: number;
    startAngle: number;
    endAngle: number;
    midAngle: number;
    offsetX: number;
    offsetY: number;
    topPath: string;
  }

  const slices: TokenomicsSlice[] = [];
  let accumulatedAngle = -90;

  for (let index = 0; index < tokenomics.length; index++) {
    const slice = tokenomics[index];
    const sliceAngle = (slice.percent / 100) * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    const offsetDistance = activeIndex === index ? 15 : 0;
    const radians = ((midAngle - 90) * Math.PI) / 180;
    const offsetX = Math.cos(radians) * offsetDistance;
    const offsetY = Math.sin(radians) * offsetDistance;

    slices.push({
      ...slice,
      index,
      startAngle,
      endAngle,
      midAngle,
      offsetX,
      offsetY,
      topPath: describeDonutSlice(centerX, centerY, outerRadius, innerRadius, startAngle, endAngle),
    });

    accumulatedAngle = endAngle;
  }

  const activeSlice = tokenomics[activeIndex];

  const handleChartMove = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;
    const rotateY = (relativeX - 0.5) * 20;
    const rotateX = 25 + (0.5 - relativeY) * 15;

    setTilt({ rotateX, rotateY });
  };

  const resetTilt = () => {
    setTilt({ rotateX: 22, rotateY: -10 });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
      <div className="flex justify-center">
        <div className="w-full max-w-[450px]">
          <div className="relative [perspective:2500px]">
            {/* Dynamic Shadow */}
            <motion.div 
              className="absolute inset-x-10 bottom-0 h-20 bg-black/60 blur-[60px] rounded-full pointer-events-none"
              animate={{
                x: -tilt.rotateY * 2,
                y: tilt.rotateX * 0.5,
                scale: 1 + (tilt.rotateX - 25) * 0.01
              }}
            />
            
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <motion.div
                className="relative will-change-transform"
                onMouseMove={handleChartMove}
                onMouseLeave={resetTilt}
                onTouchMove={handleChartMove}
                onTouchEnd={resetTilt}
                onFocus={resetTilt}
                animate={{
                  rotateX: tilt.rotateX,
                  rotateY: tilt.rotateY,
                }}
                transition={{ 
                  rotateX: { type: 'spring', stiffness: 80, damping: 20 },
                  rotateY: { type: 'spring', stiffness: 80, damping: 20 },
                }}
                style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
              >
                <svg viewBox="0 0 340 400" className="w-full h-auto overflow-visible">
                  <defs>
                    <radialGradient id="speakerai-chart-core" cx="50%" cy="35%" r="75%">
                      <stop offset="0%" stopColor="#5a1111" />
                      <stop offset="60%" stopColor="#1a0d0d" />
                      <stop offset="100%" stopColor="#050505" />
                    </radialGradient>
                    <linearGradient id="speakerai-chart-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                      <stop offset="45%" stopColor="rgba(255,255,255,0.1)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                    <filter id="glow-strong">
                      <feGaussianBlur stdDeviation="8" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Solid Extrusion (Stacked Layers) */}
                  {extrusionLayers.map((offset, layerIndex) => (
                    <g key={`layer-${offset}`} opacity={1 - layerIndex * 0.02}>
                      {slices.map((slice) => (
                        <motion.path
                          key={`${slice.label}-layer-${offset}`}
                          animate={{ x: slice.offsetX, y: slice.offsetY }}
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          d={describeDonutSlice(centerX, centerY + offset, outerRadius, innerRadius, slice.startAngle, slice.endAngle)}
                          fill={darkenHex(slice.color, 0.2 + layerIndex * 0.03)}
                        />
                      ))}
                    </g>
                  ))}

                  {/* Top Faces */}
                  {slices.map((slice) => (
                    <motion.g
                      key={slice.label}
                      animate={{ 
                        x: slice.offsetX, 
                        y: slice.offsetY,
                        scale: activeIndex === slice.index ? 1.05 : 1
                      }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 0.7 }}
                      onMouseEnter={() => setActiveIndex(slice.index)}
                      onFocus={() => setActiveIndex(slice.index)}
                      className="cursor-pointer"
                    >
                      {/* Main Surface */}
                      <path
                        d={slice.topPath}
                        fill={slice.color}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1"
                      />
                      
                      {/* Holographic Sheen */}
                      <path
                        d={slice.topPath}
                        fill="url(#speakerai-chart-sheen)"
                        opacity={activeIndex === slice.index ? 0.8 : 0.4}
                        style={{ mixBlendMode: 'screen' }}
                      />
                      
                      {/* Active Highlight Border */}
                      {activeIndex === slice.index && (
                        <path
                          d={slice.topPath}
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          opacity="0.5"
                          filter="url(#glow-strong)"
                        />
                      )}
                    </motion.g>
                  ))}

                  {/* Center Core */}
                  <g pointerEvents="none">
                    <circle cx={centerX} cy={centerY + 20} r={48} fill="rgba(0,0,0,0.6)" />
                    <circle cx={centerX} cy={centerY + 10} r={48} fill="rgba(140,20,20,0.95)" />
                    <circle cx={centerX} cy={centerY} r={46} fill="url(#speakerai-chart-core)" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                    <text x={centerX} y={centerY - 6} textAnchor="middle" className="fill-white/40 text-[10px] font-black tracking-[0.5em] uppercase">
                      SPKR
                    </text>
                    <text x={centerX} y={centerY + 24} textAnchor="middle" className="fill-brand-red-glow text-[30px] font-black tracking-tighter">
                      {activeSlice.percent}%
                    </text>
                  </g>
                </svg>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card rounded-[40px] p-10 border-brand-red/40 bg-[linear-gradient(165deg,rgba(139,0,0,0.2),rgba(15,15,15,0.95))]"
          >
            <p className="text-[11px] text-brand-red-glow uppercase tracking-[0.4em] font-black mb-4">Allocation Details</p>
            <h3 className="text-4xl lg:text-5xl font-display font-black mb-4 tracking-tight">{activeSlice.label}</h3>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-5xl font-display font-black text-white">{activeSlice.amount.toLocaleString()}</span>
              <span className="text-white/40 font-bold tracking-widest">SPKR</span>
            </div>
            <p className="text-white/70 text-lg leading-relaxed">{activeSlice.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tokenomics.map((slice, index) => (
            <button
              key={slice.label}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              className={`group text-left rounded-[28px] border p-5 transition-all duration-300 ${
                activeIndex === index
                  ? 'border-brand-red/50 bg-brand-red/15 red-glow scale-[1.02]'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="inline-flex items-center gap-3 text-sm font-black tracking-tight">
                  <span className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: slice.color }} />
                  {slice.label}
                </span>
                <span className={`text-lg font-black transition-colors ${activeIndex === index ? 'text-brand-red-glow' : 'text-white/40'}`}>
                  {slice.percent}%
                </span>
              </div>
              <p className="text-xs text-white/40 font-mono">{slice.amount.toLocaleString()} SPKR</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-12 max-w-3xl">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-red/20 bg-brand-red/10 text-[10px] font-black uppercase tracking-[0.4em] text-brand-red mb-4"
      >
        {eyebrow}
      </motion.div>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-4xl lg:text-6xl font-display font-black tracking-tight mb-6 leading-[1.1]"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-lg lg:text-xl leading-relaxed"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-red selection:text-white overflow-x-hidden font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transform-gpu translate-z-0">
        <div className="absolute inset-0 bg-grid opacity-[0.15] mask-radial will-change-transform translate-z-0" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-red/15 blur-[160px] rounded-full will-change-transform translate-z-0" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-red/10 blur-[160px] rounded-full will-change-transform translate-z-0" />
        <div className="absolute top-[30%] right-[5%] w-[30%] h-[30%] bg-brand-red/5 blur-[120px] rounded-full will-change-transform translate-z-0" />
      </div>

      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-brand-red rounded-xl flex items-center justify-center red-glow-strong">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-display font-black tracking-tighter uppercase">
              SPEAKER<span className="text-brand-red">AI</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <a href="#about" className="px-5 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">
              About
            </a>
            <a href="#tokenomics" className="px-5 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">
              Tokenomics
            </a>
            <Link
              href="/documentation"
              prefetch
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all ml-4"
            >
              Docs
            </Link>
            <Link
              href="/allocation"
              prefetch
              className="px-7 py-3 bg-brand-red hover:bg-brand-red-glow text-white rounded-full text-xs font-black uppercase tracking-widest transition-all red-glow ml-2"
            >
              Allocation
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-32">
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-red/30 bg-brand-red/10 text-[11px] font-black uppercase tracking-[0.4em] text-brand-red-glow mb-8">
                <Sparkles className="w-4 h-4 animate-pulse" />
                SpeakerAI Protocol
              </div>
              <h1 className="text-6xl sm:text-7xl lg:text-[100px] font-display font-black tracking-tight leading-[0.85] mb-8">
                VOICE AS
                <br />
                <span className="text-brand-red text-glow">INFRASTRUCTURE</span>
                <br />
                FOR WEB3.
              </h1>
              <p className="text-white/60 text-xl lg:text-2xl max-w-2xl leading-relaxed mb-12">
                SpeakerAI is building a decentralized voice and audio protocol where AI processing,
                conversational intelligence, and on-chain incentives work as one product layer.
              </p>
              <div className="flex flex-col sm:flex-row gap-5">
                <Link
                  href="/allocation"
                  prefetch
                  className="px-10 py-5 bg-brand-red hover:bg-brand-red-glow text-white rounded-full text-lg font-black transition-all red-glow-strong inline-flex items-center justify-center gap-4 group"
                >
                  CHECK ALLOCATION
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/documentation"
                  prefetch
                  className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-lg font-black transition-all inline-flex items-center justify-center gap-4"
                >
                  READ DOCUMENTATION
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="relative perspective-1000"
            >
              
              
              {/* Decorative Floating Elements */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-10 w-24 h-24 bg-brand-red/20 blur-3xl rounded-full" 
              />
              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-red/10 blur-3xl rounded-full" 
              />
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="max-w-7xl mx-auto px-6 lg:px-8 mb-32 scroll-mt-32">
          <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-[48px] p-10 lg:p-14 border-white/10 bg-[linear-gradient(165deg,rgba(20,20,20,0.8),rgba(10,10,10,0.95))]"
            >
              <p className="text-[11px] text-brand-red-glow uppercase tracking-[0.5em] font-black mb-6">About SpeakerAI</p>
              <h2 className="text-5xl lg:text-6xl font-display font-black mb-8 tracking-tight leading-[1.05]">A product-first protocol for intelligent voice ecosystems.</h2>
              <p className="text-white/70 text-xl leading-relaxed mb-8">
                SpeakerAI is not just a dashboard and not just a token. The idea is to create a voice-native
                product layer where audio can be captured, processed, analyzed, and monetized in a transparent ecosystem.
              </p>
              <p className="text-white/50 text-lg leading-relaxed">
                The landing page builds on the core ideas from the documentation,
                presenting the product as a unified system—combining AI voice tools, developer integrations, on-chain ownership, and token-based participation.
                
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {productPillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <motion.div 
                    key={pillar.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-card rounded-[40px] p-10 flex flex-col border-white/5 hover:border-brand-red/30 transition-colors group"
                  >
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black mb-8">{pillar.eyebrow}</p>
                    <div className="w-16 h-16 rounded-[24px] bg-brand-red/10 border border-brand-red/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                      <Icon className="w-8 h-8 text-brand-red" />
                    </div>
                    <h3 className="text-2xl font-display font-black mb-6 leading-tight">{pillar.title}</h3>
                    <p className="text-white/60 leading-relaxed text-lg">{pillar.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-32">
          <SectionHeader 
            eyebrow="Product Delivery"
            title="Built around real audio workflows, not generic AI promises."
            description="The SpeakerAI experience is meant to feel like a live system: voice in, intelligence out, transparent protocol beneath it."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card rounded-[48px] p-10 lg:p-12 border-brand-red/30 bg-[linear-gradient(180deg,rgba(139,0,0,0.15),rgba(10,10,10,0.95))] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/10 blur-[100px] -mr-32 -mt-32 group-hover:bg-brand-red/20 transition-colors" />
              <div className="relative flex flex-col h-full">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 rounded-[28px] bg-brand-red/15 border border-brand-red/30 flex items-center justify-center shadow-2xl">
                    <BookOpenText className="w-10 h-10 text-brand-red-glow" />
                  </div>
                  <div>
                    <p className="text-[11px] text-brand-red-glow uppercase tracking-[0.4em] font-black mb-2">AI Output</p>
                    <h3 className="text-3xl lg:text-4xl font-display font-black tracking-tight">Content generation with context</h3>
                  </div>
                </div>
                <p className="text-white/70 text-xl leading-relaxed mt-auto">
                  Instead of isolated tools, SpeakerAI is designed as a pipeline where recordings can become transcripts,
                  summaries, analytics, responses, and publishable outputs in one ecosystem.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-[48px] p-10 lg:p-12 border-white/10 bg-[linear-gradient(180deg,rgba(30,30,30,0.4),rgba(10,10,10,0.95))] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-white/10 transition-colors" />
              <div className="relative flex flex-col h-full">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                    <Network className="w-10 h-10 text-brand-red" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-[0.4em] font-black mb-2">Protocol Utility</p>
                    <h3 className="text-3xl lg:text-4xl font-display font-black tracking-tight">Blockchain where it matters</h3>
                  </div>
                </div>
                <p className="text-white/70 text-xl leading-relaxed mt-auto">
                  On-chain design is used for trust, participation, incentives, and ownership rather than decoration. That gives the product a transparent economy around usage and growth.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tokenomics Section */}
        <section id="tokenomics" className="max-w-7xl mx-auto px-6 lg:px-8 mb-32 scroll-mt-32">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-[60px] p-10 lg:p-20 border-white/10 bg-[linear-gradient(165deg,rgba(15,15,15,0.8),rgba(5,5,5,0.98))]"
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-20">
              <div className="max-w-3xl">
                <p className="text-[11px] text-brand-red-glow uppercase tracking-[0.5em] font-black mb-6">Tokenomics</p>
                <h2 className="text-5xl lg:text-7xl font-display font-black mb-8 tracking-tight leading-[1.05]">SPKR is designed to fund adoption, reward users, and scale the protocol.</h2>
                <p className="text-white/60 text-xl leading-relaxed">
                  Hover the chart to explore each allocation.
                </p>
              </div>
              <div className="rounded-[32px] border border-brand-red/30 bg-brand-red/10 px-10 py-8 red-glow">
                <p className="text-[11px] text-white/40 uppercase tracking-[0.4em] font-black mb-3">Total Supply</p>
                <p className="text-5xl font-display font-black text-brand-red-glow tracking-tighter">{TOTAL_SUPPLY.toLocaleString()}</p>
                <p className="text-xs text-white/30 font-black tracking-widest mt-1">SPKR TOKENS</p>
              </div>
            </div>

            <TokenomicsChart />
          </motion.div>
        </section>

        {/* Utility & Use Cases */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-32">
          <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-10">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-[48px] p-10 lg:p-14 border-white/10"
            >
              <p className="text-[11px] text-brand-red-glow uppercase tracking-[0.5em] font-black mb-8">SPKR Utility</p>
              <h2 className="text-4xl lg:text-5xl font-display font-black mb-10 tracking-tight">Utility built for ecosystem motion.</h2>
              <div className="space-y-4">
                {tokenUtilities.map((item, idx) => (
                  <motion.div 
                    key={item} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group rounded-[32px] border border-white/5 bg-white/5 p-7 text-white/70 text-lg leading-relaxed hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-5"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <ChevronRight className="w-5 h-5 text-brand-red" />
                    </div>
                    {item}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {useCases.map((item, idx) => (
                <motion.div 
                  key={item.title} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card rounded-[40px] p-10 flex flex-col border-white/5 hover:border-brand-red/30 transition-all group"
                >
                  <h3 className="text-3xl font-display font-black mb-8 tracking-tight group-hover:text-brand-red-glow transition-colors">{item.title}</h3>
                  <p className="text-white/60 text-lg leading-relaxed mt-auto">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-[56px] p-10 lg:p-16 border-white/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-brand-red/5 blur-[120px] rounded-full -mr-20 -mt-20" />
            
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-16 relative z-10">
              <div>
                <p className="text-[11px] text-brand-red-glow uppercase tracking-[0.5em] font-black mb-6">Roadmap</p>
                <h2 className="text-5xl lg:text-7xl font-display font-black tracking-tight">What SpeakerAI is building next</h2>
              </div>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-brand-red/30 bg-brand-red/15 text-sm font-black uppercase tracking-widest text-brand-red-glow red-glow">
                <Rocket className="w-5 h-5 animate-bounce" />
                Protocol Expansion
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              {roadmap.map((item, index) => (
                <motion.div 
                  key={item} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group rounded-[36px] border border-white/5 bg-white/5 p-8 flex items-start gap-6 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <div className="w-14 h-14 shrink-0 rounded-[20px] bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red font-black text-2xl group-hover:bg-brand-red group-hover:text-white transition-all duration-500">
                    {index + 1}
                  </div>
                  <p className="text-white/70 text-xl leading-relaxed pt-2">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Trust Pillars */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-[40px] p-10 border-white/5 hover:border-brand-red/30 transition-all group"
          >
            <ShieldCheck className="w-12 h-12 text-brand-red mb-8 group-hover:scale-110 transition-transform" />
            <h3 className="text-3xl font-display font-black mb-6 tracking-tight">Transparent By Design</h3>
            <p className="text-white/60 text-lg leading-relaxed">
              Smart contracts, tokenomics, and reward mechanics are meant to be verifiable instead of opaque.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-[40px] p-10 border-white/5 hover:border-brand-red/30 transition-all group"
          >
            <Network className="w-12 h-12 text-brand-red mb-8 group-hover:scale-110 transition-transform" />
            <h3 className="text-3xl font-display font-black mb-6 tracking-tight">Built For Integration</h3>
            <p className="text-white/60 text-lg leading-relaxed">
              APIs and SDKs are part of the product vision, so builders can plug SpeakerAI intelligence into external apps and dApps.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-[40px] p-10 border-white/5 hover:border-brand-red/30 transition-all group"
          >
            <AudioLines className="w-12 h-12 text-brand-red mb-8 group-hover:scale-110 transition-transform" />
            <h3 className="text-3xl font-display font-black mb-6 tracking-tight">Ready For Real Audio Work</h3>
            <p className="text-white/60 text-lg leading-relaxed">
              The focus is practical audio utility: better conversations, better outputs, better tooling, and clearer ownership.
            </p>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-[64px] p-10 lg:p-24 border-brand-red/40 bg-[linear-gradient(135deg,rgba(139,0,0,0.2),rgba(10,10,10,0.98))] relative overflow-hidden text-center lg:text-left"
          >
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(139,0,0,0.3),transparent_60%)]" />
            <div className="relative z-10 max-w-4xl">
              <p className="text-[11px] text-brand-red-glow uppercase tracking-[0.5em] font-black mb-8">Launch Into SpeakerAI</p>
              <h2 className="text-5xl lg:text-8xl font-display font-black leading-[0.9] mb-10 tracking-tighter">
                Explore the product,
                <span className="text-brand-red"> review the token design,</span>
                and check your allocation.
              </h2>
              <p className="text-white/70 text-xl lg:text-2xl leading-relaxed mb-12 max-w-3xl">
                Start with the docs if you want the full protocol breakdown, or jump straight into the allocation checker to see your SPKR estimate.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <Link
                  href="/allocation"
                  prefetch
                  className="px-12 py-6 bg-brand-red hover:bg-brand-red-glow text-white rounded-full text-xl font-black transition-all red-glow-strong inline-flex items-center justify-center gap-4 group"
                >
                  CHECK YOUR ALLOCATION
                  <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/documentation"
                  prefetch
                  className="px-12 py-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xl font-black transition-all inline-flex items-center justify-center gap-4"
                >
                  VIEW DOCUMENTATION
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 mb-20">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center red-glow">
                  <Zap className="text-white w-5 h-5 fill-current" />
                </div>
                <span className="text-2xl font-display font-black tracking-tighter uppercase">
                  SPEAKER<span className="text-brand-red">AI</span>
                </span>
              </div>
              <p className="text-white/40 text-lg leading-relaxed max-w-sm mb-8">
                A decentralized voice and audio protocol where AI intelligence meets on-chain transparency.
              </p>
              <div className="flex items-center gap-6">
                <a href={SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-red/20 hover:text-brand-red-glow transition-all">
                  <XLogo className="w-5 h-5" />
                </a>
                <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-red/20 hover:text-brand-red-glow transition-all">
                  <DiscordLogo className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black mb-2">Protocol</span>
                <Link href="/documentation" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Documentation</Link>
                <Link href="/allocation" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Allocation</Link>
                <a href={SOCIAL_LINKS.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Website</a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black mb-2">Legal</span>
                <Link href="/terms-of-service" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Terms of Service</Link>
                <Link href="/privacy-policy" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Privacy Policy</Link>
                <Link href="/cookie-policy" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Cookie Policy</Link>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black mb-2">Supply</span>
                <div className="flex flex-col">
                  <span className="text-lg font-display font-black text-brand-red-glow leading-none">{AIRDROP_POOL.toLocaleString()}</span>
                  <span className="text-[9px] text-white/30 font-black tracking-widest mt-1">AIRDROP POOL</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-display font-black text-white leading-none">{TOTAL_SUPPLY.toLocaleString()}</span>
                  <span className="text-[9px] text-white/30 font-black tracking-widest mt-1">TOTAL SUPPLY</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pb-12 flex flex-col sm:flex-row justify-between items-center gap-6 opacity-30 border-t border-white/5 pt-12">
            <span className="text-[10px] font-black tracking-[0.4em] uppercase">SpeakerAI Protocol © 2026</span>
            <span className="text-[10px] font-black tracking-[0.4em] uppercase">Built for the future of voice</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
