/**
 * InternshipDetail.jsx — Internship detail + apply form (req 83, 84)
 *
 * PURPOSE:
 *   Shows the full description, responsibilities, required skills, and
 *   metadata of a single internship. Students can apply by submitting a
 *   short cover letter (req 84). After applying, the form is replaced with
 *   a confirmation card showing the cover letter and submission date.
 *
 * REACT CONCEPTS USED:
 *   useParams(), useEffect(), useState() — Standard fetch-on-mount pattern.
 *   Conditional rendering — Apply form vs already-applied vs not-hiring states.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  Building2, MapPin, Clock, Calendar, Banknote, Briefcase,
  Send, CheckCircle2, ArrowLeft, AlertTriangle,
} from 'lucide-react';
import PageWrapper  from '@/components/layout/PageWrapper';
import Breadcrumbs  from '@/components/layout/Breadcrumbs';
import Loader       from '@/components/common/Loader';
import Input        from '@/components/common/Input';
import Button       from '@/components/common/Button';
import Badge        from '@/components/common/Badge';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';
import { formatDate, timeAgo } from '@/utils/formatters';

export default function InternshipDetail() {
  const { id } = useParams();
  const { currentUser, isStudent } = useAuth();
  const { fetchInternshipById, applyForInternship } = useDataContext();

  const [internship, setInternship] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);

  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [submitted, setSubmitted]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchInternshipById(id).then((i) => {
      if (cancelled) return;
      if (!i) setNotFound(true);
      else    setInternship(i);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, fetchInternshipById]);

  const myApplication = internship?.applicants?.find((a) => a.studentId === currentUser?.id);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim() || coverLetter.trim().length < 50) {
      setError('Cover letter must be at least 50 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await applyForInternship(id, currentUser.id, coverLetter.trim());
      setSubmitted(true);
      setInternship((prev) => ({
        ...prev,
        applicants: [
          ...(prev.applicants || []),
          { id: `app-${Date.now()}`, studentId: currentUser.id, coverLetter: coverLetter.trim(), status: 'submitted', appliedAt: new Date().toISOString() },
        ],
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)  return <PageWrapper><Loader message="Loading internship…" /></PageWrapper>;
  if (notFound) return <Navigate to="/internships" replace />;

  const isHiring = internship.status === 'hiring' && !internship.isArchived;
  const deadlinePassed = new Date(internship.applicationDeadline) < new Date();

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[
          { label: 'Internships', to: '/internships' },
          { label: internship.title },
        ]} />

        {/* Hero */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <img src={internship.companyLogo} alt={internship.companyName} className="w-16 h-16 rounded-xl bg-surface-700 shrink-0 object-cover" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-100 leading-tight">{internship.title}</h1>
              <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                <Building2 size={13} /> {internship.companyName}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant={isHiring ? 'green' : 'default'} size="sm" dot>
                  {isHiring ? 'Currently Hiring' : 'Position Filled'}
                </Badge>
                <Badge variant="blue" size="sm">{internship.duration}</Badge>
                <Badge variant={internship.isPaid ? 'green' : 'default'} size="sm">
                  {internship.isPaid ? `Paid${internship.salary ? ` — ${internship.salary}` : ''}` : 'Unpaid'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — description, responsibilities */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Briefcase size={15} className="text-brand-400" /> About the Role
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{internship.description}</p>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-200 mb-3">Responsibilities</h2>
              <ul className="space-y-2">
                {internship.responsibilities?.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                    <span className="text-brand-400 shrink-0 mt-1">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-200 mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {internship.skills?.map((s) => <Badge key={s} variant="blue" size="md">{s}</Badge>)}
              </div>
              {internship.programmingLanguages?.length > 0 && (
                <>
                  <h3 className="text-xs text-slate-500 mt-4 mb-2">Programming Languages</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {internship.programmingLanguages.map((l) => <Badge key={l} variant="violet" size="sm">{l}</Badge>)}
                  </div>
                </>
              )}
            </div>

            {/* Apply panel */}
            {isStudent && (
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Send size={15} className="text-brand-400" /> Apply for this Internship
                </h2>

                {!isHiring ? (
                  <div className="flex gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-200/90">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p>This position is no longer accepting applications.</p>
                  </div>
                ) : deadlinePassed ? (
                  <div className="flex gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-200/90">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p>The application deadline has passed.</p>
                  </div>
                ) : myApplication || submitted ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-300">Application Submitted</span>
                      <Badge variant="amber" size="sm">Pending Review</Badge>
                    </div>
                    <div className="bg-surface-700/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Your cover letter:</p>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">{myApplication?.coverLetter || coverLetter}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Submitted {timeAgo(myApplication?.appliedAt || new Date().toISOString())}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="space-y-3">
                    <Input
                      as="textarea"
                      label="Cover letter"
                      value={coverLetter}
                      onChange={(e) => { setCoverLetter(e.target.value); setError(''); }}
                      placeholder="Why do you think you're a good fit for this role? Mention relevant experience, projects, or skills…"
                      error={error}
                      helperText={`${coverLetter.length} / 50 characters min.`}
                      rows={6}
                      required
                    />
                    <div className="flex justify-end">
                      <Button type="submit" loading={submitting} leftIcon={<Send size={14} />}>
                        Submit Application
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar — meta */}
          <div className="space-y-3">
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Details</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-300"><Clock     size={13} className="text-slate-500" /> {internship.duration}</div>
                <div className="flex items-center gap-2 text-slate-300"><MapPin    size={13} className="text-slate-500" /> {internship.location}</div>
                <div className="flex items-center gap-2 text-slate-300"><Banknote  size={13} className="text-slate-500" /> {internship.isPaid ? `Paid — ${internship.salary || 'TBD'}` : 'Unpaid'}</div>
                <div className="flex items-center gap-2 text-slate-300"><Calendar  size={13} className="text-slate-500" /> Apply by {formatDate(internship.applicationDeadline)}</div>
                <div className="flex items-center gap-2 text-slate-300"><Briefcase size={13} className="text-slate-500" /> Posted {timeAgo(internship.postedAt)}</div>
              </div>
            </div>

            <Link to="/internships" className="flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400 transition-colors">
              <ArrowLeft size={14} /> Back to all internships
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
