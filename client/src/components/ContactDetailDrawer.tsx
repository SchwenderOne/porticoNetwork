import React from 'react';
import { X, Edit, Trash2, Mail, Phone, Bookmark, Users, ExternalLink } from 'lucide-react';
import { Node as NetworkNode, Contact, Cluster } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ContactDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contact: NetworkNode | null;
  clusters: Cluster[];
  onEditClick: (contact: NetworkNode) => void;
}

const ContactDetailDrawer: React.FC<ContactDetailDrawerProps> = ({
  isOpen,
  onClose,
  contact,
  clusters,
  onEditClick,
}) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Get related contacts (contacts in the same cluster)
  const relatedContactsQuery = useQuery({
    queryKey: contact?.clusterId ? ['/api/contacts', { clusterId: contact.clusterId }] : ['/api/contacts', {}],
    enabled: !!contact?.clusterId,
  });

  const relatedContacts = relatedContactsQuery.data as Contact[] || [];
  
  // Filter out the current contact
  const filteredRelatedContacts = relatedContacts.filter(c => {
    // Extrahiere die ID aus dem contact.id, falls es sich um ein "contact-X" Format handelt
    const currentContactId = contact?.originalId !== undefined 
      ? contact.originalId 
      : (contact?.id.startsWith('contact-') 
          ? parseInt(contact.id.replace('contact-', '')) 
          : contact?.id);
    
    return c.id.toString() !== currentContactId?.toString();
  }).slice(0, 5); // Show max 5 related contacts

  const getClusterName = (clusterId?: number) => {
    if (!clusterId) return '';
    const cluster = clusters.find(c => c.id === clusterId);
    return cluster?.name || '';
  };

  const getClusterColor = (clusterId?: number) => {
    if (!clusterId) return '';
    const cluster = clusters.find(c => c.id === clusterId);
    return cluster?.color || '';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleDeleteContact = async () => {
    if (!contact) return;

    try {
      // Verwende originalId, wenn vorhanden, sonst extrahiere ID aus dem ID-String
      const contactId = contact.originalId !== undefined 
        ? contact.originalId 
        : parseInt(contact.id.replace('contact-', ''));
        
      await apiRequest('DELETE', `/api/contacts/${contactId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/network'] });
      toast({
        title: "Kontakt gelöscht",
        description: `${contact.name} wurde erfolgreich gelöscht.`,
      });
      onClose();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast({
        title: "Fehler",
        description: "Der Kontakt konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen || !contact) return null;

  return (
    <>
      <div 
        className={`fixed inset-y-0 right-0 w-full md:w-96 glass shadow-lg transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out z-40`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Kontaktdetails</h3>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto">
            {/* Contact Details */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-300 to-purple-300 flex items-center justify-center text-white text-xl font-semibold mr-4"
                  style={{ 
                    background: contact.clusterId ? getClusterColor(contact.clusterId) : 'rgba(173, 216, 230, 0.45)'
                  }}
                >
                  {getInitials(contact.name)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{contact.name}</h4>
                  <p className="text-gray-600">{contact.role}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Cluster
                </h5>
                <Badge 
                  className="text-white"
                  style={{ 
                    backgroundColor: getClusterColor(contact.clusterId),
                    borderColor: getClusterColor(contact.clusterId)
                  }}
                >
                  {getClusterName(contact.clusterId)}
                </Badge>
              </div>
              
              {(contact.email || contact.phone) && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Kontaktinformationen
                  </h5>
                  
                  {contact.email && (
                    <div className="flex items-center mb-2 text-gray-700">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <a href={`mailto:${contact.email}`} className="hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className="flex items-center text-gray-700">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <a href={`tel:${contact.phone}`} className="hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {contact.notes && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Notizen
                  </h5>
                  <div className="glass p-3 rounded-lg text-gray-700">
                    {contact.notes}
                  </div>
                </div>
              )}
            </div>
            
            {/* Related Contacts */}
            {filteredRelatedContacts.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Kontakte im selben Cluster ({filteredRelatedContacts.length})
                </h5>
                <div className="glass p-2 rounded-lg">
                  {filteredRelatedContacts.map((relatedContact) => (
                    <div 
                      key={relatedContact.id} 
                      className="contact-node p-3 rounded-lg mb-2 flex items-center hover:bg-white/20 transition-colors"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-3 shadow-sm"
                        style={{ 
                          background: getClusterColor(relatedContact.clusterId)
                        }}
                      >
                        {getInitials(relatedContact.name)}
                      </div>
                      <div>
                        <p className="font-medium">{relatedContact.name}</p>
                        <p className="text-xs text-gray-600">{relatedContact.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => onEditClick(contact)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Bearbeiten
            </Button>
            
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Löschen
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kontakt löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie den Kontakt <strong>{contact.name}</strong> löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteContact}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContactDetailDrawer;
