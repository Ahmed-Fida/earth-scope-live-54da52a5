import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Satellite, Leaf, Droplets, Wind, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AnimatedParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute top-1/4 left-1/2 -translate-x-1/2" animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
        <motion.div className="absolute w-4 h-4 text-primary/60" style={{ transform: 'translateX(200px)' }}><Satellite className="w-full h-full" /></motion.div>
      </motion.div>
      
      {[
        { Icon: Leaf, delay: 0, x: '10%', y: '20%', color: 'text-primary/30' },
        { Icon: Droplets, delay: 1, x: '85%', y: '30%', color: 'text-accent/30' },
        { Icon: Wind, delay: 2, x: '15%', y: '70%', color: 'text-primary/20' },
        { Icon: Thermometer, delay: 0.5, x: '80%', y: '65%', color: 'text-accent/20' },
      ].map(({ Icon, delay, x, y, color }, i) => (
        <motion.div key={i} className={`absolute ${color}`} style={{ left: x, top: y }} animate={{ y: [0, -30, 0], rotate: [0, 10, -10, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}>
          <Icon className="w-8 h-8 md:w-12 md:h-12" />
        </motion.div>
      ))}

      <motion.div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl" animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, delay: 2 }} />
    </div>
  );
}

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  return (
    <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="text-3xl md:text-4xl font-bold gradient-text">{value}{suffix}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
      <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
      <AnimatedParticles />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
            <span className="text-sm font-medium text-primary">Powered by Satellite Data</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Real-Time Environmental</span><br />
            <span className="gradient-text">& Geospatial Intelligence</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Monitor vegetation health, air quality, and atmospheric pollutants across Pakistan using satellite data.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/sign-up"><Button variant="hero" size="xl" className="group">Get Started Free<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></Button></Link>
            <Link to="/dashboard"><Button variant="hero-outline" size="xl" className="group"><Play className="w-5 h-5" />View Live Dashboard</Button></Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 p-6 rounded-2xl glass-card max-w-3xl mx-auto">
            <AnimatedStat value={5} suffix="" label="Parameters" />
            <AnimatedStat value={881913} suffix="" label="km² Analyzed" />
            <AnimatedStat value={3} suffix="+" label="Data Sources" />
            <AnimatedStat value={99.9} suffix="%" label="Uptime" />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
