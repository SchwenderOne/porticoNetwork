import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Node as NetworkNode, NetworkData, Cluster, Contact } from '@shared/schema';
import HeroTitle from '@/components/HeroTitle';
import FilterSection from '@/components/FilterSection';
import GraphCanvas from '@/components/GraphCanvas';
import AddContactModal from '@/components/AddContactModal';
import AddClusterModal from '@/components/AddClusterModal';
import ContactDetailDrawer from '@/components/ContactDetailDrawer';
import { fuzzySearch } from '@/lib/fuzzySearch';
import { 
  UserPlus, 
  FolderPlus,
  X 
} from 'lucide-react';

const NetworkPage: React.FC = () => {
  // State for UI controls
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isAddClusterModalOpen, setIsAddClusterModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeContact, setActiveContact] = useState<NetworkNode | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<number[]>([]);
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  // Fetch network data
  const { data: networkData, isLoading, refetch: refetchNetwork } = useQuery<NetworkData>({
    queryKey: ['/api/network'],
  });
  
  // Fetch clusters for filters and add form
  const { data: clusters } = useQuery<Cluster[]>({
    queryKey: ['/api/clusters'],
    placeholderData: [], // Prevent 'undefined' errors
  });

  // Initialize active filters with all clusters when data is loaded
  useEffect(() => {
    if (clusters && activeFilters.length === 0) {
      setActiveFilters(clusters.map((cluster: Cluster) => cluster.id));
    }
  }, [clusters, activeFilters.length]);

  // Handle node click
  const handleNodeClick = (node: NetworkNode) => {
    if (node.type === 'contact') {
      setActiveContact(node);
      setIsDrawerOpen(true);
    }
  };

  // Toggle filter for a cluster
  const toggleFilter = (clusterId: number) => {
    if (activeFilters.includes(clusterId)) {
      setActiveFilters(activeFilters.filter(id => id !== clusterId));
    } else {
      setActiveFilters([...activeFilters, clusterId]);
    }
  };

  // Toggle FAB menu
  const toggleFabMenu = () => {
    setIsFabOpen(!isFabOpen);
  };
  
  // Handle add contact button click
  const handleAddContactClick = () => {
    setIsAddContactModalOpen(true);
    setIsFabOpen(false);
  };
  
  // Handle add cluster button click
  const handleAddClusterClick = () => {
    setIsAddClusterModalOpen(true);
    setIsFabOpen(false);
  };
  
  // Handle closing of modals with forced refresh
  const handleModalClose = () => {
    setIsAddContactModalOpen(false);
    setIsAddClusterModalOpen(false);
    setIsEditMode(false);
    
    // Force refresh of network data
    refetchNetwork();
    
    // Force a short delay and then refresh again to ensure data is updated
    setTimeout(() => {
      refetchNetwork();
    }, 500);
  };

  // Handle edit button click
  const handleEditClick = (contact: NetworkNode) => {
    setActiveContact(contact);
    setIsEditMode(true);
    setIsAddContactModalOpen(true);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <HeroTitle 
        title="Portico Netzwerk Visualisierung" 
        subtitle="Erkunden und verwalten Sie Ihre Kontakte und Cluster in einer interaktiven Mind-Map Darstellung."
      />
      
      <FilterSection 
        clusters={clusters || []}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
      />
      
      <GraphCanvas 
        data={networkData as NetworkData}
        isLoading={isLoading}
        filteredClusters={activeFilters}
        searchTerm={searchTerm}
        onNodeClick={handleNodeClick}
        onAddClick={toggleFabMenu}
      />
      
      {/* Floating Action Button Menu */}
      {isFabOpen && (
        <div className="fixed right-6 bottom-24 z-30 flex flex-col-reverse items-end space-y-reverse space-y-2">
          <div className="glass rounded-lg p-2 shadow-lg">
            <button 
              className="flex items-center w-full px-3 py-2 rounded-md hover:bg-white/20 transition-colors"
              onClick={handleAddContactClick}
            >
              <UserPlus className="h-5 w-5 mr-2" />
              <span>Kontakt hinzufügen</span>
            </button>
            <button 
              className="flex items-center w-full px-3 py-2 rounded-md hover:bg-white/20 transition-colors"
              onClick={handleAddClusterClick}
            >
              <FolderPlus className="h-5 w-5 mr-2" />
              <span>Bereich hinzufügen</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <AddContactModal 
        isOpen={isAddContactModalOpen}
        onClose={handleModalClose}
        clusters={clusters || []}
        isEdit={isEditMode}
        contact={isEditMode && activeContact ? activeContact : undefined}
      />
      
      <AddClusterModal 
        isOpen={isAddClusterModalOpen}
        onClose={handleModalClose}
      />
      
      <ContactDetailDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        contact={activeContact}
        clusters={clusters || []}
        onEditClick={handleEditClick}
      />
    </main>
  );
};

export default NetworkPage;
