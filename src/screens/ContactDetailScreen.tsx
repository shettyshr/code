import React from 'react';
import { Contact, Screen } from '../types';
import { SPECIALTY_COLORS } from '../sampleData';

interface Props {
  contact: Contact;
  onNavigate: (screen: Screen) => void;
  onDelete: (id: string) => void;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

export default function ContactDetailScreen({ contact, onNavigate, onDelete }: Props) {
  const color = SPECIALTY_COLORS[contact.specialty] ?? '#4A5568';
  const ini = initials(contact.name);

  function handleDelete() {
    if (window.confirm(`Delete ${contact.name}? This cannot be undone.`)) {
      onDelete(contact.id);
      onNavigate({ name: 'rolodex' });
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-ghost" onClick={() => onNavigate({ name: 'rolodex' })}>
          ‹ Back
        </button>
        <span className="header-title" style={{ fontSize: 17 }}>Contact</span>
        <button
          className="btn-primary"
          onClick={() => onNavigate({ name: 'addEdit', contactId: contact.id })}
        >
          Edit
        </button>
      </div>

      <div className="page-content">
        <div className="hero-card" style={{ backgroundColor: color + '18' }}>
          <div className="avatar-lg" style={{ backgroundColor: color + '30', color }}>
            {ini}
          </div>
          <div className="hero-name">{contact.name}</div>
          <span className="specialty-badge" style={{ backgroundColor: color }}>
            {contact.specialty}
          </span>
          {contact.company && <div className="hero-company">{contact.company}</div>}
        </div>

        <div className="info-section">
          <div className="section-label">Contact Info</div>
          <div className="info-card">
            <InfoRow label="Phone" value={contact.phone} />
            <InfoRow label="Email" value={contact.email} />
            <InfoRow label="Company" value={contact.company} />
          </div>
        </div>

        <div className="info-section">
          <div className="section-label">Notes</div>
          <div className="info-card">
            {contact.notes
              ? <p className="notes-text">{contact.notes}</p>
              : <p className="notes-empty">No notes yet. Click Edit to add some.</p>
            }
          </div>
        </div>

        <div className="info-section">
          <div className="section-label">Details</div>
          <div className="info-card">
            <InfoRow label="Added" value={contact.createdAt} />
          </div>
        </div>

        <button className="btn-delete" onClick={handleDelete}>
          Delete Contact
        </button>
      </div>
    </div>
  );
}
