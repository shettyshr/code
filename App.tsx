import React, { useState, useEffect } from 'react';
import { Contact, Screen } from './src/types';
import { INITIAL_CONTACTS } from './src/sampleData';
import RolodexScreen from './src/screens/RolodexScreen';
import ContactDetailScreen from './src/screens/ContactDetailScreen';
import AddEditContactScreen from './src/screens/AddEditContactScreen';

const STORAGE_KEY = 'rolodex_contacts';

function loadContacts(): Contact[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return INITIAL_CONTACTS;
}

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>(loadContacts);
  const [screen, setScreen] = useState<Screen>({ name: 'rolodex' });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  function handleSave(updated: Contact) {
    setContacts(prev => {
      const exists = prev.find(c => c.id === updated.id);
      if (exists) return prev.map(c => (c.id === updated.id ? updated : c));
      return [...prev, updated];
    });
  }

  function handleDelete(id: string) {
    setContacts(prev => prev.filter(c => c.id !== id));
  }

  if (screen.name === 'detail') {
    const contact = contacts.find(c => c.id === screen.contactId);
    if (contact) {
      return (
        <ContactDetailScreen
          contact={contact}
          onNavigate={setScreen}
          onDelete={handleDelete}
        />
      );
    }
  }

  if (screen.name === 'addEdit') {
    const contact = screen.contactId
      ? contacts.find(c => c.id === screen.contactId)
      : undefined;
    return (
      <AddEditContactScreen
        contact={contact}
        onSave={handleSave}
        onNavigate={setScreen}
      />
    );
  }

  return <RolodexScreen contacts={contacts} onNavigate={setScreen} />;
}
