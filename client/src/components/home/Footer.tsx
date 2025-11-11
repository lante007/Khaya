import { Home } from "lucide-react";
import { Link } from "wouter";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-8 w-8" />
              <span className="text-2xl font-bold">Project Khaya</span>
            </div>
            <p className="text-primary-foreground/80 mb-4">
              Building community, one home at a time. Your trusted construction marketplace for KZN.
            </p>
            <p className="text-sm text-primary-foreground/60">
              "Umuntu ngumuntu ngabantu" - A person is a person through other people
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <Link to="/about">
                  <a className="hover:text-secondary transition-colors cursor-pointer">About Us</a>
                </Link>
              </li>
              <li>
                <Link to="/how-it-works">
                  <a className="hover:text-secondary transition-colors cursor-pointer">How It Works</a>
                </Link>
              </li>
              <li>
                <Link to="/materials">
                  <a className="hover:text-secondary transition-colors cursor-pointer">Marketplace</a>
                </Link>
              </li>
              <li>
                <Link to="/trust-safety">
                  <a className="hover:text-secondary transition-colors cursor-pointer">Trust & Safety</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <Link to="/help">
                  <a className="hover:text-secondary transition-colors cursor-pointer">Help Center</a>
                </Link>
              </li>
              <li>
                <Link to="/contact">
                  <a className="hover:text-secondary transition-colors cursor-pointer">Contact Us</a>
                </Link>
              </li>
              <li>
                <Link to="/sms-support">
                  <a className="hover:text-secondary transition-colors cursor-pointer">SMS Support</a>
                </Link>
              </li>
              <li>
                <Link to="/terms">
                  <a className="hover:text-secondary transition-colors cursor-pointer">Terms & Privacy</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
          <p>© 2025 Project Khaya. Starting in Estcourt, serving all of KZN. Built with Ubuntu.</p>
        </div>
      </div>
    </footer>
  );
};
