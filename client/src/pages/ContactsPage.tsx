import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Contact as ContactType, Cluster, Node as NetworkNode } from '@shared/schema';
import HeroTitle from '@/components/HeroTitle';
import { Badge } from '@/components/ui/badge';
import ContactDetailDrawer from '@/components/ContactDetailDrawer';
import { Mail, Phone, Users } from 'lucide-react';

const ContactsPage: React.FC = () => {
  const [activeContact, setActiveContact] = useState<NetworkNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Kontakte laden
  const { data: contacts = [] } = useQuery<ContactType[]>({
    queryKey: ['/api/contacts'],
    placeholderData: [],
  });

  // Cluster laden für Badge-Farbe und Namen
  const { data: clusters = [] } = useQuery<Cluster[]>({
    queryKey: ['/api/clusters'],
    placeholderData: [],
  });

  const handleNodeClick = (node: NetworkNode) => {
    setActiveContact(node);
    setIsDrawerOpen(true);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <HeroTitle title="Kontakte" subtitle="Übersicht aller Kontakte im Netzwerk" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map(c => {
          const cluster = clusters.find(cl => cl.id === c.clusterId);
          const node: NetworkNode = {
            id: `contact-${c.id}`,
            type: 'contact',
            name: c.name,
            role: c.role,
            email: c.email || undefined,
            phone: c.phone || undefined,
            notes: c.notes || undefined,
            clusterId: c.clusterId,
            originalId: c.id,
          };
          // Initialen bestimmen
          const initials = c.name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

          return (
            <button
              key={c.id}
              onClick={() => handleNodeClick(node)}
              className="glass p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-semibold mr-3"
                  style={{ background: cluster?.color || 'rgba(173, 216, 230, 0.45)' }}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-lg font-semibold">{c.name}</p>
                  <p className="text-gray-600 text-sm">{c.role}</p>
                </div>
              </div>
              <div className="mb-2">
                <Badge
                  style={{
                    backgroundColor: cluster?.color,
                    borderColor: cluster?.color,
                  }}
                >
                  {cluster?.name}
                </Badge>
              </div>
              <div className="flex items-center text-gray-700 space-x-4">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center hover:underline">
                    <Mail className="h-5 w-5 mr-1 text-gray-500" />
                    <span className="text-sm">{c.email}</span>
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center hover:underline">
                    <Phone className="h-5 w-5 mr-1 text-gray-500" />
                    <span className="text-sm">{c.phone}</span>
                  </a>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <ContactDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        contact={activeContact}
        clusters={clusters}
        onEditClick={() => {}}
        onNodeClick={handleNodeClick}
      />
    </main>
  );
};

export default ContactsPage; 