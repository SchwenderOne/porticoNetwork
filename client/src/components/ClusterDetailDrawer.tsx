import React, { useState } from 'react';
import { X, Edit, Trash2, Users } from 'lucide-react';
import { Node as NetworkNode } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ClusterDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: NetworkNode | null;
  contactCount: number;
  contacts: NetworkNode[];
  onEditClick: (cluster: NetworkNode) => void;
  onDeleteClick: (cluster: NetworkNode) => void;
  onNodeClick: (node: NetworkNode) => void;
  onContactEditClick: (contact: NetworkNode) => void;
}

const ClusterDetailDrawer: React.FC<ClusterDetailDrawerProps> = ({
  isOpen,
  onClose,
  cluster,
  contactCount,
  contacts,
  onEditClick,
  onDeleteClick,
  onNodeClick,
  onContactEditClick,
}) => {
  const { toast } = useToast();
  const [filterTerm, setFilterTerm] = useState('');
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(filterTerm.toLowerCase()));

  // Kontakt-Löschen (mit Query-Neuladen)
  const handleContactDelete = async (contactNode: NetworkNode) => {
    const id = contactNode.originalId ?? parseInt(contactNode.id.replace(/\D/g, ''));
    try {
      await apiRequest('DELETE', `/api/contacts/${id}`);
      toast({ title: 'Kontakt gelöscht', description: `${contactNode.name} wurde entfernt.` });
      // Netzwerk-Daten neu laden
      // @ts-ignore
      await queryClient.invalidateQueries(['/api/network']);
      // @ts-ignore
      await queryClient.refetchQueries(['/api/network']);
    } catch (e) {
      toast({ title: 'Fehler', description: 'Kontakt konnte nicht gelöscht werden.', variant: 'destructive' });
    }
  };

  if (!isOpen || !cluster) return null;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full md:w-96 glass shadow-lg transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 ease-in-out z-40`}
    >
      <div className="h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Bereichdetails</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-grow overflow-y-auto">
          <div className="flex items-center mb-4">
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-300 to-purple-300 flex items-center justify-center text-white text-lg font-semibold mr-4"
              style={{ background: cluster.color }}
            >
              {getInitials(cluster.name)}
            </div>
            <div>
              <h4 className="text-lg font-semibold">{cluster.name}</h4>
              <p className="text-gray-600 flex items-center">
                <Users className="h-4 w-4 mr-1" /> Kontakte: {contactCount}
              </p>
            </div>
          </div>
          {contacts.length > 0 && (
            <div className="mb-4">
              {/* Suchfeld */}
              <Input
                placeholder="Kontakte filtern..."
                value={filterTerm}
                onChange={e => setFilterTerm(e.target.value)}
                className="mb-2"
              />
              <h5 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Kontakte im Bereich ({filteredContacts.length})
              </h5>
              <div className="glass p-2 rounded-lg">
                {contacts.length === 0 && contactCount > 0 ? (
                  Array.from({ length: Math.min(contactCount, 5) }).map((_, idx) => (
                    <div key={idx} className="h-10 bg-gray-200 animate-pulse rounded mb-2" />
                  ))
                ) : (
                  filteredContacts.map(contactNode => (
                    <div key={contactNode.id} className="relative group mb-2">
                      <button
                        className="contact-node p-3 rounded-lg flex items-center hover:bg-white/20 transition-colors w-full text-left"
                        onClick={() => { onClose(); onNodeClick(contactNode); }}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-3 shadow-sm"
                          style={{ background: cluster.color }}
                        >
                          {getInitials(contactNode.name)}
                        </div>
                        <div>
                          <p className="font-medium">{contactNode.name}</p>
                          {contactNode.role && <p className="text-xs text-gray-600">{contactNode.role}</p>}
                        </div>
                      </button>
                      {/* Löschen mit Bestätigung */}
                      <Trash2
                        className="absolute right-2 top-2 h-5 w-5 text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer"
                        onClick={e => { e.stopPropagation(); if (window.confirm('Kontakt wirklich löschen?')) handleContactDelete(contactNode); }}
                      />
                      {/* Bearbeiten via Modal */}
                      <Edit
                        className="absolute right-8 top-2 h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 cursor-pointer"
                        onClick={e => {
                          e.stopPropagation();
                          onContactEditClick(contactNode);
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onEditClick(cluster)}>
            <Edit className="h-5 w-5" />
          </Button>
          <Button variant="destructive" onClick={() => onDeleteClick(cluster)}>
            <Trash2 className="h-5 w-5" />
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClusterDetailDrawer; 