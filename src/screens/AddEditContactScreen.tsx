import React, { useState } from 'react';
import { Contact, Screen } from '../types';
import { SPECIALTIES, SPECIALTY_COLORS } from '../sampleData';

interface Props {
  contact?: Contact;
  onSave: (contact: Contact) => void;
  onNavigate: (screen: Screen) => void;
}

export default function AddEditContactScreen({ contact, onSave, onNavigate }: Props) {
  const isEdit = Boolean(contact);
  const [name, setName] = useState(contact?.name ?? '');
  const [specialty, setSpecialty] = useState(contact?.specialty ?? SPECIALTIES[0]);
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [company, setCompany] = useState(contact?.company ?? '');
  const [notes, setNotes] = useState(contact?.notes ?? '');
  const [showPicker, setShowPicker] = useState(false);
  const [nameError, setNameError] = useState('');

  const color = SPECIALTY_COLORS[specialty] ?? '#4A5568';

  function handleSave() {
    if (!name.trim()) { setNameError('Name is required'); return; }
    const saved: Contact = {
      id: contact?.id ?? String(Date.now()),
      name: name.trim(),
      specialty,
      phone: phone.trim(),
      email: email.trim(),
      company: company.trim(),
      notes: notes.trim(),
      createdAt: contact?.createdAt ?? new Date().toISOString().split('T')[0],
    };
    onSave(saved);
    onNavigate({ name: 'detail', contactId: saved.id });
  }

  function goBack() {
    onNavigate(contact ? { name: 'detail', contactId: contact.id } : { name: 'rolodex' });
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-ghost" onClick={goBack}>Cancel</button>
        <span className="header-title" style={{ fontSize: 17 }}>
          {isEdit ? 'Edit Contact' : 'New Contact'}
        </span>
        <button className="btn-primary" onClick={handleSave}>Save</button>
      </div>

      <div className="page-content">

        <div className="info-section">
          <div className="section-label">Basic Info</div>
          <div className="form-card">
            <div className="form-field">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                value={name}
                onChange={e => { setName(e.target.value); setNameError(''); }}
                placeholder="e.g. Dr. Jane Smith"
              />
              {nameError && <div className="form-error">{nameError}</div>}
            </div>
          </div>
        </div>

        <div className="info-section">
          <div className="section-label">Specialty</div>
          <button className="specialty-selector" onClick={() => setShowPicker(v => !v)}>
            <div className="specialty-selector-dot" style={{ backgroundColor: color }} />
            <span className="specialty-selector-name">{specialty}</span>
            <span className="specialty-selector-arrow">{showPicker ? '▲' : '▼'}</span>
          </button>
          {showPicker && (
            <div className="specialty-grid">
              {SPECIALTIES.map(s => {
                const c = SPECIALTY_COLORS[s] ?? '#4A5568';
                const active = s === specialty;
                return (
                  <button
                    key={s}
                    className={`specialty-chip${active ? ' active' : ''}`}
                    style={active ? { backgroundColor: c + '22', borderColor: c, color: c } : {}}
                    onClick={() => { setSpecialty(s); setShowPicker(false); }}
                  >
                    <div className="chip-dot" style={{ backgroundColor: c }} />
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="info-section">
          <div className="section-label">Contact Info</div>
          <div className="form-card">
            <div className="form-field">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                type="tel"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                type="email"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Company / Organization</label>
              <input
                className="form-input"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. General Hospital"
              />
            </div>
          </div>
        </div>

        <div className="info-section">
          <div className="section-label">Notes</div>
          <div className="form-card">
            <div className="form-field">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any notes, reminders, or details..."
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
