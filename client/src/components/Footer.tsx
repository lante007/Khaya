import { Link } from "wouter";
import { APP_TITLE } from "@/const";

export default function Footer() {
  return (
    <footer className="bg-[#E07A3E] text-white py-12 mt-auto">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#E07A3E] font-bold text-xl">
                🏡
              </div>
              <span className="text-xl font-bold">{APP_TITLE}</span>
            </div>
            <p className="text-sm text-white/90 mb-4">
              Building community, one home at a time. Your trusted construction marketplace for KZN.
            </p>
            <p className="text-xs text-white/70">
              "Ubuntu ngumuntu ngabantu" - A person is a person through other people
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <a className="text-sm text-white/90 hover:text-white transition-colors">
                    About Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/how-it-works">
                  <a className="text-sm text-white/90 hover:text-white transition-colors">
                    How It Works
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/materials">
                  <a className="text-sm text-white/90 hover:text-white transition-colors">
                    Marketplace
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/trust-safety">
                  <a className="text-sm text-white/90 hover:text-white transition-colors">
                    Trust & Safety
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help">
                  <a className="text-sm text-white/90 hover:text-white transition-colors">
                    Help Center
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-sm text-white/90 hover:text-white transition-colors">
                    Contact Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/sms-support">
                  <a className="text-sm text-white/90 hover:text-white transition-colors">
                    SMS Support
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-sm text-white/90 hover:text-white transition-colors">
                    Terms & Privacy
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Get in Touch</h3>
            <ul className="space-y-2 text-sm text-white/90">
              <li>
                <a href="mailto:support@projectkhaya.co.za" className="hover:text-white transition-colors">
                  support@projectkhaya.co.za
                </a>
              </li>
              <li>Estcourt, KwaZulu-Natal</li>
              <li className="pt-2">
                <Link href="/provider/onboard">
                  <a className="inline-block bg-white text-[#E07A3E] px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors">
                    Join as Provider
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/70">
            © 2025 Project Khaya. Starting in Estcourt, serving all of KZN. Built with Ubuntu.
          </p>
          <div className="flex gap-4 text-sm text-white/70">
            <span>🇿🇦 Proudly South African</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
