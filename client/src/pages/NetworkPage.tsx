import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Node, NetworkData, Cluster, Contact } from '@shared/schema';
import HeroTitle from '@/components/HeroTitle';
import FilterSection from '@/components/FilterSection';
import GraphCanvas from '@/components/GraphCanvas';
import AddContactModal from '@/components/AddContactModal';
import ContactDetailDrawer from '@/components/ContactDetailDrawer';
import { fuzzySearch } from '@/lib/fuzzySearch';

const NetworkPage: React.FC = () => {
  // State for UI controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeContact, setActiveContact] = useState<Node | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<number[]>([]);
  
  // Fetch network data
  const { data: networkData, isLoading } = useQuery({
    queryKey: ['/api/network'],
  });
  
  // Fetch clusters for filters and add form
  const { data: clusters } = useQuery({
    queryKey: ['/api/clusters'],
  });

  // Initialize active filters with all clusters when data is loaded
  useEffect(() => {
    if (clusters && activeFilters.length === 0) {
      setActiveFilters(clusters.map((cluster: Cluster) => cluster.id));
    }
  }, [clusters, activeFilters.length]);

  // Handle node click
  const handleNodeClick = (node: Node) => {
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

  // Handle add button click
  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  // Handle edit button click
  const handleEditClick = (contact: Node) => {
    setActiveContact(contact);
    setIsEditMode(true);
    setIsAddModalOpen(true);
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
        onAddClick={handleAddClick}
      />
      
      <AddContactModal 
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditMode(false);
        }}
        clusters={clusters || []}
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
