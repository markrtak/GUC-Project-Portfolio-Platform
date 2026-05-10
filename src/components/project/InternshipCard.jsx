/**
 * InternshipCard.jsx — Single internship summary card
 *
 * PURPOSE:
 *   Displays an internship in the listing/grid on the Internships page.
 *   Shows the company logo/name, title, duration, location, status badge,
 *   skill tags, and a "View" CTA.
 *
 * PROPS:
 *   internship — The internship object from internships.json
 *   onClick    — function(); navigates to the detail page
 *
 * REACT CONCEPTS USED:
 *   Purely presentational — no state.
 *   Click delegation — entire card is clickable to navigate to the detail page.
 */

import {
  Building2, MapPin, Clock, Calendar, ArrowRight, Banknote,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import { formatDate, timeAgo, truncate } from '@/utils/formatters';

export default function InternshipCard({ internship, onClick }) {
  const status = internship.status === 'hiring'
    ? { label: 'Currently Hiring', variant: 'green' }
    : { label: 'Position Filled', variant: 'default' };

  const visibleSkills = (internship.skills || []).slice(0, 4);
  const extra = (internship.skills || []).length - visibleSkills.length;

  return (
    <article
      onClick={onClick}
      className="card p-5 cursor-pointer group hover:border-brand-500/50 hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={internship.companyLogo}
          alt={internship.companyName}
          className="w-12 h-12 rounded-xl bg-surface-700 shrink-0 object-cover"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 text-base leading-snug group-hover:text-brand-300 transition-colors line-clamp-2">
            {internship.title}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Building2 size={11} /> {internship.companyName}
          </p>
        </div>
        <Badge variant={status.variant} size="sm" dot>{status.label}</Badge>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
        {truncate(internship.description, 120)}
      </p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><Clock    size={11} /> {internship.duration}</span>
        <span className="inline-flex items-center gap-1"><MapPin   size={11} /> {internship.location}</span>
        <span className="inline-flex items-center gap-1"><Banknote size={11} /> {internship.isPaid ? 'Paid' : 'Unpaid'}</span>
        {internship.applicationDeadline && (
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} /> Apply by {formatDate(internship.applicationDeadline)}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {visibleSkills.map((s) => <Badge key={s} variant="default" size="sm">{s}</Badge>)}
        {extra > 0 && <Badge variant="default" size="sm">+{extra}</Badge>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-700">
        <span className="text-[11px] text-slate-500">Posted {timeAgo(internship.postedAt)}</span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 group-hover:text-brand-300">
          View details <ArrowRight size={12} />
        </span>
      </div>
    </article>
  );
}
