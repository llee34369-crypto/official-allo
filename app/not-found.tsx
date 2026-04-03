import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#060606] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,0,0,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,0,0,0.12),transparent_30%)]" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 min-h-screen flex items-center">
        <div className="glass-card w-full rounded-[36px] p-10 lg:p-14 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-brand-red mb-5">404</p>
          <h1 className="text-4xl lg:text-6xl font-display font-black mb-6">Page not found.</h1>
          <p className="text-white/60 text-lg leading-8 max-w-xl mx-auto mb-10">
            The page you tried to open does not exist or may have been moved. You can jump back into the
            SpeakerAI experience below.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/"
              prefetch
              className="px-8 py-4 bg-brand-red hover:bg-brand-red-glow text-white rounded-full text-sm font-black transition-all red-glow inline-flex items-center justify-center"
            >
              Back Home
            </Link>
            <Link
              href="/documentation"
              prefetch
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-black transition-all inline-flex items-center justify-center"
            >
              Read Documentation
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
