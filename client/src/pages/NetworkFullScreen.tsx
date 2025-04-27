import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Node as NetworkNode, NetworkData, Cluster } from '@shared/schema';
import FilterSection from '@/components/FilterSection';
import ReactFlow, { ReactFlowProvider, Controls, Background, Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { nodeTypes } from '@/components/FlowNodes';
import { Skeleton } from '@/components/ui/skeleton';
import 'reactflow/dist/style.css';

const NetworkFullScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<number[]>([]);
  const { data: networkData, isLoading: isNetworkLoading } = useQuery<NetworkData>({ queryKey: ['/api/network'], placeholderData: { nodes: [], links: [] } });
  const { data: clusters = [], isLoading: isClustersLoading } = useQuery<Cluster[]>({ queryKey: ['/api/clusters'], placeholderData: [] });

  useEffect(() => {
    if (clusters.length && activeFilters.length === 0) {
      setActiveFilters(clusters.map(c => c.id));
    }
  }, [clusters]);

  const toggleFilter = (clusterId: number) => {
    setActiveFilters(f => f.includes(clusterId) ? f.filter(x => x !== clusterId) : [...f, clusterId]);
  };

  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);
  const [rfInstance, setRfInstance] = useState<any>(null);

  useEffect(() => {
    if (!networkData) return;
    const allNodes = networkData.nodes;
    const clustersArr = allNodes.filter(n => n.type === 'cluster');
    const total = clustersArr.length || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cx = width / 2;
    const cy = height / 2;
    const rC = Math.min(width, height) / 3;
    const rK = rC * 1.5;
    const contactsByCluster = new Map<number, NetworkNode[]>();
    allNodes.filter(n => n.type === 'contact').forEach(c => {
      const cid = c.clusterId ?? -1;
      const arr = contactsByCluster.get(cid) || [];
      arr.push(c);
      contactsByCluster.set(cid, arr);
    });
    const newNodes: Node[] = allNodes.map(n => {
      let pos = { x: cx, y: cy };
      if (n.id !== 'portico') {
        if (n.type === 'cluster') {
          const idx = clustersArr.findIndex(c => c.id === n.id);
          const angle = (idx / total) * 2 * Math.PI;
          pos = { x: cx + rC * Math.cos(angle), y: cy + rC * Math.sin(angle) };
        } else {
          const cid = n.clusterId ?? -1;
          const grp = contactsByCluster.get(cid) || [];
          const idxCluster = clustersArr.findIndex(c => c.originalId === cid || c.id === `cluster-${cid}`);
          const start = (idxCluster / total) * 2 * Math.PI;
          const count = grp.length;
          const idxContact = grp.findIndex(c => c.id === n.id);
          const angle = start + ((idxContact + 1) / (count + 1)) * (2 * Math.PI);
          pos = { x: cx + rK * Math.cos(angle), y: cy + rK * Math.sin(angle) };
        }
      }
      return { id: n.id, type: n.type, data: { label: n.name, color: n.color, originalNode: n }, position: pos };
    });
    setFlowNodes(newNodes);
    const newEdges: Edge[] = (networkData.links || []).map(l => ({ id: l.id, source: l.source, target: l.target, type: 'default', sourceHandle: 'bottom', targetHandle: 'top' } as Edge));
    setFlowEdges(newEdges);
  }, [networkData]);

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="p-4 bg-white/80 z-10">
        {isClustersLoading ? <Skeleton className="h-10 max-w-md mx-auto" /> : <FilterSection clusters={clusters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} activeFilters={activeFilters} toggleFilter={toggleFilter} />}
      </div>
      <div className="flex-1 relative">
        {isNetworkLoading ? <Skeleton className="h-full w-full" /> : (
          <ReactFlowProvider>
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              onInit={setRfInstance}
              onNodesChange={(changes: NodeChange[]) => setFlowNodes(nds => applyNodeChanges(changes, nds))}
              onEdgesChange={(changes: EdgeChange[]) => setFlowEdges(eds => applyEdgeChanges(changes, eds))}
            >
              <Controls showFitView={false} />
              <Background />
            </ReactFlow>
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
};

export default NetworkFullScreen; 