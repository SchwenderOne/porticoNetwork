import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Node as NetworkNodeType, NetworkData, Cluster, Contact } from '@shared/schema';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Position,
  ReactFlowInstance,
} from 'reactflow';
import { nodeTypes } from '@/components/FlowNodes';
import HeroTitle from '@/components/HeroTitle';
import FilterSection from '@/components/FilterSection';
import AddContactModal from '@/components/AddContactModal';
import AddClusterModal from '@/components/AddClusterModal';
import ContactDetailDrawer from '@/components/ContactDetailDrawer';
import ClusterDetailDrawer from '@/components/ClusterDetailDrawer';
import { UserPlus, FolderPlus, X, Plus } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import 'reactflow/dist/style.css';

const NetworkFullScreen: React.FC = () => {
  const { toast } = useToast();
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isAddClusterModalOpen, setIsAddClusterModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClusterDrawerOpen, setIsClusterDrawerOpen] = useState(false);
  const [isClusterEditMode, setIsClusterEditMode] = useState(false);
  const [activeContact, setActiveContact] = useState<NetworkNodeType | null>(null);
  const [activeCluster, setActiveCluster] = useState<NetworkNodeType | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<number[]>([]);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const { 
    data: networkData, 
    isLoading,
    refetch: refetchNetwork,
  } = useQuery<NetworkData>({
    queryKey: ['/api/network'],
    placeholderData: { nodes: [], links: [] },
  });
  
  const { data: clusters = [], refetch: refetchClusters } = useQuery<Cluster[]>({
    queryKey: ['/api/clusters'],
    placeholderData: [],
  });
  
  useEffect(() => {
    if (clusters.length && activeFilters.length === 0) {
      setActiveFilters(clusters.map(c => c.id));
    }
  }, [clusters]);

  useEffect(() => {
    if (networkData) console.log(`Nodes: ${networkData.nodes.length}`);
  }, [networkData]);

  const handleNodeClick = (node: NetworkNodeType) => {
    if (node.type === 'contact') {
      setActiveContact(node); setIsDrawerOpen(true);
    } else {
      setActiveCluster(node); setIsClusterDrawerOpen(true);
    }
  };

  const toggleFilter = (id: number) => {
    setActiveFilters(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  };

  const toggleFabMenu = () => setIsFabOpen(open => !open);
  const handleAddContactClick = () => { setIsAddContactModalOpen(true); setIsFabOpen(false); };
  const handleAddClusterClick = () => { setIsAddClusterModalOpen(true); setIsFabOpen(false); };
  const handleModalClose = () => {
    setIsAddContactModalOpen(false); setIsAddClusterModalOpen(false);
    setIsEditMode(false); setIsClusterEditMode(false);
    sessionStorage.removeItem('initialZoomPerformed');
    refetchClusters().then(() => refetchNetwork());
  };

  const handleEditClick = (c: NetworkNodeType) => { setActiveContact(c); setIsEditMode(true); setIsAddContactModalOpen(true); };
  const handleClusterEditClick = (c: NetworkNodeType) => { setActiveCluster(c); setIsClusterEditMode(true); setIsAddClusterModalOpen(true); };
  const handleClusterDeleteClick = async (c: NetworkNodeType) => {
    try { await apiRequest('DELETE', `/api/clusters/${c.originalId}`);
      toast({ title: 'Bereich gelöscht', description: c.name });
      await queryClient.invalidateQueries({ queryKey: ['/api/network'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/clusters'] });
      setIsClusterDrawerOpen(false);
    } catch { toast({ title: 'Fehler', variant: 'destructive' }); }
  };

  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('nodePositions') || '{}');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusCluster = Math.min(width, height) / 3;
    const radiusContact = radiusCluster * 1.5;
    const clustersArr = networkData?.nodes.filter(n => n.type === 'cluster') || [];
    const totalClusters = clustersArr.length;

    const newNodes: Node[] = networkData?.nodes.map(n => {
      let pos = saved[n.id];
      if (!pos) {
        if (n.id === 'portico') {
          pos = { x: centerX, y: centerY };
        } else if (n.type === 'cluster') {
          const idx = clustersArr.findIndex(c => c.id === n.id);
          const angle = (idx / totalClusters) * 2 * Math.PI;
          pos = { x: centerX + radiusCluster * Math.cos(angle), y: centerY + radiusCluster * Math.sin(angle) };
        } else {
          const clusterNode = clustersArr.find(c => c.originalId === n.clusterId || c.id === `cluster-${n.clusterId}`);
          const idxCluster = clustersArr.indexOf(clusterNode as any);
          const angle = (idxCluster / totalClusters) * 2 * Math.PI;
          pos = { x: centerX + radiusContact * Math.cos(angle), y: centerY + radiusContact * Math.sin(angle) };
        }
      }
      return { id: n.id, type: n.type, data: { label: n.name, color: n.color, originalNode: n }, position: pos };
    }) || [];

    const newEdges: Edge[] = networkData?.links.map(l => {
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
          if (src.position.x < tgt.position.x) {
            sourceHandle = 'right'; targetHandle = 'left';
          } else {
            sourceHandle = 'left'; targetHandle = 'right';
          }
        }
      }
      return { id: l.id, source: l.source, target: l.target, type: 'default', sourceHandle, targetHandle };
    }) || [];

    setFlowNodes(newNodes);
    setFlowEdges(newEdges);
  }, [networkData]);

  return (
    <main className="w-screen h-screen flex flex-col">
      <HeroTitle title="Netzwerk" subtitle="Vollbild-Ansicht des Netzwerks" />
      <FilterSection clusters={clusters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} activeFilters={activeFilters} toggleFilter={toggleFilter} />
      <ReactFlowProvider>
        <div className="flex-1 relative">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onInit={setRfInstance}
            onNodesChange={(changes: NodeChange[]) => setFlowNodes(nds => applyNodeChanges(changes, nds))}
            onEdgesChange={(changes: EdgeChange[]) => setFlowEdges(eds => applyEdgeChanges(changes, eds))}
            onNodeDragStop={(_, node) => {
              const saved = JSON.parse(localStorage.getItem('nodePositions') || '{}');
              saved[node.id] = node.position;
              localStorage.setItem('nodePositions', JSON.stringify(saved));
            }}
          >
            <Controls showFitView={false} />
            <Background />
          </ReactFlow>
          <button className="absolute top-2 right-2 z-10 bg-white bg-opacity-80 p-2 rounded shadow" onClick={()=>rfInstance?.fitView()}>Reset</button>
        </div>
      </ReactFlowProvider>
      <div className="fixed right-6 bottom-6 z-40">
        <button className="glass p-3 rounded-full shadow-lg" onClick={toggleFabMenu}>{isFabOpen?<X className="h-6 w-6"/>:<Plus className="h-6 w-6"/>}</button>
      </div>
      {isFabOpen&&<div className="fixed right-6 bottom-24 z-50 flex flex-col items-end space-y-2">
          <button className="glass p-2 rounded-full" onClick={handleAddContactClick}><UserPlus className="h-6 w-6"/></button>
          <button className="glass p-2 rounded-full" onClick={handleAddClusterClick}><FolderPlus className="h-6 w-6"/></button>
      </div>}
      <AddContactModal isOpen={isAddContactModalOpen} onClose={handleModalClose} clusters={clusters} isEdit={isEditMode} contact={activeContact||undefined} />
      <AddClusterModal isOpen={isAddClusterModalOpen} onClose={handleModalClose} isEdit={isClusterEditMode} cluster={activeCluster||undefined} />
      <ContactDetailDrawer isOpen={isDrawerOpen} onClose={()=>setIsDrawerOpen(false)} contact={activeContact} clusters={clusters} onEditClick={handleEditClick} onNodeClick={handleNodeClick} />
      <ClusterDetailDrawer 
        isOpen={isClusterDrawerOpen} 
        onClose={() => setIsClusterDrawerOpen(false)} 
        cluster={activeCluster} 
        contactCount={flowNodes.filter(n => n.type === 'contact' && n.data.originalNode.clusterId === activeCluster?.originalId).length} 
        contacts={flowNodes.filter(n => n.type === 'contact' && n.data.originalNode.clusterId === activeCluster?.originalId).map(n => n.data.originalNode)} 
        onEditClick={handleClusterEditClick} 
        onDeleteClick={handleClusterDeleteClick} 
        onNodeClick={handleNodeClick} 
        onContactEditClick={contactNode => { handleEditClick(contactNode); }}
      />
    </main>
  );
};

export default NetworkFullScreen; 