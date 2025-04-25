import React, { useRef, useEffect, useState, useMemo } from 'react';
import { NetworkData, Node } from '@shared/schema';
import { Loader2, Plus } from 'lucide-react';
import { initializeNetworkGraph } from '@/lib/d3-utils';

interface GraphCanvasProps {
  data: NetworkData | undefined;
  isLoading: boolean;
  filteredClusters: number[];
  searchTerm: string;
  onNodeClick: (node: Node) => void;
  onAddClick: () => void;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  data,
  isLoading,
  filteredClusters,
  searchTerm,
  onNodeClick,
  onAddClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSearchingMessage, setShowSearchingMessage] = useState(false);
  
  // Use useMemo to compute filtered data
  const filteredData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    
    // First filter the nodes
    const filteredNodes = data.nodes.filter((node) => {
      // Always include Portico node
      if (node.id === "portico") return true;
      
      if (node.type === 'cluster') {
        // Keep clusters that are in the filtered list, and Portico
        return filteredClusters.includes(parseInt(node.id));
      } else if (node.type === 'contact') {
        // For contacts, check cluster filter and search term
        const matchesCluster = filteredClusters.includes(node.clusterId || 0);
        if (!matchesCluster) return false;
        
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          node.name.toLowerCase().includes(searchLower) ||
          (node.role && node.role.toLowerCase().includes(searchLower))
        );
      }
      return false;
    });
    
    // Then filter links based on the filtered nodes
    const filteredLinks = data.links.filter((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      const sourceExists = filteredNodes.some(n => n.id === sourceId);
      const targetExists = filteredNodes.some(n => n.id === targetId);
      
      return sourceExists && targetExists;
    });
    
    return { nodes: filteredNodes, links: filteredLinks };
  }, [data, filteredClusters, searchTerm]);
  
  // Check for empty results
  useEffect(() => {
    if (data && searchTerm) {
      setShowSearchingMessage(searchTerm.length > 0 && filteredData.nodes.length <= 1); // 1 for Portico
    } else {
      setShowSearchingMessage(false);
    }
  }, [filteredData, searchTerm, data]);
  
  // Initialize the graph
  useEffect(() => {
    if (!data || isLoading || !svgRef.current || !containerRef.current) {
      return;
    }

    // Initialize the graph with filtered data
    const cleanup = initializeNetworkGraph(
      svgRef.current,
      filteredData as NetworkData,
      onNodeClick
    );

    return cleanup;
  }, [filteredData, isLoading, onNodeClick, data]);

  return (
    <div className="glass rounded-xl p-4 mb-6 h-[600px] overflow-hidden relative" ref={containerRef}>
      {/* D3.js will render here */}
      <svg width="100%" height="100%" ref={svgRef} id="network-graph">
        <g className="links"></g>
        <g className="nodes"></g>
      </svg>
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto mb-2" />
            <p>Netzwerk wird geladen...</p>
          </div>
        </div>
      )}

      {/* No Results for Search */}
      {showSearchingMessage && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <p>Keine Ergebnisse für "{searchTerm}"</p>
          </div>
        </div>
      )}
      
      {/* Floating Action Button */}
      <button 
        className="fab absolute right-6 bottom-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        onClick={onAddClick}
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};

export default GraphCanvas;
