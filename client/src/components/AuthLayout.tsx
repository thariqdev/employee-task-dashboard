import { motion } from 'framer-motion';
import { AlarmClock, ShieldCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { LogoMark, Wordmark } from './Logo';

const HIGHLIGHTS = [
  { icon: Users, text: 'Manage your team in one place' },
  { icon: AlarmClock, text: 'Spot overdue tasks at a glance' },
  { icon: ShieldCheck, text: 'Secure sign-in for admins' },
];

/** The frame of the sign-in page: a brand panel and a form column. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-full lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-surface p-12 text-ink lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-raised" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-raised" />

        <LogoMark size={44} />

        <div className="relative max-w-md">
          <p className="text-4xl leading-tight font-extrabold tracking-tight">Keep every task moving.</p>
          <p className="mt-4 text-lg text-muted">
            Assign work, track progress and catch overdue tasks before they slip.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 font-medium">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-raised text-accent">
                  <Icon size={18} aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-muted">TaskDesk employee task dashboard</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <h1 className="text-2xl font-semibold">
            <Wordmark size={36} />
          </h1>
          {children}
        </motion.div>
      </section>
    </main>
  );
}
