import React, { useState, useMemo } from 'react';
import { Contact, Screen } from '../types';
import { SPECIALTY_COLORS } from '../sampleData';

interface Props {
  contacts: Contact[];
  onNavigate: (screen: Screen) => void;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function RolodexScreen({ contacts, onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(null);

  const specialties = useMemo(
    () => [...new Set(contacts.map(c => c.specialty))].sort(),
    [contacts],
  );

  const filtered = useMemo(() => contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.specialty.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q);
    const matchSpecialty = !activeSpecialty || c.specialty === activeSpecialty;
    return matchSearch && matchSpecialty;
  }), [contacts, search, activeSpecialty]);

  const sections = useMemo(() => {
    const grouped: Record<string, Contact[]> = {};
    filtered.forEach(c => {
      (grouped[c.specialty] ??= []).push(c);
    });
    return Object.keys(grouped).sort().map(title => ({ title, data: grouped[title] }));
  }, [filtered]);

  return (
    <div className="page">
      <div className="page-header">
        <span className="header-title">📇 Rolodex</span>
        <button className="btn-primary" onClick={() => onNavigate({ name: 'addEdit' })}>
          + Add Contact
        </button>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search by name, specialty, or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{ background: '#1a1f36', paddingBottom: 2 }}>
        <div className="filter-bar">
          {['All', ...specialties].map(s => {
            const isAll = s === 'All';
            const active = isAll ? activeSpecialty === null : activeSpecialty === s;
            const color = isAll ? '#6366f1' : (SPECIALTY_COLORS[s] ?? '#4A5568');
            return (
              <button
                key={s}
                className={`filter-chip${active ? ' active' : ''}`}
                style={active ? { backgroundColor: color, borderColor: color } : {}}
                onClick={() => setActiveSpecialty(isAll ? null : s)}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 16px 32px' }}>
        {sections.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📇</div>
            <div className="empty-title">No contacts found</div>
            <div className="empty-sub">
              {contacts.length === 0
                ? 'Click "+ Add Contact" to get started'
                : 'Try a different search or filter'}
            </div>
          </div>
        ) : (
          sections.map(({ title, data }) => {
            const color = SPECIALTY_COLORS[title] ?? '#4A5568';
            return (
              <div key={title}>
                <div
                  className="section-header"
                  style={{ borderLeftColor: color }}
                >
                  <div className="section-dot" style={{ backgroundColor: color }} />
                  <span className="section-title">{title}</span>
                  <span className="section-count">{data.length}</span>
                </div>
                {data.map(contact => (
                  <button
                    key={contact.id}
                    className="card"
                    onClick={() => onNavigate({ name: 'detail', contactId: contact.id })}
                  >
                    <div
                      className="avatar"
                      style={{ backgroundColor: color + '22', color }}
                    >
                      {initials(contact.name)}
                    </div>
                    <div className="card-info">
                      <div className="card-name">{contact.name}</div>
                      {contact.company && <div className="card-company">{contact.company}</div>}
                      {contact.phone && <div className="card-meta">{contact.phone}</div>}
                    </div>
                    <span className="card-chevron">›</span>
                  </button>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
