'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpenText,
  ChevronRight,
  CircleDot,
  Coins,
  LockKeyhole,
  Mic,
  Network,
  Rocket,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const sections = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'vision', label: 'Vision & Mission' },
  { id: 'features', label: 'Core Features' },
  { id: 'utility', label: 'Token Utility' },
  { id: 'tokenomics', label: 'Tokenomics' },
  { id: 'use-cases', label: 'Use Cases' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'security', label: 'Security' },
  { id: 'conclusion', label: 'Conclusion' },
] as const;

const featureCards = [
  {
    title: 'AI Voice and Audio Processing',
    icon: Mic,
    points: [
      'Convert speech into text with high accuracy',
      'Generate AI-driven voice responses',
      'Enable real-time voice interaction and processing',
      'Support multiple languages and dialects',
    ],
  },
  {
    title: 'AI Content Creation',
    icon: BookOpenText,
    points: [
      'Generate AI-assisted audio content',
      'Automatic transcription and summarization',
      'Analytical insights from voice and audio data',
    ],
  },
  {
    title: 'Blockchain Integration',
    icon: Network,
    points: [
      'Transparent, verifiable on-chain transactions',
      'Token-based incentives for ecosystem participants',
      'Decentralized access to AI tools and resources',
    ],
  },
  {
    title: 'Developer Ecosystem',
    icon: Zap,
    points: [
      'API access for integrating AI voice features into third-party applications',
      'SDKs and libraries for building decentralized applications',
      'Tools for customizing AI behavior and outputs',
    ],
  },
] as const;

const tokenUtilities = [
  'Access Fees: Tokens are used to access advanced AI features and premium services.',
  'Airdrop Rewards: Community members receive SPKR tokens as incentives.',
  'Staking: Users can stake tokens to earn rewards and support network security.',
  'Governance: Token holders participate in decisions on protocol updates and improvements.',
  'API Usage: Developers pay with SPKR tokens to integrate AI capabilities into their applications.',
] as const;

const tokenomics = [
  ['Community Airdrop', '15,000,000', '15%', 'Bootstraps adoption and rewards early active users.'],
  ['Future Airdrops', '5,000,000', '5%', 'Reserved for ongoing campaigns, partnerships, and growth initiatives.'],
  ['Presale Round 1', '5,000,000', '5%', 'Supports early funding and gives initial supporters the lowest entry point.'],
  ['Presale Round 2', '5,000,000', '5%', 'Expands access while strengthening market positioning before public exposure.'],
  ['Team Allocation', '10,000,000', '10%', 'Supports long-term builder incentives and aligns the team with project success.'],
  ['Liquidity & Ecosystem', '60,000,000', '60%', 'Supports liquidity, rewards, partnerships, grants, and ecosystem expansion.'],
] as const;

const useCases = [
  {
    title: 'Content Creators',
    points: [
      'Efficiently convert spoken ideas into written content',
      'Generate high-quality scripts, summaries, and audio content',
    ],
  },
  {
    title: 'Developers and Businesses',
    points: [
      'Integrate AI-driven voice functionalities into applications',
      'Automate customer service using AI-based responses',
      'Analyze voice data for insights and decision-making',
    ],
  },
  {
    title: 'Traders and Web3 Participants',
    points: [
      'Participate in token-based incentives',
      'Leverage SPKR tokens for ecosystem engagement and rewards',
    ],
  },
] as const;

const roadmap = [
  'Release advanced AI voice models with enhanced natural language understanding',
  'Launch mobile applications for iOS and Android',
  'Introduce SDKs and APIs for developers',
  'Implement decentralized governance through DAO structures',
  'Expand cross-chain compatibility to support multiple blockchain networks',
] as const;

const securityPoints = [
  'On-chain smart contracts for verifiable operations',
  'Transparent tokenomics and distribution mechanisms',
  'Decentralized architecture ensuring data ownership and integrity',
] as const;

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]['id']>('introduction');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (!element) return;

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveSection(section.id);
            }
          });
        },
        { rootMargin: '-25% 0px -55% 0px', threshold: 0.1 }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach(observer => observer.disconnect());
  }, []);

  const scrollToSection = (sectionId: (typeof sections)[number]['id']) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    setActiveSection(sectionId);
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${sectionId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-brand-red selection:text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-red/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-red/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-brand-red/5 blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-md lg:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center red-glow">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tighter">
              SPEAKER<span className="text-brand-red">AI</span>
            </span>
          </div>

          <Link
            href="/"
            prefetch
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back Home
          </Link>
        </div>
      </div>

      <main className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 lg:pl-[440px] xl:pl-[500px]">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-10 lg:mb-14 animate-fade-up-soft"
        >
          <div className="glass-card rounded-[32px] p-8 lg:p-14">
            <p className="text-[10px] text-white/40 uppercase tracking-[0.35em] font-bold mb-4">
              SpeakerAI Protocol
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[5.25rem] font-display font-black tracking-tight leading-[0.92] mb-6">
              Documentation For <span className="text-brand-red">Builders, Users,</span> And The <span className="text-brand-red">Community</span>
            </h1>
            <p className="text-white/60 text-base lg:text-xl max-w-4xl leading-9">
              Explore the SpeakerAI Protocol vision, token design, ecosystem utilities, roadmap, and
              the foundations of its AI-powered voice and audio infrastructure.
            </p>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 gap-6 lg:gap-10 lg:block">
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
            className="hidden lg:block lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-[410px] xl:w-[460px] animate-fade-left-soft"
          >
            <div className="h-full bg-[linear-gradient(180deg,rgba(24,7,7,0.96),rgba(12,12,12,0.96))] backdrop-blur-xl border-r border-r-brand-red/20 px-8 py-8 flex flex-col">
              <div className="pb-8 border-b border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 bg-brand-red rounded-xl flex items-center justify-center red-glow">
                    <Zap className="text-white w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <span className="text-2xl font-display font-bold tracking-tighter block">
                      SPEAKER<span className="text-brand-red">AI</span>
                    </span>
                    <span className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">
                      Documentation
                    </span>
                  </div>
                </div>

                <Link
                  href="/"
                  prefetch
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back Home
                </Link>
              </div>

              <div className="flex-1 min-h-0 pt-8 pr-2 overflow-y-auto sidebar-scroll">
                <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold mb-4">Sections</p>
                <div className="flex lg:flex-col gap-3 overflow-x-auto pb-1 lg:overflow-visible">
                  {sections.map(section => (
                    <button
                      key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`shrink-0 text-left px-5 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                      activeSection === section.id
                        ? 'border-brand-red/30 bg-brand-red/10 text-white red-glow'
                        : 'border-white/5 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-base font-bold">{section.label}</span>
                    <ChevronRight className={`w-4 h-4 ${activeSection === section.id ? 'text-brand-red' : 'text-white/30'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>

          <aside className="lg:hidden animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.08s' }}>
            <div className="glass-card rounded-[28px] p-5">
              <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold mb-4">Sections</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`shrink-0 text-left px-4 py-3 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      activeSection === section.id
                        ? 'border-brand-red/30 bg-brand-red/10 text-white red-glow'
                        : 'border-white/5 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-bold">{section.label}</span>
                    <ChevronRight className={`w-4 h-4 ${activeSection === section.id ? 'text-brand-red' : 'text-white/30'}`} />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.12 }}
            className="space-y-6"
          >
            <section id="introduction" className="glass-card rounded-[32px] p-8 lg:p-14 scroll-mt-24 animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.1s' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-brand-red/20 rounded-2xl">
                  <BookOpenText className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">1. Introduction</p>
                  <h2 className="text-3xl font-display font-bold">What SpeakerAI Protocol Is</h2>
                </div>
              </div>
              <p className="text-white/70 text-lg lg:text-[1.15rem] leading-9">
                SpeakerAI Protocol is a decentralized platform that leverages artificial intelligence and
                blockchain technology to create an innovative voice and audio ecosystem. The protocol is
                designed to empower individuals, developers, and businesses by providing sophisticated AI
                tools for processing, analyzing, and generating audio content, while maintaining
                transparency, security, and decentralized ownership.
              </p>
              <p className="text-white/60 text-lg lg:text-[1.15rem] leading-9 mt-4">
                SpeakerAI Protocol bridges the gap between AI and decentralized technology, enabling users
                to interact with intelligent systems in a seamless and efficient manner.
              </p>
            </section>

            <section id="vision" className="glass-card rounded-[32px] p-8 lg:p-14 scroll-mt-24 animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.14s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-red/20 rounded-2xl">
                  <Rocket className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">2. Vision and Mission</p>
                  <h2 className="text-3xl font-display font-bold">Where The Protocol Is Going</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-[24px] border border-white/5 bg-white/5 p-6">
                  <h3 className="text-xl font-display font-bold mb-3">Vision</h3>
                  <p className="text-white/70 text-lg leading-9">
                    Establish a fully decentralized AI-powered voice ecosystem.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/5 bg-white/5 p-6">
                  <h3 className="text-xl font-display font-bold mb-3">Mission</h3>
                  <p className="text-white/70 text-lg leading-9">
                    Provide users with cutting-edge tools that transform audio and conversational data
                    into meaningful insights and actionable outputs, while preserving control and
                    ownership through a transparent token-driven economy.
                  </p>
                </div>
              </div>
            </section>

            <section id="features" className="glass-card rounded-[32px] p-8 lg:p-14 scroll-mt-24 animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.18s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-red/20 rounded-2xl">
                  <Mic className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">3. Core Features</p>
                  <h2 className="text-3xl font-display font-bold">Core Capabilities</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {featureCards.map(card => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="rounded-[24px] border border-white/5 bg-white/5 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-brand-red/15 rounded-2xl">
                          <Icon className="w-5 h-5 text-brand-red" />
                        </div>
                        <h3 className="text-xl font-display font-bold">{card.title}</h3>
                      </div>
                      <ul className="space-y-3">
                        {card.points.map(point => (
                          <li key={point} className="flex items-start gap-3 text-white/70">
                            <CircleDot className="w-4 h-4 text-brand-red mt-1 shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="utility" className="glass-card rounded-[32px] p-8 lg:p-14 scroll-mt-24 animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.22s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-red/20 rounded-2xl">
                  <Coins className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">4. Token Utility (SPKR)</p>
                  <h2 className="text-3xl font-display font-bold">How SPKR Works Inside The Ecosystem</h2>
                </div>
              </div>
              <p className="text-white/70 text-lg leading-9 mb-5">
                The SPKR token serves as the backbone of the SpeakerAI Protocol, enabling a wide range of
                functionalities throughout the ecosystem.
              </p>
              <ul className="space-y-4">
                {tokenUtilities.map(item => (
                  <li key={item} className="rounded-[22px] border border-white/5 bg-white/5 p-5 text-white/70 text-lg leading-9">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section id="tokenomics" className="glass-card rounded-[32px] p-8 lg:p-14 scroll-mt-24 animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.26s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-red/20 rounded-2xl">
                  <Coins className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">5. Tokenomics</p>
                  <h2 className="text-3xl font-display font-bold">Supply And Allocation</h2>
                </div>
              </div>
              <div className="rounded-[24px] border border-brand-red/20 bg-brand-red/10 p-6 mb-6">
                <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold mb-2">Total Supply</p>
                <p className="text-3xl font-display font-black">100,000,000 SPKR</p>
                <p className="text-white/60 mt-2">Fixed supply, no inflation, built for scarcity and long-term value potential.</p>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {tokenomics.map(([title, amount, percent, description]) => (
                  <div key={title} className="rounded-[24px] border border-white/5 bg-white/5 p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="text-xl font-display font-bold">{title}</h3>
                      <span className="px-3 py-1 rounded-full border border-brand-red/20 bg-brand-red/10 text-brand-red text-xs font-bold uppercase tracking-wider">
                        {percent}
                      </span>
                    </div>
                    <p className="text-2xl font-display font-black mb-3">{amount} SPKR</p>
                    <p className="text-white/65 text-lg leading-9">{description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="use-cases" className="glass-card rounded-[32px] p-8 lg:p-14 scroll-mt-24 animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.3s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-red/20 rounded-2xl">
                  <Network className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">6. Use Cases</p>
                  <h2 className="text-3xl font-display font-bold">Who It Serves</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {useCases.map(card => (
                  <div key={card.title} className="rounded-[24px] border border-white/5 bg-white/5 p-6">
                    <h3 className="text-xl font-display font-bold mb-4">{card.title}</h3>
                    <ul className="space-y-3">
                      {card.points.map(point => (
                        <li key={point} className="flex items-start gap-3 text-white/70">
                          <CircleDot className="w-4 h-4 text-brand-red mt-1 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section id="roadmap" className="glass-card rounded-[32px] p-8 lg:p-14 scroll-mt-24 animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.34s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-red/20 rounded-2xl">
                  <Rocket className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">7. Future Roadmap</p>
                  <h2 className="text-3xl font-display font-bold">What Comes Next</h2>
                </div>
              </div>
              <div className="space-y-4">
                {roadmap.map((item, index) => (
                  <div key={item} className="rounded-[22px] border border-white/5 bg-white/5 p-5 flex items-start gap-4">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-brand-red/15 border border-brand-red/20 flex items-center justify-center text-brand-red font-black">
                      {index + 1}
                    </div>
                    <p className="text-white/70 text-lg leading-9">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="security" className="glass-card rounded-[32px] p-8 lg:p-14 scroll-mt-24 animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.38s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-red/20 rounded-2xl">
                  <LockKeyhole className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">8. Security and Transparency</p>
                  <h2 className="text-3xl font-display font-bold">Protocol Trust Layer</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {securityPoints.map(point => (
                  <div key={point} className="rounded-[24px] border border-white/5 bg-white/5 p-6">
                    <ShieldCheck className="w-6 h-6 text-brand-red mb-4" />
                    <p className="text-white/70 text-lg leading-9">{point}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="conclusion" className="glass-card rounded-[32px] p-8 lg:p-14 scroll-mt-24 animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.42s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-red/20 rounded-2xl">
                  <Zap className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">9. Conclusion</p>
                  <h2 className="text-3xl font-display font-bold">Closing Summary</h2>
                </div>
              </div>
              <p className="text-white/70 text-lg lg:text-[1.15rem] leading-9">
                SpeakerAI Protocol represents the next generation of AI-driven voice platforms. By
                combining the power of artificial intelligence with blockchain technology, it provides
                users, developers, and businesses with innovative tools to interact with, generate, and
                analyze audio content.
              </p>
              <p className="text-white/60 text-lg lg:text-[1.15rem] leading-9 mt-4">
                The protocol empowers participants while building a transparent, decentralized, and
                reward-driven ecosystem for the AI and Web3 communities.
              </p>
            </section>

            <Link href="/terms-of-service" prefetch className="block animate-fade-up-soft" style={{ ['--animation-delay' as never]: '0.46s' }}>
              <div className="glass-card rounded-[32px] p-8 lg:p-10 border-brand-red/30 hover:bg-white/10 transition-all red-glow">
                <p className="text-[10px] text-white/40 uppercase tracking-[0.35em] font-bold mb-3">Next Document</p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-display font-black mb-3">Terms of Service</h3>
                    <p className="text-white/60 text-base lg:text-lg leading-8 max-w-2xl">
                      Review the legal terms that govern use of the SpeakerAI Protocol website and related interfaces.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-brand-red/15 border border-brand-red/20 flex items-center justify-center shrink-0">
                    <ChevronRight className="w-5 h-5 text-brand-red" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
