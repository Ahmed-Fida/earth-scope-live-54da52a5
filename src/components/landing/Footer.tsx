import { Link } from 'react-router-dom';
import { Leaf, Github, Twitter, Linkedin, Mail } from 'lucide-react';

const footerLinks = {
  product: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'FAQ', href: '#faq' }],
  company: [{ label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }, { label: 'Careers', href: '/careers' }],
  resources: [{ label: 'Help Center', href: '/help' }, { label: 'Support', href: '/support' }, { label: 'Status', href: '/status' }],
  legal: [{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }],
};

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Leaf className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold"><span className="gradient-text">Enviro</span><span className="text-foreground">Sense</span></span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">Real-time environmental monitoring and geospatial analytics powered by satellite data.</p>
            <div className="flex gap-4">
              {[{ icon: Twitter, href: '#' }, { icon: Github, href: '#' }, { icon: Linkedin, href: '#' }, { icon: Mail, href: '#' }].map((s, i) => (
                <a key={i} href={s.href} className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"><s.icon className="w-5 h-5" /></a>
              ))}
            </div>
          </div>

          <div><h4 className="font-semibold mb-4">Product</h4><ul className="space-y-3">{footerLinks.product.map(l => <li key={l.label}><a href={l.href} className="text-sm text-muted-foreground hover:text-foreground">{l.label}</a></li>)}</ul></div>
          <div><h4 className="font-semibold mb-4">Company</h4><ul className="space-y-3">{footerLinks.company.map(l => <li key={l.label}><a href={l.href} className="text-sm text-muted-foreground hover:text-foreground">{l.label}</a></li>)}</ul></div>
          <div><h4 className="font-semibold mb-4">Resources</h4><ul className="space-y-3">{footerLinks.resources.map(l => <li key={l.label}><a href={l.href} className="text-sm text-muted-foreground hover:text-foreground">{l.label}</a></li>)}</ul></div>
          <div><h4 className="font-semibold mb-4">Legal</h4><ul className="space-y-3">{footerLinks.legal.map(l => <li key={l.label}><a href={l.href} className="text-sm text-muted-foreground hover:text-foreground">{l.label}</a></li>)}</ul></div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} EnviroSense. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
