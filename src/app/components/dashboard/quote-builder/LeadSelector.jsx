'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/app/components/ui/input';
import { Search, User, X } from 'lucide-react';

export default function LeadSelector({ onSelect }) {
  const [query, setQuery] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Fetch leads once on mount
  useEffect(() => {
    setLoading(true);
    fetch('/api/leads')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setLeads(data || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter leads by search query
  const filtered = query.trim().length > 0
    ? leads.filter((lead) => {
        const q = query.toLowerCase();
        return (
          lead.name?.toLowerCase().includes(q) ||
          lead.email?.toLowerCase().includes(q) ||
          lead.plaatsnaam?.toLowerCase().includes(q) ||
          lead.phone?.includes(q)
        );
      }).slice(0, 8)
    : leads.slice(0, 8);

  const handleSelect = useCallback((lead) => {
    onSelect({
      lead_id: lead.id,
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      straat: lead.straat || '',
      postcode: lead.postcode || '',
      plaatsnaam: lead.plaatsnaam || '',
    });
    setQuery('');
    setOpen(false);
  }, [onSelect]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Zoek aanvraag op naam, e-mail of plaats..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="text-sm pl-8 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">Laden...</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              {query ? 'Geen resultaten' : 'Geen aanvragen'}
            </div>
          ) : (
            filtered.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => handleSelect(lead)}
                className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b last:border-0"
              >
                <User className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[lead.plaatsnaam, lead.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
