import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowRight,
  Store,
  Ticket,
  Clock,
  Bell,
  Sparkles,
  MapPin,
  ChevronRight,
  Timer,
  Scissors,
  Smartphone,
  Shield,
  Star,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useSalons } from '@/hooks/useQueue';

export function HomePage() {
  const { data: salonsData } = useSalons({ limit: 6 });
  const salons = salonsData?.items || [];
  const activeAhead = 2;
  const [mockSeconds, setMockSeconds] = useState(14 * 60 + 20);

  // Simulated live countdown tick for the hero ticket visual
  useEffect(() => {
    const timer = setInterval(() => {
      setMockSeconds((prev) => (prev > 10 ? prev - 1 : 14 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004e54] via-[#006a71] to-[#007C84] text-white shadow-2xl">
        {/* Background Overlay Image with subtle opacity */}
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
          <img
            src="/images/hero-bg.jpg"
            alt="Upscale Barbershop Interior"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/25 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-coral-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-10 lg:p-14">
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold tracking-wide">
              <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
              <span>Digital Waitlist & Smart Queue Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
              Skip the wait. <br />
              <span className="text-mint underline decoration-coral-400 decoration-wavy underline-offset-8">
                Get your perfect cut.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-primary-100/90 leading-relaxed max-w-xl">
              No more crowded waiting rooms or paper clipboards. Join the queue from your phone, get a live digital token, and arrive just in time for your barber chair.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link to="/salons">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-coral-500 hover:bg-coral-600 text-white font-bold text-base px-8 py-3.5 shadow-lg shadow-coral-600/30 active:scale-95 transition-all"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Find a Salon
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-white/30 text-white font-semibold backdrop-blur-md"
                >
                  How It Works
                </Button>
              </a>
            </div>

            {/* Micro Stats */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/15 max-w-lg">
              <div>
                <p className="text-2xl font-black text-white">0 min</p>
                <p className="text-xs text-primary-200">Idle Lobby Wait</p>
              </div>
              <div>
                <p className="text-2xl font-black text-mint">100%</p>
                <p className="text-xs text-primary-200">Live Status Sync</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gold-300">4.9 / 5</p>
                <p className="text-xs text-primary-200">Customer Rating</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Digital Token Card Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm relative">
              {/* Decorative ticket glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-mint via-coral-400 to-gold-400 rounded-3xl blur-lg opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />

              <div className="relative bg-white text-ink rounded-3xl p-6 shadow-2xl border border-mist">
                {/* Header of Token */}
                <div className="flex items-center justify-between pb-4 border-b border-dashed border-mist">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                      BQ
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Sharp & Co. Barbershop</p>
                      <p className="text-[11px] text-ink-soft">Downtown Toronto</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Live Queue
                  </span>
                </div>

                {/* Big Token Number Display */}
                <div className="py-6 text-center bg-gradient-to-b from-primary-50/50 to-white rounded-2xl my-4 border border-primary-100/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-700 mb-1">
                    Your Digital Token
                  </p>
                  <div className="text-5xl font-black tracking-tight text-primary-800">
                    #04
                  </div>
                  <p className="text-xs text-ink-soft mt-1.5 font-medium">Haircut &amp; Beard Package</p>
                </div>

                {/* Queue Position and Wait Countdown */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-mist-light border border-mist text-center">
                    <p className="text-[11px] text-ink-soft font-medium">People Ahead</p>
                    <p className="text-xl font-extrabold text-ink">{activeAhead} customers</p>
                  </div>
                  <div className="p-3 rounded-xl bg-mint/50 border border-primary-200 text-center">
                    <p className="text-[11px] text-primary-800 font-medium">Estimated Wait</p>
                    <p className="text-xl font-black text-primary-800 font-mono">
                      {formatCountdown(mockSeconds)}
                    </p>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-primary-700 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-gold-500" />
                      Approaching your turn
                    </span>
                    <span className="text-ink-soft">Step 2 of 4</span>
                  </div>
                  <div className="w-full bg-mist h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-500 to-coral-500 h-full w-[65%] rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Simulated live button */}
                <Link to="/salons" className="block mt-5">
                  <Button
                    variant="outline"
                    className="w-full justify-center text-xs font-bold border-primary-200 text-primary-700 hover:bg-mint"
                  >
                    Try Live Queue Tracker &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Blocks */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider">
            Engineered For Modern Grooming
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-ink mt-3">
            Why barbers &amp; clients love BarberQ
          </h2>
          <p className="text-sm sm:text-base text-ink-soft mt-2">
            Designed to eliminate clipboard chaos and give customers total freedom while waiting.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Feature 1 */}
          <Card hover className="p-6 border-mist transition-all duration-300 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center mb-4">
              <Ticket className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1.5">Digital Token</h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              Grab your token from anywhere. No sign-up roadblocks, no paper slips that get lost in your pocket.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card hover className="p-6 border-mist transition-all duration-300 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-2xl bg-mint text-primary-800 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1.5">Live Tracking</h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              Watch your position tick down in real time. Know exactly how many people are in the chair ahead of you.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card hover className="p-6 border-mist transition-all duration-300 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-2xl bg-gold-100 text-gold-700 flex items-center justify-center mb-4">
              <Timer className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1.5">Estimated Wait</h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              Smart algorithms combine active service times and barber pacing to compute accurate wait countdowns.
            </p>
          </Card>

          {/* Feature 4 */}
          <Card hover className="p-6 border-mist transition-all duration-300 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-2xl bg-coral-100 text-coral-600 flex items-center justify-center mb-4">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1.5">Smart Notifications</h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              Automatic alerts when you are 2 ahead, 1 ahead, and when it is your exact moment to step into the chair.
            </p>
          </Card>
        </div>
      </section>

      {/* 4-Step How It Works */}
      <section id="how-it-works" className="bg-gradient-to-b from-white to-mist-light p-8 sm:p-12 rounded-3xl border border-mist shadow-xs">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-coral-600 bg-coral-50 px-3 py-1 rounded-full">
            Simple 4-Step Flow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink mt-3">
            How BarberQ Works
          </h2>
          <p className="text-sm text-ink-soft mt-1">
            From discovering your favorite barber to walking into the chair fresh.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Find a Salon',
              desc: 'Browse verified barbershops, check live wait times, and view ratings.',
              icon: Store,
            },
            {
              step: '02',
              title: 'Pick & Join Queue',
              desc: 'Select your preferred service and get an instant digital token number.',
              icon: Ticket,
            },
            {
              step: '03',
              title: 'Track Live Turn',
              desc: 'Grab a coffee or run errands while tracking your live queue position.',
              icon: Smartphone,
            },
            {
              step: '04',
              title: 'Get Cut & Groomed',
              desc: 'Walk in when alerted. Take your seat without standing around.',
              icon: Scissors,
            },
          ].map((item, idx) => (
            <div key={idx} className="relative flex flex-col p-6 rounded-2xl bg-white border border-mist shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-black text-primary-200">{item.step}</span>
                <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-base font-bold text-ink mb-1">{item.title}</h3>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Salons Quick Access */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink">Popular Salons on BarberQ</h2>
            <p className="text-sm text-ink-soft">Join active queues in Toronto and the GTA right now.</p>
          </div>
          <Link to="/salons">
            <Button variant="outline" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
              View All Salons
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {salons.slice(0, 3).map((salon) => {
            const waitingInSalon = 2;
            const imageUrl =
              salon.logo_url ||
              'https://images.pexels.com/photos/1813947/pexels-photo-1813947.jpeg?auto=compress&cs=tinysrgb&w=800';
            return (
              <Card key={salon.id} hover className="overflow-hidden flex flex-col">
                <div className="relative h-44 w-full bg-mist overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={salon.salon_name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-ink shadow-sm flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-gold-500 fill-gold-500" />
                      4.8
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-ink/75 text-white backdrop-blur-sm">
                      {salon.city}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-ink mb-1">{salon.salon_name}</h3>
                    <p className="text-xs text-ink-soft flex items-center gap-1 mb-3">
                      <MapPin className="h-3.5 w-3.5 text-ink-soft shrink-0" />
                      {salon.address}
                    </p>

                    <div className="flex items-center gap-4 py-2 border-y border-mist text-xs">
                      <div>
                        <span className="text-ink-soft block text-[10px]">People waiting</span>
                        <span className="font-bold text-primary-700">{waitingInSalon} in queue</span>
                      </div>
                      <div>
                        <span className="text-ink-soft block text-[10px]">Est. wait</span>
                        <span className="font-bold text-ink">~{waitingInSalon * 20} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 flex items-center gap-2">
                    <Link to="/salon/$id" params={{ id: salon.id }} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full justify-center text-xs">
                        Details
                      </Button>
                    </Link>
                    <Link to="/salon/$id" params={{ id: salon.id }} className="flex-1">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full justify-center text-xs bg-coral-500 hover:bg-coral-600 text-white font-bold"
                      >
                        Join Queue
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="rounded-2xl bg-mint border border-primary-200/80 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary-900">Are you a barbershop or salon owner?</h3>
            <p className="text-sm text-primary-800/80">
              Set up BarberQ in less than 5 minutes. Manage walk-ins seamlessly from any tablet or phone.
            </p>
          </div>
        </div>
        <Link to="/admin/dashboard" className="shrink-0">
          <Button variant="secondary" size="md" className="font-bold">
            Explore Barber Dashboard
          </Button>
        </Link>
      </section>
    </div>
  );
}
