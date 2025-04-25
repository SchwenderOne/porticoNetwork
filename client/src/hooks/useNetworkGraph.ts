import { useState, useEffect, useRef } from 'react';
import { NetworkData, Node, Link } from '@shared/schema';
import * as d3 from 'd3';

interface UseNetworkGraphProps {
  data: NetworkData | undefined;
  onNodeClick: (node: Node) => void;
}

export function useNetworkGraph({ data, onNodeClick }: UseNetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);
  
  // State for tracking active filters
  const [activeClusterFilters, setActiveClusterFilters] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get filtered data based on active filters and search term
  const getFilteredData = (): NetworkData | undefined => {
    if (!data) return undefined;
    
    // If no filters are active, return all data
    if (activeClusterFilters.length === 0 && !searchTerm) {
      return data;
    }
    
    // Filter nodes based on active cluster filters and search term
    const filteredNodes = data.nodes.filter(node => {
      // For cluster nodes, check if they're in the active filters
      if (node.type === 'cluster') {
        return activeClusterFilters.includes(parseInt(node.id));
      }
      
      // For contact nodes, check if their cluster is in the active filters
      if (node.type === 'contact') {
        const clusterMatch = activeClusterFilters.includes(node.clusterId || 0);
        
        // If there's no search term, just check the cluster
        if (!searchTerm) return clusterMatch;
        
        // If there's a search term, check the name and role
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = node.name.toLowerCase().includes(searchLower);
        const roleMatch = node.role?.toLowerCase().includes(searchLower) || false;
        
        return clusterMatch && (nameMatch || roleMatch);
      }
      
      return false;
    });
    
    // Filter links to only include links between filtered nodes
    const filteredLinks = data.links.filter(link => {
      const sourceExists = filteredNodes.some(n => n.id === link.source);
      const targetExists = filteredNodes.some(n => n.id === link.target);
      return sourceExists && targetExists;
    });
    
    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  };
  
  // Initialize the graph when data changes
  useEffect(() => {
    if (!data || !svgRef.current) return;
    
    // Clean up any existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }
    
    const filteredData = getFilteredData();
    if (!filteredData) return;
    
    // TODO: Initialize D3 graph here
    
  }, [data, activeClusterFilters, searchTerm]);
  
  return {
    svgRef,
    activeClusterFilters,
    setActiveClusterFilters,
    searchTerm,
    setSearchTerm,
  };
}
