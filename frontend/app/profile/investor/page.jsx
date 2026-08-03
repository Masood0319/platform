"use client";

// app/profile/page.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { get, put, patch, del } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

/* ============================================
   ICONS
   Small inline SVG set — avoids adding an icon
   library as a dependency.
============================================ */

const Icon = {
  Check: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
  ),
  Star: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6L10 1.5z" /></svg>
  ),
  Pencil: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M13.6 2.4a1.5 1.5 0 012.1 0l1.9 1.9a1.5 1.5 0 010 2.1L7 17l-4.5 1 1-4.5L13.6 2.4z" /></svg>
  ),
  Share: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M13 4.5a2.5 2.5 0 11.702 1.737L7.83 9.577a2.51 2.51 0 010 .846l5.872 3.34a2.5 2.5 0 11-.702 1.301l-5.872-3.34a2.5 2.5 0 110-3.448l5.872-3.34A2.5 2.5 0 0113 4.5z" /></svg>
  ),
  Link: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M12.2 6.8a3 3 0 010 4.24l-2.83 2.83a3 3 0 01-4.24-4.24l1.06-1.06a1 1 0 111.42 1.42L6.55 10.1a1 1 0 001.42 1.42l2.83-2.83a1 1 0 000-1.42 1 1 0 011.42-1.47zM7.8 13.2a3 3 0 010-4.24l2.83-2.83a3 3 0 014.24 4.24l-1.06 1.06a1 1 0 11-1.42-1.42l1.06-1.06a1 1 0 00-1.42-1.42L9.2 9.9a1 1 0 000 1.42 1 1 0 01-1.4 1.88z" /></svg>
  ),
  Globe: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="10" cy="10" r="7.5" /><path d="M2.5 10h15M10 2.5c2.2 2.1 3.3 4.8 3.3 7.5s-1.1 5.4-3.3 7.5c-2.2-2.1-3.3-4.8-3.3-7.5S7.8 4.6 10 2.5z" /></svg>
  ),
  LinkedIn: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M4.98 3.5a1.98 1.98 0 11-.02 3.96 1.98 1.98 0 01.02-3.96zM3 8.98h4V17H3V8.98zM8.98 8.98h3.83v1.1h.05c.53-.96 1.83-1.98 3.77-1.98 4.03 0 4.78 2.5 4.78 5.76V17h-4v-4.14c0-.99-.02-2.26-1.38-2.26-1.38 0-1.6 1.07-1.6 2.19V17h-4V8.98z" /></svg>
  ),
  Mail: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="2.5" y="4.5" width="15" height="11" rx="1.5" /><path d="M3 5.5l7 5.5 7-5.5" /></svg>
  ),
  Pin: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M10 18s6-5.2 6-9.8A6 6 0 004 8.2C4 12.8 10 18 10 18z" /><circle cx="10" cy="8" r="2.2" /></svg>
  ),
  Eye: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6z" /><circle cx="10" cy="10" r="2.4" /></svg>
  ),
  Send: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M2.5 10L17 3l-4.3 14.5-4-5.6-6.2-1.9z" /></svg>
  ),
  Inbox: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M2.5 11.5L5 4.5h10l2.5 7" /><path d="M2.5 11.5H7a3 3 0 006 0h4.5V16a1 1 0 01-1 1H3.5a1 1 0 01-1-1v-4.5z" /></svg>
  ),
  Handshake: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M2 9l3.5-3 3 2 2.5-2 3.5 1 3.5 3-2.5 2.5-2-1.5-2 2-2-1-2.5 2L2 9z" /></svg>
  ),
  Briefcase: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="2.5" y="6.5" width="15" height="10" rx="1.5" /><path d="M7 6.5V5a2 2 0 012-2h2a2 2 0 012 2v1.5" /></svg>
  ),
  Bolt: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M11 1L3 11.5h5L8 19l9-11.5h-5.5L11 1z" /></svg>
  ),
  Doc: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M5 2.5h7l3.5 3.5V17a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z" /><path d="M12 2.5V6h3.5" /></svg>
  ),
  Video: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="2" y="5" width="11" height="10" rx="1.5" /><path d="M13 8.3l4.5-2.6v8.6L13 11.7" /></svg>
  ),
  Shield: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M10 2l6.5 2.4V9c0 4.6-2.9 7.6-6.5 9-3.6-1.4-6.5-4.4-6.5-9V4.4L10 2z" /></svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="4" y="9" width="12" height="8" rx="1.5" /><path d="M6.5 9V6a3.5 3.5 0 017 0v3" /></svg>
  ),
  Bell: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M5 8a5 5 0 0110 0c0 4 1.5 5 1.5 5h-13S5 12 5 8z" /><path d="M8.3 16a1.8 1.8 0 003.4 0" /></svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 5.5h12M8 5.5V4a1 1 0 011-1h2a1 1 0 011 1v1.5M6 5.5V16a1 1 0 001 1h6a1 1 0 001-1V5.5" /></svg>
  ),
  Upload: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 15.5h12" /></svg>
  ),
  ChevronRight: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M7.3 4.7a1 1 0 011.4 0l5 5a1 1 0 010 1.4l-5 5a1 1 0 01-1.4-1.4L11.6 10 7.3 6.1a1 1 0 010-1.4z" /></svg>
  ),
  Building: (p) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="4" y="2.5" width="9" height="15" rx="1" /><path d="M13 8h2.5v9.5H13M7 6h1M10 6h1M7 9h1M10 9h1M7 12h1M10 12h1" /></svg>
  ),
};

/* ============================================
   SMALL PRESENTATIONAL PRIMITIVES
============================================ */

function Badge({ tone = 'blue', children, className = '' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
    gray: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

function Card({ children, className = '', noPad = false }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-shadow duration-300 animate-fade-in ${noPad ? '' : 'p-6'} ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-base font-semibold text-gray-900 tracking-tight">{children}</h3>
      {action}
    </div>
  );
}

function EmptyState({ icon: IconCmp, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center mb-3">
        <IconCmp className="w-5 h-5 text-gray-400" />
      </div>
      <p className="font-medium text-gray-700">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1 max-w-sm">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function FieldRow({ label, value, empty = 'Not set' }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm text-gray-900">{value || <span className="text-gray-400 font-normal">{empty}</span>}</p>
    </div>
  );
}

function SkeletonBlock({ className = '' }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />;
}

function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 hover:shadow transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* Circular progress ring for profile completion */
function CompletionRing({ percent = 0, size = 56 }) {
  const stroke = 4.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#2563EB"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-900">{percent}%</span>
      </div>
    </div>
  );
}

/* ============================================
   HELPERS
============================================ */

const currency = (n) => {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1)}K`;
  return `$${num.toLocaleString()}`;
};

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || 'U';

const ACTIVITY_META = {
  startup_published: { label: 'Startup published', icon: Icon.Bolt, tone: 'green' },
  startup_updated: { label: 'Startup updated', icon: Icon.Pencil, tone: 'blue' },
  interest_sent: { label: 'Interest sent', icon: Icon.Send, tone: 'blue' },
  interest_received: { label: 'Interest received', icon: Icon.Inbox, tone: 'amber' },
  match_created: { label: 'New match', icon: Icon.Handshake, tone: 'green' },
  deal_room_opened: { label: 'Deal room opened', icon: Icon.Briefcase, tone: 'blue' },
  funding_closed: { label: 'Funding closed', icon: Icon.Check, tone: 'green' },
  default: { label: 'Activity', icon: Icon.Bell, tone: 'gray' },
};

const DOCUMENT_TYPES = [
  { key: 'pitchDeck', label: 'Pitch Deck', icon: Icon.Doc },
  { key: 'onePager', label: 'One Pager', icon: Icon.Doc },
  { key: 'financialSummary', label: 'Financial Summary', icon: Icon.Doc },
  { key: 'nda', label: 'NDA Status', icon: Icon.Shield },
  { key: 'companyRegistration', label: 'Company Registration', icon: Icon.Building },
  { key: 'verificationDocuments', label: 'Verification Documents', icon: Icon.Shield },
];

/* Fields used to compute profile completion, per role */
const completionFields = (role) => {
  const base = [
    { key: 'name', label: 'Full name' },
    { key: 'bio', label: 'Bio' },
    { key: 'location', label: 'Location' },
    { key: 'website', label: 'Website' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'phoneNumber', label: 'Phone number' },
  ];
  if (role === 'founder') {
    return [...base,
      { key: 'companyName', label: 'Company name' },
      { key: 'title', label: 'Title' },
      { key: 'experience', label: 'Experience' },
    ];
  }
  if (role === 'investor') {
    return [...base,
      { key: 'firmName', label: 'Firm name' },
      { key: 'entityType', label: 'Entity type' },
      { key: 'industries', label: 'Preferred industries' },
      { key: 'thesis', label: 'Investment thesis' },
    ];
  }
  return base;
};

/* ============================================
   MAIN COMPONENT
============================================ */

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({});
  const [startups, setStartups] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // ============================================
  // FETCH USER DATA
  // ============================================

  const fetchProfileData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Fetch user's startups (if founder)
      if (user.role === 'founder') {
        const startupsRes = await get('/startups/mine');
        if (startupsRes?.success) {
          setStartups(startupsRes.data || []);
        }
      }

      // Fetch user's deals
      const dealsRes = await get('/deal-rooms');
      if (dealsRes?.success) {
        setDeals(dealsRes.data || []);
      }

      // Fetch user's activity/notifications
      const activityRes = await get('/notifications?limit=10');
      if (activityRes?.success) {
        setActivity(activityRes.data || []);
      }

      // Fetch user stats
      if (user.role === 'founder') {
        const statsRes = await get('/founder/startups/stats');
        if (statsRes?.success) {
          setStats(statsRes.data || {});
        }
      } else if (user.role === 'investor') {
        const statsRes = await get('/investors/me/stats');
        if (statsRes?.success) {
          setStats(statsRes.data || {});
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        linkedin: user.linkedin || '',
        twitter: user.twitter || '',
        phoneNumber: user.phoneNumber || '',
        ...(user.role === 'investor' && {
          entityType: user.investorProfile?.entityType || '',
          firmName: user.investorProfile?.firmName || '',
          minInvestment: user.investorProfile?.investmentRange?.min || '',
          maxInvestment: user.investorProfile?.investmentRange?.max || '',
          industries: user.investorProfile?.industries?.join(', ') || '',
          countries: user.investorProfile?.countries?.join(', ') || '',
          thesis: user.investorProfile?.thesis || '',
        }),
        ...(user.role === 'founder' && {
          companyName: user.founderProfile?.companyName || '',
          title: user.founderProfile?.title || '',
          experience: user.founderProfile?.experience || '',
        }),
      });

      fetchProfileData();
    }
  }, [user, fetchProfileData]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!error && !success) return;
    const t = setTimeout(() => {
      setError('');
      setSuccess('');
    }, 4000);
    return () => clearTimeout(t);
  }, [error, success]);

  // ============================================
  // PROFILE COMPLETION (derived, client-side)
  // ============================================

  const completion = useMemo(() => {
    const fields = completionFields(user?.role);
    const completed = [];
    const missing = [];
    fields.forEach((f) => {
      const val = formData[f.key];
      if (val && String(val).trim().length > 0) completed.push(f);
      else missing.push(f);
    });
    const percent = fields.length ? Math.round((completed.length / fields.length) * 100) : 0;
    return { percent, completed, missing, total: fields.length };
  }, [formData, user?.role]);

  // ============================================
  // HANDLE FORM CHANGE
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ============================================
  // HANDLE PROFILE UPDATE
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const updateData = { ...formData };

      // Format arrays for investor profile
      if (user.role === 'investor') {
        updateData.investorProfile = {
          entityType: formData.entityType,
          firmName: formData.firmName,
          investmentRange: {
            min: parseInt(formData.minInvestment) || 0,
            max: parseInt(formData.maxInvestment) || 0,
          },
          industries: formData.industries.split(',').map((s) => s.trim()).filter(Boolean),
          countries: formData.countries.split(',').map((s) => s.trim()).filter(Boolean),
          thesis: formData.thesis,
        };
        delete updateData.entityType;
        delete updateData.firmName;
        delete updateData.minInvestment;
        delete updateData.maxInvestment;
        delete updateData.industries;
        delete updateData.countries;
        delete updateData.thesis;
      }

      if (user.role === 'founder') {
        updateData.founderProfile = {
          companyName: formData.companyName,
          title: formData.title,
          experience: formData.experience,
        };
        delete updateData.companyName;
        delete updateData.title;
        delete updateData.experience;
      }

      const response = await put('/users/profile', updateData);

      if (response?.success) {
        setSuccess('Profile updated successfully!');
        updateUser(response.data);
        setEditing(false);
      } else {
        setError(response?.message || 'Failed to update profile');
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // HANDLE STARTUP ACTIONS
  // ============================================

  const handleDeleteStartup = async (startupId) => {
    if (!confirm('Are you sure you want to delete this startup?')) return;

    try {
      const response = await del(`/startups/${startupId}`);
      if (response?.success) {
        setStartups((prev) => prev.filter((s) => s._id !== startupId));
        setSuccess('Startup deleted successfully');
      }
    } catch (error) {
      setError(error.message || 'Failed to delete startup');
    }
  };

  const handlePublishStartup = async (startupId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const response = await patch(`/startups/${startupId}/publish`, { status: newStatus });
      if (response?.success) {
        setStartups((prev) => prev.map((s) => (s._id === startupId ? { ...s, status: newStatus } : s)));
        setSuccess(`Startup ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      }
    } catch (error) {
      setError(error.message || 'Failed to update startup status');
    }
  };

  // ============================================
  // HEADER ACTIONS — SHARE / COPY LINK
  // ============================================

  const profileUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/founders/${user?._id || user?.username || ''}`;
  }, [user]);

  const handleShareProfile = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${user?.name} on the platform`,
          text: `Check out ${user?.name}'s profile`,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        setSuccess('Profile link copied to clipboard');
      }
    } catch {
      // user cancelled share — no-op
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setError('Could not copy link');
    }
  };

  // ============================================
  // RENDER: HEADER
  // ============================================

  const renderHeader = () => {
    const verificationLabel = user?.role === 'founder' ? 'Verified Founder' : user?.role === 'investor' ? 'Verified Investor' : 'Verified';

    return (
      <Card noPad className="overflow-hidden mb-6">
        {/* Cover banner */}
        <div
          className="relative h-32 sm:h-44 md:h-52 w-full"
          style={{
            backgroundImage: user?.coverImage
              ? `url(${user.coverImage})`
              : 'linear-gradient(120deg, #1e3a8a 0%, #2563eb 45%, #3b82f6 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!user?.coverImage && (
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0" />

          {/* Header actions */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/90 backdrop-blur text-gray-700 hover:bg-white transition-colors shadow-sm"
            >
              <Icon.Link className="w-3.5 h-3.5" />
              {linkCopied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handleShareProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/90 backdrop-blur text-gray-700 hover:bg-white transition-colors shadow-sm"
            >
              <Icon.Share className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        {/* Identity row */}
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14">
            <div className="flex items-end gap-4">
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-100 ring-4 ring-white shadow-lg flex items-center justify-center overflow-hidden">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-semibold text-gray-400">{initials(user?.name)}</span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5 shadow ring-1 ring-gray-100">
                  <CompletionRing percent={completion.percent} size={34} />
                </div>
              </div>

              <div className="pb-1 sm:pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{user?.name}</h1>
                  {(user?.verified || user?.verificationBadge) && (
                    <Badge tone="amber">
                      <Icon.Star className="w-3 h-3" />
                      {verificationLabel}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {user?.role === 'founder'
                    ? user?.founderProfile?.title || 'Founder'
                    : user?.role === 'investor'
                    ? user?.investorProfile?.firmName || 'Investor'
                    : user?.email}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge tone="blue" className="capitalize">{user?.role || 'No role set'}</Badge>
                  {user?.location && (
                    <Badge tone="gray">
                      <Icon.Pin className="w-3 h-3" />
                      {user.location}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:pb-2">
              <PrimaryButton onClick={() => setEditing((v) => !v)}>
                <Icon.Pencil className="w-3.5 h-3.5" />
                {editing ? 'Cancel Editing' : 'Edit Profile'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // ============================================
  // RENDER: PROFESSIONAL INFO CARDS
  // ============================================

  const renderProfessionalInfo = () => {
    if (user?.role === 'founder') {
      const fp = user?.founderProfile || {};
      return (
        <Card>
          <SectionTitle>Company Information</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
            <FieldRow label="Company Name" value={fp.companyName} />
            <FieldRow label="Founder Name" value={user?.name} />
            <FieldRow label="Role / Title" value={fp.title} />
            <FieldRow label="Industry" value={fp.industry} />
            <FieldRow label="Country" value={user?.location} />
            <FieldRow label="Startup Stage" value={fp.stage} />
            <FieldRow label="Funding Goal" value={fp.fundingGoal ? currency(fp.fundingGoal) : null} />
            <FieldRow label="Amount Raised" value={fp.amountRaised ? currency(fp.amountRaised) : null} />
            <FieldRow label="Team Size" value={fp.teamSize} />
            <FieldRow label="Founded Year" value={fp.foundedYear} />
            <FieldRow
              label="Website"
              value={user?.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  <Icon.Globe className="w-3.5 h-3.5" /> {user.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            />
            <FieldRow
              label="LinkedIn"
              value={user?.linkedin && (
                <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  <Icon.LinkedIn className="w-3.5 h-3.5" /> View Profile
                </a>
              )}
            />
            <FieldRow
              label="Pitch Deck"
              value={fp.pitchDeckUrl && (
                <a href={fp.pitchDeckUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Deck</a>
              )}
            />
            <FieldRow
              label="Demo Video"
              value={fp.demoVideoUrl && (
                <a href={fp.demoVideoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Watch Video</a>
              )}
            />
          </div>
        </Card>
      );
    }

    if (user?.role === 'investor') {
      const ip = user?.investorProfile || {};
      return (
        <Card>
          <SectionTitle>Investor Information</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
            <FieldRow label="Firm Name" value={ip.firmName} />
            <FieldRow label="Investor Type" value={ip.entityType?.replace(/_/g, ' ')} />
            <FieldRow label="Investment Stage" value={ip.stage} />
            <FieldRow label="Preferred Industries" value={ip.industries?.join(', ')} />
            <FieldRow
              label="Check Size"
              value={
                (ip.investmentRange?.min || ip.investmentRange?.max)
                  ? `${currency(ip.investmentRange?.min)} - ${currency(ip.investmentRange?.max)}`
                  : null
              }
            />
            <FieldRow label="Countries" value={ip.countries?.join(', ')} />
            <FieldRow label="Portfolio Size" value={ip.portfolio?.length ?? ip.portfolioSize} />
            <FieldRow
              label="Website"
              value={user?.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  <Icon.Globe className="w-3.5 h-3.5" /> {user.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            />
            <FieldRow
              label="LinkedIn"
              value={user?.linkedin && (
                <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  <Icon.LinkedIn className="w-3.5 h-3.5" /> View Profile
                </a>
              )}
            />
          </div>
        </Card>
      );
    }

    return null;
  };

  // ============================================
  // RENDER: ABOUT
  // ============================================

  const renderAbout = () => (
    <Card>
      <SectionTitle>About</SectionTitle>
      {user?.bio ? (
        <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{user.bio}</p>
      ) : (
        <EmptyState
          icon={Icon.Doc}
          title="No bio yet"
          subtitle="Add a short summary so founders and investors understand who you are and what you're looking for."
          action={<SecondaryButton onClick={() => setEditing(true)}>Add Bio</SecondaryButton>}
        />
      )}
      {user?.role === 'investor' && user?.investorProfile?.thesis && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1.5">Investment Thesis</p>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{user.investorProfile.thesis}</p>
        </div>
      )}
    </Card>
  );

  // ============================================
  // RENDER: STATS
  // ============================================

  const STAT_META = {
    profileViews: { label: 'Profile Views', icon: Icon.Eye },
    interestsSent: { label: 'Interests Sent', icon: Icon.Send },
    interestsReceived: { label: 'Interests Received', icon: Icon.Inbox },
    matches: { label: 'Matches', icon: Icon.Handshake },
    activeDeals: { label: 'Active Deals', icon: Icon.Briefcase },
    responseRate: { label: 'Response Rate', icon: Icon.Bolt, suffix: '%' },
    successRate: { label: 'Success Rate', icon: Icon.Check, suffix: '%' },
  };

  const renderStats = () => {
    const entries = Object.keys(STAT_META).map((key) => ({
      key,
      ...STAT_META[key],
      value: stats?.[key],
    }));
    const hasAny = entries.some((e) => e.value !== undefined && e.value !== null);

    return (
      <Card>
        <SectionTitle>Statistics</SectionTitle>
        {!hasAny ? (
          <EmptyState icon={Icon.Bolt} title="No statistics yet" subtitle="Your activity on the platform will show up here." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {entries.map(({ key, label, icon: IconCmp, value, suffix }) => (
              <div
                key={key}
                className="group bg-gray-50 hover:bg-blue-50 rounded-xl p-4 text-center transition-colors duration-200"
              >
                <div className="w-8 h-8 mx-auto rounded-lg bg-white ring-1 ring-gray-200 group-hover:ring-blue-200 flex items-center justify-center mb-2 transition-colors">
                  <IconCmp className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {value ?? 0}{suffix || ''}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  // ============================================
  // RENDER: PROFILE COMPLETION CARD
  // ============================================

  const renderCompletionCard = () => (
    <Card>
      <SectionTitle>Profile Completion</SectionTitle>
      <div className="flex items-center gap-4 mb-5">
        <CompletionRing percent={completion.percent} size={64} />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {completion.completed.length} of {completion.total} fields complete
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {completion.percent === 100 ? 'Your profile is complete — nice work!' : 'A complete profile earns more trust from the other side of the table.'}
          </p>
        </div>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${completion.percent}%` }}
        />
      </div>

      {completion.missing.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Suggestions to reach 100%</p>
          <div className="space-y-1.5">
            {completion.missing.slice(0, 5).map((f) => (
              <button
                key={f.key}
                onClick={() => setEditing(true)}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-sm text-gray-600">Add your {f.label.toLowerCase()}</span>
                <Icon.ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  // ============================================
  // RENDER: EDIT FORM
  // ============================================

  const renderEditForm = () => (
    <Card>
      <SectionTitle>Edit Profile</SectionTitle>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
            <input
              type="url"
              name="linkedin"
              value={formData.linkedin || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Twitter URL</label>
            <input
              type="url"
              name="twitter"
              value={formData.twitter || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              rows="4"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Investor-specific fields */}
          {user?.role === 'investor' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                <select
                  name="entityType"
                  value={formData.entityType || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="">Select entity type</option>
                  <option value="angel">Angel</option>
                  <option value="vc">VC</option>
                  <option value="family_office">Family Office</option>
                  <option value="corporate_vc">Corporate VC</option>
                  <option value="fund_of_funds">Fund of Funds</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Firm Name</label>
                <input
                  type="text"
                  name="firmName"
                  value={formData.firmName || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Investment ($)</label>
                <input
                  type="number"
                  name="minInvestment"
                  value={formData.minInvestment || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Investment ($)</label>
                <input
                  type="number"
                  name="maxInvestment"
                  value={formData.maxInvestment || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Industries (comma separated)</label>
                <input
                  type="text"
                  name="industries"
                  value={formData.industries || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Fintech, AI, SaaS, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Countries (comma separated)</label>
                <input
                  type="text"
                  name="countries"
                  value={formData.countries || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="UAE, KSA, Singapore, etc."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Investment Thesis</label>
                <textarea
                  name="thesis"
                  value={formData.thesis || ''}
                  onChange={handleChange}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Describe your investment philosophy..."
                />
              </div>
            </>
          )}

          {/* Founder-specific fields */}
          {user?.role === 'founder' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title/Position</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <SecondaryButton type="button" onClick={() => setEditing(false)}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </PrimaryButton>
        </div>
      </form>
    </Card>
  );

  // ============================================
  // RENDER: STARTUPS (Founder) / PORTFOLIO (Investor)
  // ============================================

  const renderStartups = () => (
    <Card>
      <SectionTitle
        action={
          <PrimaryButton onClick={() => router.push('/startups/create')}>+ Create Startup</PrimaryButton>
        }
      >
        Your Startups
      </SectionTitle>

      {startups.length === 0 ? (
        <EmptyState
          icon={Icon.Building}
          title="No startups yet"
          subtitle="Create your first startup profile to start reaching investors."
          action={<PrimaryButton onClick={() => router.push('/startups/create')}>+ Create Startup</PrimaryButton>}
        />
      ) : (
        <div className="grid gap-4">
          {startups.map((startup) => {
            const goal = startup.fundingTarget || startup.fundingGoal || 0;
            const raised = startup.amountRaised || 0;
            const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
            return (
              <div
                key={startup._id}
                className="border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-100 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900">{startup.startupName}</h4>
                      <Badge tone={startup.status === 'published' ? 'green' : startup.status === 'archived' ? 'gray' : 'amber'}>
                        {startup.status || 'draft'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{startup.sector} • {startup.stage}</p>
                  </div>
                  <div className="flex gap-2">
                    <SecondaryButton className="!px-3 !py-1.5 text-xs" onClick={() => router.push(`/startups/${startup._id}`)}>
                      View Startup
                    </SecondaryButton>
                    <SecondaryButton className="!px-3 !py-1.5 text-xs" onClick={() => router.push(`/startups/${startup._id}/edit`)}>
                      Edit
                    </SecondaryButton>
                    <button
                      onClick={() => handlePublishStartup(startup._id, startup.status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg ring-1 ring-inset transition-colors ${
                        startup.status === 'published'
                          ? 'text-amber-700 ring-amber-300 hover:bg-amber-50'
                          : 'text-emerald-700 ring-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      {startup.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDeleteStartup(startup._id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Funding progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>{currency(raised)} raised of {currency(goal)} goal</span>
                    <span className="font-semibold text-gray-700">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Traction metrics */}
                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1"><Icon.Eye className="w-4 h-4" /> {startup.viewCount || 0} views</span>
                  <span className="inline-flex items-center gap-1"><Icon.Handshake className="w-4 h-4" /> {startup.interestCount || 0} interests</span>
                  {startup.mrr != null && <span>MRR: {currency(startup.mrr)}</span>}
                  {startup.growthRate != null && <span>Growth: {startup.growthRate}%</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const renderPortfolio = () => {
    const ip = user?.investorProfile || {};
    const portfolio = ip.portfolio || [];
    return (
      <Card>
        <SectionTitle>Portfolio Companies</SectionTitle>
        {portfolio.length === 0 ? (
          <EmptyState
            icon={Icon.Briefcase}
            title="No portfolio companies listed"
            subtitle="Companies you've invested in through the platform will appear here."
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {portfolio.map((c, i) => (
              <div key={c._id || i} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-semibold">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.sector} {c.investedAt ? `• Invested ${new Date(c.investedAt).getFullYear()}` : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(ip.industries?.length || ip.stage) && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Investment Focus</p>
            <div className="flex flex-wrap gap-2">
              {ip.industries?.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}
              {ip.stage && <Badge tone="gray">{ip.stage}</Badge>}
            </div>
          </div>
        )}
      </Card>
    );
  };

  // ============================================
  // RENDER: ACTIVITY (business events only)
  // ============================================

  const renderActivity = () => (
    <Card>
      <SectionTitle>Recent Activity</SectionTitle>
      {activity.length === 0 ? (
        <EmptyState icon={Icon.Bell} title="No recent activity" subtitle="Business updates like published startups, sent interests, and new matches will show up here." />
      ) : (
        <div className="space-y-1">
          {activity.map((item) => {
            const meta = ACTIVITY_META[item.type] || ACTIVITY_META.default;
            const IconCmp = meta.icon;
            return (
              <div key={item._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  meta.tone === 'green' ? 'bg-emerald-50 text-emerald-600' :
                  meta.tone === 'amber' ? 'bg-amber-50 text-amber-600' :
                  meta.tone === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  <IconCmp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{item.title || meta.label}</p>
                    {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </div>
                  <p className="text-sm text-gray-500">{item.message}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  // ============================================
  // RENDER: DEALS
  // ============================================

  const renderDeals = () => (
    <Card>
      <SectionTitle>Your Deals</SectionTitle>
      {deals.length === 0 ? (
        <EmptyState icon={Icon.Handshake} title="No deals yet" subtitle="Active deal rooms with founders or investors will appear here." />
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => (
            <div key={deal._id} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Icon.Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Deal #{deal._id.slice(-6)}</p>
                  <p className="text-xs text-gray-500">Status: {deal.status}</p>
                </div>
              </div>
              <Badge tone={deal.status === 'closed' ? 'green' : deal.status === 'active' ? 'blue' : 'amber'}>
                {deal.status || 'active'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  // ============================================
  // RENDER: DOCUMENTS
  // ============================================

  const renderDocuments = () => {
    const docs = user?.documents || {};
    return (
      <Card>
        <SectionTitle
          action={<SecondaryButton className="!px-3 !py-1.5 text-xs"><Icon.Upload className="w-3.5 h-3.5" /> Upload</SecondaryButton>}
        >
          Documents
        </SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {DOCUMENT_TYPES.map(({ key, label, icon: IconCmp }) => {
            const doc = docs[key];
            return (
              <div key={key} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:border-blue-100 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${doc ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                    <IconCmp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">
                      {doc?.uploadedAt ? `Uploaded ${new Date(doc.uploadedAt).toLocaleDateString()}` : 'Not uploaded'}
                    </p>
                  </div>
                </div>
                {doc ? (
                  <Badge tone={key === 'nda' ? (doc.status === 'signed' ? 'green' : 'amber') : 'green'}>
                    {key === 'nda' ? doc.status || 'pending' : 'Uploaded'}
                  </Badge>
                ) : (
                  <button className="text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0">Add</button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  // ============================================
  // RENDER: CONTACT
  // ============================================

  const renderContact = () => {
    const isPublicView = false; // TODO: wire to real privacy/visibility context when viewing another user's profile
    const privacy = user?.privacySettings || {};

    const showEmail = !isPublicView || !privacy.hideEmail;
    const showPhone = !isPublicView || !privacy.hidePhone;

    return (
      <Card>
        <SectionTitle>Contact</SectionTitle>
        <div className="space-y-3.5">
          {showEmail && (
            <div className="flex items-center gap-3">
              <Icon.Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{user?.email}</span>
            </div>
          )}
          {showPhone && user?.phoneNumber && (
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 shrink-0" />
              <span className="text-sm text-gray-700">{user.phoneNumber}</span>
            </div>
          )}
          {user?.website && (
            <div className="flex items-center gap-3">
              <Icon.Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {user?.linkedin && (
            <div className="flex items-center gap-3">
              <Icon.LinkedIn className="w-4 h-4 text-gray-400 shrink-0" />
              <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                LinkedIn Profile
              </a>
            </div>
          )}
          {user?.location && (
            <div className="flex items-center gap-3">
              <Icon.Pin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{user.location}</span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // ============================================
  // RENDER: SETTINGS
  // ============================================

  const renderSettings = () => {
    const items = [
      { key: 'privacy', label: 'Privacy Settings', desc: 'Control who can see your contact details and profile', icon: Icon.Eye, path: '/settings/privacy' },
      { key: 'notifications', label: 'Notification Preferences', desc: 'Choose which updates you get and how', icon: Icon.Bell, path: '/settings/notifications' },
      { key: 'security', label: 'Account Security', desc: 'Manage sessions and login activity', icon: Icon.Shield, path: '/settings/security' },
      { key: 'password', label: 'Change Password', desc: 'Update your account password', icon: Icon.Lock, path: '/settings/password' },
      { key: '2fa', label: 'Two-Factor Authentication', desc: user?.twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security', icon: Icon.Shield, path: '/settings/2fa', badge: user?.twoFactorEnabled ? 'On' : 'Off' },
    ];

    return (
      <div className="space-y-6">
        <Card noPad>
          <div className="divide-y divide-gray-100">
            {items.map(({ key, label, desc, icon: IconCmp, path, badge }) => (
              <button
                key={key}
                onClick={() => router.push(path)}
                className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                    <IconCmp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {badge && <Badge tone={badge === 'On' ? 'green' : 'gray'}>{badge}</Badge>}
                  <Icon.ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="ring-1 ring-red-100">
          <SectionTitle>Danger Zone</SectionTitle>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Delete Account</p>
              <p className="text-xs text-gray-500 mt-0.5">Permanently remove your account and all associated data. This cannot be undone.</p>
            </div>
            <button
              onClick={() => router.push('/settings/delete-account')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0"
            >
              <Icon.Trash className="w-3.5 h-3.5" />
              Delete Account
            </button>
          </div>
        </Card>
      </div>
    );
  };

  // ============================================
  // LOADING / SKELETON STATE
  // ============================================

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <SkeletonBlock className="h-52 w-full mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonBlock className="h-64 w-full" />
            <SkeletonBlock className="h-40 w-full" />
          </div>
          <div className="space-y-6">
            <SkeletonBlock className="h-48 w-full" />
            <SkeletonBlock className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'profile', label: 'Profile' },
    ...(user.role === 'founder' ? [{ key: 'startups', label: 'Startups' }] : []),
    ...(user.role === 'investor' ? [{ key: 'portfolio', label: 'Portfolio' }] : []),
    { key: 'deals', label: 'Deals' },
    { key: 'documents', label: 'Documents' },
    { key: 'activity', label: 'Activity' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toasts */}
      {error && (
        <div className="fixed top-5 right-5 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg animate-fade-in max-w-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg shadow-lg animate-fade-in max-w-sm">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Profile</h1>
      </div>

      {renderHeader()}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading && activeTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonBlock className="h-64 w-full" />
            <SkeletonBlock className="h-40 w-full" />
          </div>
          <div className="space-y-6">
            <SkeletonBlock className="h-48 w-full" />
            <SkeletonBlock className="h-48 w-full" />
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {editing ? renderEditForm() : renderProfessionalInfo()}
                {!editing && renderAbout()}
                {!editing && renderStats()}
              </div>
              <div className="space-y-6">
                {renderCompletionCard()}
                {renderContact()}
              </div>
            </div>
          )}

          {activeTab === 'startups' && renderStartups()}
          {activeTab === 'portfolio' && renderPortfolio()}
          {activeTab === 'deals' && renderDeals()}
          {activeTab === 'documents' && renderDocuments()}
          {activeTab === 'activity' && renderActivity()}
          {activeTab === 'settings' && renderSettings()}
        </>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.35s ease-out;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}