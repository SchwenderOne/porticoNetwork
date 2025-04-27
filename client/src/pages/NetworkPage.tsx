import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Node as NetworkNode, NetworkData, Cluster, Contact } from '@shared/schema';
import HeroTitle from '@/components/HeroTitle';
import FilterSection from '@/components/FilterSection';
import AddContactModal from '@/components/AddContactModal';
import AddClusterModal from '@/components/AddClusterModal';
import ContactDetailDrawer from '@/components/ContactDetailDrawer';
import ClusterDetailDrawer from '@/components/ClusterDetailDrawer';
import { fuzzySearch } from '@/lib/fuzzySearch';
import { 
  UserPlus, 
  FolderPlus,
  X,
  Plus,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ReactFlow, { ReactFlowProvider, Controls, Background, Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Position, ReactFlowInstance } from 'reactflow';
import { nodeTypes } from '@/components/FlowNodes';
import 'reactflow/dist/style.css';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkPage: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  // State for UI controls
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isAddClusterModalOpen, setIsAddClusterModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClusterDrawerOpen, setIsClusterDrawerOpen] = useState(false);
  const [isClusterEditMode, setIsClusterEditMode] = useState(false);
  const [activeContact, setActiveContact] = useState<NetworkNode | null>(null);
  const [activeCluster, setActiveCluster] = useState<NetworkNode | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<number[]>([]);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Fetch network data
  const { 
    data: networkData, 
    isLoading, 
    refetch: refetchNetwork,
    dataUpdatedAt // Zeitstempel der letzten Datenaktualisierung 
  } = useQuery<NetworkData>({
    queryKey: ['/api/network'],
    placeholderData: { nodes: [], links: [] }, // Prevent 'undefined' errors
    refetchInterval: 10000, // Aktualisierung nur alle 10 Sekunden statt alle 2 Sekunden
    staleTime: 8000, // Daten werden erst nach 8 Sekunden als veraltet markiert
  });
  
  // Fetch clusters mit ähnlichen Einstellungen
  const { 
    data: clusters, 
    refetch: refetchClusters 
  } = useQuery<Cluster[]>({
    queryKey: ['/api/clusters'],
    placeholderData: [], // Prevent 'undefined' errors
    refetchInterval: 10000, // Aktualisierung nur alle 10 Sekunden statt alle 2 Sekunden
    staleTime: 8000, // Daten werden erst nach 8 Sekunden als veraltet markiert
  });
  
  // Protokolliere Aktualisierungen für Debugging
  useEffect(() => {
    if (networkData) {
      console.log(`Network data updated at ${new Date().toLocaleTimeString()}, nodes: ${networkData.nodes.length}`);
    }
  }, [networkData]);

  // Initialize active filters with all clusters when data is loaded
  // Dieser Effect muss bei jeder Änderung der Clusters ausgeführt werden
  useEffect(() => {
    if (clusters && clusters.length > 0) {
      // Hole alle Cluster-IDs
      const allClusterIds = clusters.map((cluster: Cluster) => cluster.id);
      
      // Prüfe, ob es neue Cluster gibt, die nicht in activeFilters sind
      const newClusters = allClusterIds.filter(id => !activeFilters.includes(id));
      
      // Wenn es neue Cluster gibt, aktualisiere die Filter
      if (newClusters.length > 0) {
        console.log("Neue Cluster erkannt, aktualisiere Filter:", newClusters);
        setActiveFilters([...activeFilters, ...newClusters]);
      }
    }
  }, [clusters]); // Abhängigkeit nur von Clusters, damit der Effect bei jeder Änderung ausgeführt wird

  // Handle node click
  const handleNodeClick = (node: NetworkNode) => {
    // Schließe alle Detail-Drawer
    setIsDrawerOpen(false);
    setIsClusterDrawerOpen(false);
    // Öffne passenden Drawer
    if (node.type === 'contact') {
      setActiveContact(node);
      setIsDrawerOpen(true);
    } else if (node.type === 'cluster') {
      setActiveCluster(node);
      setIsClusterDrawerOpen(true);
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
    setIsClusterEditMode(false);
    
    // Zurücksetzen des Session-Flags, damit eine neue Zoom-Berechnung erfolgt
    sessionStorage.removeItem('initialZoomPerformed');
    
    // Zuerst die Cluster aktualisieren
    refetchClusters().then(() => {
      console.log("Clusters neu geladen");
      
      // Dann das Netzwerk aktualisieren
      return refetchNetwork();
    }).then(() => {
      console.log("Netzwerk neu geladen (1. Versuch)");
      
      // Ein zweiter Versuch nach kurzer Verzögerung, um sicherzustellen, 
      // dass alle Änderungen berücksichtigt werden
      setTimeout(() => {
        refetchClusters().then(() => refetchNetwork())
          .then(() => console.log("Netzwerk neu geladen (2. Versuch)"));
      }, 1000);
    });
  };

  // Handle edit button click
  const handleEditClick = (contact: NetworkNode) => {
    setActiveContact(contact);
    setIsEditMode(true);
    setIsAddContactModalOpen(true);
  };

  // Edit- & Delete-Handler für Cluster
  const handleClusterEditClick = (clusterNode: NetworkNode) => {
    setActiveCluster(clusterNode);
    setIsClusterDrawerOpen(false);
    setIsClusterEditMode(true);
    setIsAddClusterModalOpen(true);
  };

  const handleClusterDeleteClick = async (clusterNode: NetworkNode) => {
    const id = clusterNode.originalId;
    try {
      await apiRequest('DELETE', `/api/clusters/${id}`);
      toast({ title: "Bereich gelöscht", description: `${clusterNode.name} wurde gelöscht.` });
      // Queries invalidieren und sofort neu laden
      await queryClient.invalidateQueries({ queryKey: ['/api/network'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/clusters'] });
      await queryClient.refetchQueries({ queryKey: ['/api/network'] });
      await queryClient.refetchQueries({ queryKey: ['/api/clusters'] });
      setIsClusterDrawerOpen(false);
    } catch (e) {
      toast({ title: "Fehler", description: "Bereich konnte nicht gelöscht werden.", variant: "destructive" });
    }
  };

  // State für React Flow Nodes & Edges mit Persistenz und ReactFlow-Instanz
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // Initialisierung von Nodes + Edges bei Daten-Update mit radialem Mind-Map Layout
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('nodePositions') || '{}');
    // Layout-Parameter
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusCluster = Math.min(width, height) / 3;
    const radiusContact = radiusCluster * 1.5;
    // Cluster-Knoten und Sektoren
    const allNodes = networkData?.nodes || [];
    const clustersArr = allNodes.filter(n => n.type === 'cluster');
    const totalClusters = clustersArr.length || 1;
    const sectorWidth = (2 * Math.PI) / totalClusters;
    // Kontakte gruppieren nach ClusterId
    const contactNodes = allNodes.filter(n => n.type === 'contact');
    const contactsByCluster = new Map<number, typeof contactNodes>();
    contactNodes.forEach(cn => {
      const cid = cn.clusterId ?? -1;
      const arr = contactsByCluster.get(cid) || [];
      arr.push(cn);
      contactsByCluster.set(cid, arr);
    });
    // Neue Knoten berechnen mit sektoraler Verteilung
    const newNodes: Node[] = allNodes.map(n => {
      // Falls Position gespeichert, direkt nutzen
      let pos = saved[n.id];
      if (!pos) {
        if (n.id === 'portico') {
          pos = { x: centerX, y: centerY };
        } else if (n.type === 'cluster') {
          const idx = clustersArr.findIndex(c => c.id === n.id);
          const angle = idx * sectorWidth;
          pos = { x: centerX + radiusCluster * Math.cos(angle), y: centerY + radiusCluster * Math.sin(angle) };
        } else {
          // Kontakte logisch um Cluster verteilen
          const cid = n.clusterId ?? -1;
          const group = contactsByCluster.get(cid) || [];
          const idxCluster = clustersArr.findIndex(c => c.originalId === cid || c.id === `cluster-${cid}`);
          const start = idxCluster * sectorWidth;
          const count = group.length;
          const idxContact = group.findIndex(cn => cn.id === n.id);
          const angle = start + ((idxContact + 1) / (count + 1)) * sectorWidth;
          pos = { x: centerX + radiusContact * Math.cos(angle), y: centerY + radiusContact * Math.sin(angle) };
        }
      }
      return {
        id: n.id,
        type: n.type,
        data: {
          label: n.name,
          color: n.color,
          originalNode: n,
        },
        position: pos,
      };
    });
    // Persist initial Positionen
    const updated = { ...saved };
    newNodes.forEach(n => {
      if (!updated[n.id]) updated[n.id] = n.position;
    });
    localStorage.setItem('nodePositions', JSON.stringify(updated));
    // Kanten wie bisher
    const newEdges: Edge[] = (networkData?.links || []).map(l => {
      const src = newNodes.find(node => node.id === l.source);
      const tgt = newNodes.find(node => node.id === l.target);
      let sourceHandle = 'bottom';
      let targetHandle = 'top';
      if (src && tgt) {
        if (src.position.y > tgt.position.y) {
          sourceHandle = 'top'; targetHandle = 'bottom';
        } else if (src.position.y < tgt.position.y) {
          sourceHandle = 'bottom'; targetHandle = 'top';
        } else {
          sourceHandle = src.position.x < tgt.position.x ? 'right' : 'left';
          targetHandle = src.position.x < tgt.position.x ? 'left' : 'right';
        }
      }
      return { id: l.id, source: l.source, target: l.target, type: 'default', sourceHandle, targetHandle } as Edge;
    });
    setFlowNodes(newNodes);
    setFlowEdges(newEdges);
  }, [networkData]);

  return (
    <main className="container mx-auto px-4 py-8">
      <HeroTitle 
        title="Portico Netzwerk Visualisierung" 
        subtitle="Erkunden und verwalten Sie Ihre Kontakte und Cluster in einer interaktiven Mind-Map Darstellung."
      />
      <div className="flex justify-end mb-4">
        <button
          className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <FilterSection 
              clusters={clusters || []}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              activeFilters={activeFilters}
              toggleFilter={toggleFilter}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isMinimized && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="mb-6">
            <ReactFlowProvider>
            <div className="glass rounded-xl p-4 mb-6 h-[600px] relative">
              {/* Reset-View Button */}
              <button
                className="absolute top-2 right-2 z-10 bg-white bg-opacity-80 p-2 rounded shadow hover:bg-opacity-100"
                onClick={() => rfInstance?.fitView({ duration: 800 })}
              >Reset View</button>
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                onInit={setRfInstance}
                onNodesChange={(changes: NodeChange[]) => setFlowNodes(nds => applyNodeChanges(changes, nds))}
                onEdgesChange={(changes: EdgeChange[]) => setFlowEdges(eds => applyEdgeChanges(changes, eds))}
                onNodeClick={(event, node) => node.data.originalNode && handleNodeClick(node.data.originalNode)}
                onNodeDragStop={(_, node) => {
                  const saved = JSON.parse(localStorage.getItem('nodePositions') || '{}');
                  saved[node.id] = node.position;
                  localStorage.setItem('nodePositions', JSON.stringify(saved));
                }}
                onPaneClick={() => {
                  // Schließe alle Drawers bei Klick auf leere Fläche
                  setIsDrawerOpen(false);
                  setIsClusterDrawerOpen(false);
                }}
              >
                <Controls showFitView={false} />
                <Background />
              </ReactFlow>
            </div>
            </ReactFlowProvider>
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Floating Action Button Toggle */}
      <div className="fixed right-6 bottom-6 z-40">
        <button
          className="glass p-3 rounded-full shadow-lg hover:bg-white/20 transition-colors"
          onClick={toggleFabMenu}
        >
          {isFabOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Floating Action Button Menu */}
      {isFabOpen && (
        <div className="fixed right-6 bottom-24 z-30 flex flex-col items-end space-y-2">
          <div className="glass rounded-lg p-2 shadow-lg flex flex-col items-center space-y-2">
            <button 
              className="bg-white bg-opacity-80 p-2 rounded-full shadow hover:bg-opacity-100 transition-colors"
              onClick={handleAddContactClick}
            >
              <UserPlus className="h-6 w-6" />
            </button>
            <button 
              className="bg-white bg-opacity-80 p-2 rounded-full shadow hover:bg-opacity-100 transition-colors"
              onClick={handleAddClusterClick}
            >
              <FolderPlus className="h-6 w-6" />
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
        isEdit={isClusterEditMode}
        cluster={isClusterEditMode && activeCluster ? activeCluster : undefined}
      />
      
      <ContactDetailDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        contact={activeContact}
        clusters={clusters || []}
        onEditClick={handleEditClick}
        onNodeClick={handleNodeClick}
      />
      <ClusterDetailDrawer
        isOpen={isClusterDrawerOpen}
        onClose={() => setIsClusterDrawerOpen(false)}
        cluster={activeCluster}
        contactCount={networkData?.nodes.filter(n => n.type === 'contact' && n.clusterId === activeCluster?.originalId).length || 0}
        contacts={networkData?.nodes.filter(n => n.type === 'contact' && n.clusterId === activeCluster?.originalId) || []}
        onEditClick={handleClusterEditClick}
        onDeleteClick={handleClusterDeleteClick}
        onNodeClick={handleNodeClick}
        onContactEditClick={contactNode => {
          setIsClusterDrawerOpen(false);
          handleEditClick(contactNode);
        }}
      />
    </main>
  );
};

export default NetworkPage;
