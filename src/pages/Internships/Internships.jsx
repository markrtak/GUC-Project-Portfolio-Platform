/**
 * Internships.jsx — Internship search / filter / sort listing (req 79–83)
 *
 * PURPOSE:
 *   Lets students search internships by title or company, filter by company
 *   and duration, sort by post date, and click through to a detail page where
 *   they can apply.
 *
 * REACT CONCEPTS USED:
 *   useState() / useEffect() — Loads the internships list on mount.
 *   useMemo() — Derives the filtered, sorted list reactively when filters
 *               change without causing extra re-fetches.
 *   useNavigate() — Sends the user to /internships/:id on card click.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Briefcase, X, SortAsc, MapPin, Clock,
} from 'lucide-react';
import PageWrapper      from '@/components/layout/PageWrapper';
import Breadcrumbs      from '@/components/layout/Breadcrumbs';
import InternshipCard   from '@/components/project/InternshipCard';
import SkeletonCard     from '@/components/common/SkeletonCard';
import { useDataContext } from '@/context/DataContext';

export default function Internships() {
  const { fetchInternships } = useDataContext();
  const navigate = useNavigate();

  const [internships, setInternships] = useState([]);
  const [loading, setLoading]         = useState(true);

  const [search, setSearch]     = useState('');
  const [company, setCompany]   = useState('all');
  const [duration, setDuration] = useState('all');
  const [paid, setPaid]         = useState('all');
  const [sortBy, setSortBy]     = useState('newest');

  useEffect(() => {
    let cancelled = false;
    fetchInternships().then((d) => { if (!cancelled) { setInternships(d); setLoading(false); } });
    return () => { cancelled = true; };
  }, [fetchInternships]);

  const companies = useMemo(
    () => Array.from(new Set(internships.map((i) => i.companyName))).sort(),
    [internships]
  );

  const durations = useMemo(
    () => Array.from(new Set(internships.map((i) => i.duration))).sort(),
    [internships]
  );

  const filtered = useMemo(() => {
    let result = internships.filter((i) => !i.isArchived);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.companyName.toLowerCase().includes(q)
      );
    }

    if (company !== 'all')   result = result.filter((i) => i.companyName === company);
    if (duration !== 'all')  result = result.filter((i) => i.duration === duration);
    if (paid === 'paid')     result = result.filter((i) => i.isPaid);
    if (paid === 'unpaid')   result = result.filter((i) => !i.isPaid);

    if (sortBy === 'newest')   result.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    if (sortBy === 'oldest')   result.sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt));
    if (sortBy === 'deadline') result.sort((a, b) => new Date(a.applicationDeadline) - new Date(b.applicationDeadline));

    return result;
  }, [internships, search, company, duration, paid, sortBy]);

  const hasFilters = search || company !== 'all' || duration !== 'all' || paid !== 'all';

  const clearFilters = () => { setSearch(''); setCompany('all'); setDuration('all'); setPaid('all'); };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[{ label: 'Internships' }]} />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Briefcase size={22} className="text-brand-400" />
            Internships
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} of ${internships.filter((i) => !i.isArchived).length} internships`}
          </p>
        </div>

        {/* Filter toolbar */}
        <div className="card p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by internship title or company name…"
              className="input-base pl-9 py-2 text-sm"
            />
          </div>

          <select value={company} onChange={(e) => setCompany(e.target.value)} className="input-base w-auto text-sm py-2">
            <option value="all">All Companies</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={duration} onChange={(e) => setDuration(e.target.value)} className="input-base w-auto text-sm py-2">
            <option value="all">All Durations</option>
            {durations.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select value={paid} onChange={(e) => setPaid(e.target.value)} className="input-base w-auto text-sm py-2">
            <option value="all">Paid & Unpaid</option>
            <option value="paid">Paid only</option>
            <option value="unpaid">Unpaid only</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-base w-auto text-sm py-2">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="deadline">Deadline Soon</option>
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <Briefcase size={36} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-semibold text-slate-300 mb-1">No internships match your filters</h3>
            <p className="text-sm text-slate-500 mb-5">Try adjusting your search criteria.</p>
            <button onClick={clearFilters} className="text-brand-400 hover:text-brand-300 text-sm font-medium">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((internship) => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                onClick={() => navigate(`/internships/${internship.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
