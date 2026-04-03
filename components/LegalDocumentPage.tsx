'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, FileText, Zap } from 'lucide-react';

type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

type Section = {
  id: string;
  label: string;
  title: string;
  blocks: ContentBlock[];
};

type NextCard = {
  href: string;
  label: string;
  title: string;
  description: string;
};

export function LegalDocumentPage({
  eyebrow,
  title,
  intro,
  sections,
  nextCard,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
  nextCard?: NextCard;
}) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
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

    return () => observers.forEach((observer) => observer.disconnect());
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
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

          <div className="flex items-center gap-3">
            <Link
              href="/documentation"
              prefetch
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Documentation
            </Link>
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
      </div>

      <main className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 lg:pl-[440px] xl:pl-[500px]">
        <div className="mb-10 lg:mb-14">
          <div className="glass-card rounded-[32px] p-8 lg:p-14">
            <p className="text-[10px] text-white/40 uppercase tracking-[0.35em] font-bold mb-4">{eyebrow}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[5.25rem] font-display font-black tracking-tight leading-[0.92] mb-6">
              {title}
            </h1>
            <p className="text-white/60 text-base lg:text-xl max-w-4xl leading-9">{intro}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-10 lg:block">
          <aside className="hidden lg:block lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-[410px] xl:w-[460px]">
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
                      {title}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/documentation"
                    prefetch
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Docs
                  </Link>
                  <Link
                    href="/"
                    prefetch
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Home
                  </Link>
                </div>
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
                          : 'border-white/5 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-base font-bold">{section.label}</span>
                      <ChevronRight className={`w-4 h-4 ${activeSection === section.id ? 'text-brand-red' : 'text-white/30'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <aside className="lg:hidden">
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
                        : 'border-white/5 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-bold">{section.label}</span>
                    <ChevronRight className={`w-4 h-4 ${activeSection === section.id ? 'text-brand-red' : 'text-white/30'}`} />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="glass-card rounded-[32px] p-8 lg:p-14 scroll-mt-24"
              >
                <h2 className="text-3xl font-display font-bold mb-6">{section.title}</h2>
                <div className="space-y-5">
                  {section.blocks.map((block, index) =>
                    block.type === 'paragraph' ? (
                      <p key={`${section.id}-paragraph-${index}`} className="text-white/70 text-lg leading-9 whitespace-pre-line">
                        {block.text}
                      </p>
                    ) : (
                      <ul key={`${section.id}-list-${index}`} className="space-y-3">
                        {block.items.map(item => (
                          <li key={item} className="text-white/70 text-lg leading-9">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              </section>
            ))}

            {nextCard && (
              <Link href={nextCard.href} prefetch className="block">
                <div className="glass-card rounded-[32px] p-8 lg:p-10 border-brand-red/30 hover:bg-white/10 transition-all red-glow">
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.35em] font-bold mb-3">{nextCard.label}</p>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-display font-black mb-3">{nextCard.title}</h3>
                      <p className="text-white/60 text-base lg:text-lg leading-8 max-w-2xl">{nextCard.description}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-brand-red/15 border border-brand-red/20 flex items-center justify-center shrink-0">
                      <ChevronRight className="w-5 h-5 text-brand-red" />
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
