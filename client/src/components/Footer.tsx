import { Home, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-8 w-8" />
              <span className="text-2xl font-bold">Khaya</span>
            </div>
            <p className="text-primary-foreground/80 mb-4 text-sm">
              Building community, one home at a time. Your trusted construction marketplace for KZN.
            </p>
            <p className="text-xs text-primary-foreground/60 italic">
              "Umuntu ngumuntu ngabantu"
            </p>
            <p className="text-xs text-primary-foreground/50">
              A person is a person through other people
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link to="/about">
                  <a className="hover:text-secondary transition-colors cursor-pointer hover:underline">About Us</a>
                </Link>
              </li>
              <li>
                <Link to="/how-it-works">
                  <a className="hover:text-secondary transition-colors cursor-pointer hover:underline">How It Works</a>
                </Link>
              </li>
              <li>
                <Link to="/materials">
                  <a className="hover:text-secondary transition-colors cursor-pointer hover:underline">Marketplace</a>
                </Link>
              </li>
              <li>
                <Link to="/trust-safety">
                  <a className="hover:text-secondary transition-colors cursor-pointer hover:underline">Trust & Safety</a>
                </Link>
              </li>
              <li>
                <Link to="/pricing">
                  <a className="hover:text-secondary transition-colors cursor-pointer hover:underline">Pricing</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Support</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link to="/help">
                  <a className="hover:text-secondary transition-colors cursor-pointer hover:underline">Help Center</a>
                </Link>
              </li>
              <li>
                <Link to="/contact">
                  <a className="hover:text-secondary transition-colors cursor-pointer hover:underline">Contact Us</a>
                </Link>
              </li>
              <li>
                <Link to="/sms-support">
                  <a className="hover:text-secondary transition-colors cursor-pointer hover:underline">SMS Support</a>
                </Link>
              </li>
              <li>
                <Link to="/terms">
                  <a className="hover:text-secondary transition-colors cursor-pointer hover:underline">Terms of Service</a>
                </Link>
              </li>
              <li>
                <Link to="/privacy">
                  <a className="hover:text-secondary transition-colors cursor-pointer hover:underline">Privacy Policy</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Estcourt, KZN, South Africa</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+27814943255" className="hover:text-secondary transition-colors hover:underline">
                  +27 81 494 3255
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:hello@projectkhaya.co.za" className="hover:text-secondary transition-colors hover:underline">
                  hello@projectkhaya.co.za
                </a>
              </li>
            </ul>
            
            {/* Social Media */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3 text-sm">Follow Us</h4>
              <div className="flex gap-4">
                <a 
                  href="https://instagram.com/ProjectKhaya" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-primary-foreground/10 rounded-full hover:bg-secondary hover:text-primary transition-all duration-300 transform hover:scale-110"
                  aria-label="Instagram"
                  title="Follow @ProjectKhaya on Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://facebook.com/ProjectKhaya" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-primary-foreground/10 rounded-full hover:bg-secondary hover:text-primary transition-all duration-300 transform hover:scale-110"
                  aria-label="Facebook"
                  title="Follow @ProjectKhaya on Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://twitter.com/ProjectKhaya" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-primary-foreground/10 rounded-full hover:bg-secondary hover:text-primary transition-all duration-300 transform hover:scale-110"
                  aria-label="Twitter"
                  title="Follow @ProjectKhaya on Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a 
                  href="https://linkedin.com/company/ProjectKhaya" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-primary-foreground/10 rounded-full hover:bg-secondary hover:text-primary transition-all duration-300 transform hover:scale-110"
                  aria-label="LinkedIn"
                  title="Follow Project Khaya on LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
            <p>© 2025 Khaya. All rights reserved. Starting in Estcourt, serving all of KZN.</p>
            <div className="flex gap-4 text-xs">
              <Link to="/terms">
                <a className="hover:text-secondary transition-colors cursor-pointer">Terms</a>
              </Link>
              <span>•</span>
              <Link to="/privacy">
                <a className="hover:text-secondary transition-colors cursor-pointer">Privacy</a>
              </Link>
              <span>•</span>
              <Link to="/cookies">
                <a className="hover:text-secondary transition-colors cursor-pointer">Cookies</a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
