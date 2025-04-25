import * as d3 from 'd3';
import { NetworkData, Node } from '@shared/schema';

// Simple implementation to avoid TypeScript errors
export function initializeNetworkGraph(
  svgElement: SVGSVGElement,
  data: NetworkData,
  onNodeClick: (node: Node) => void
): () => void {
  // Clear the SVG
  d3.select(svgElement).selectAll("*").remove();
  
  const svg = d3.select(svgElement);
  const width = svgElement.clientWidth || 800;
  const height = svgElement.clientHeight || 600;
  
  // Add the Portico node to center if it exists
  const hasPorticoNode = data.nodes.some(n => n.id === "portico");
  let nodes = [...data.nodes];
  let links = [...data.links];
  
  // Restore saved node positions from localStorage if available
  try {
    const savedPositions = JSON.parse(localStorage.getItem('nodePositions') || '{}');
    nodes.forEach(node => {
      if (savedPositions[node.id]) {
        // Apply saved positions as fixed coordinates
        node.fx = savedPositions[node.id].x;
        node.fy = savedPositions[node.id].y;
      }
    });
  } catch (e) {
    console.error('Failed to restore node positions:', e);
  }
  
  // Create simulation with basic forces
  const simulation = d3.forceSimulation()
    .nodes(nodes as any)
    .force("link", d3.forceLink(links as any).id((d: any) => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius((d: any) => 
      d.id === "portico" ? 100 : (d.type === 'cluster' ? 70 : 85)
    ));
  
  // Create links with different styles based on connection type
  const link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke", (d: any) => {
      // Different styles for different connection types
      if (d.source === "portico" || d.target === "portico") {
        return "rgba(120, 120, 180, 0.4)"; // Bluish for Portico connections
      } else if (d.sourceType === "cluster" && d.targetType === "contact") {
        return "rgba(100, 160, 100, 0.4)"; // Greenish for cluster-contact connections
      }
      return "rgba(150, 150, 150, 0.3)"; // Default color
    })
    .attr("stroke-width", (d: any) => {
      return d.source === "portico" || d.target === "portico" ? 2 : 1.5;
    })
    .attr("stroke-dasharray", (d: any) => {
      // Dashed line for Portico connections, solid for others
      return d.source === "portico" || d.target === "portico" ? "5,3" : null;
    });
  
  // Create nodes groups
  const node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .enter().append("g")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended) as any)
    .on("click", function(event, d: any) {
      event.stopPropagation();
      onNodeClick(d);
    });
  
  // Add cluster nodes (rounded rectangles with glassmorphism)
  node.filter((d: any) => d.type === 'cluster')
    .append("rect")
    .attr("width", (d: any) => d.id === "portico" ? 200 : 180)
    .attr("height", (d: any) => d.id === "portico" ? 140 : 120)
    .attr("x", (d: any) => d.id === "portico" ? -100 : -90)
    .attr("y", (d: any) => d.id === "portico" ? -70 : -60)
    .attr("rx", 16)
    .attr("ry", 16)
    .attr("fill", (d: any) => {
      const baseColor = d.color || 'rgba(200, 200, 200, 0.45)';
      return baseColor.replace(/[\d.]+\)$/, d.id === "portico" ? '0.7)' : '0.55)');
    })
    .attr("class", (d: any) => d.id === "portico" ? "portico-node" : "cluster-node")
    .attr("stroke", "rgba(255, 255, 255, 0.9)")
    .attr("stroke-width", (d: any) => d.id === "portico" ? 2 : 1.5);
  
  // Add cluster labels
  node.filter((d: any) => d.type === 'cluster')
    .append("text")
    .text((d: any) => d.name)
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .attr("fill", "#0E1525")
    .attr("font-weight", (d: any) => d.id === "portico" ? "700" : "600")
    .attr("font-size", (d: any) => d.id === "portico" ? "16px" : "14px");
  
  // Add contact nodes (rectangles with glassmorphism)
  node.filter((d: any) => d.type === 'contact')
    .append("rect")
    .attr("width", 170)
    .attr("height", 110)
    .attr("x", -85)
    .attr("y", -55)
    .attr("rx", 16)
    .attr("ry", 16)
    .attr("fill", (d: any) => {
      const clusterNode = nodes.find(n => 
        n.type === 'cluster' && n.id === String(d.clusterId)
      );
      const baseColor = clusterNode?.color || 'rgba(200, 200, 200, 0.45)';
      
      // Create a slightly lighter version of the cluster color
      return baseColor.replace(/[\d.]+\)$/, '0.65)');
    })
    .attr("class", "contact-node")
    .attr("stroke", "rgba(255, 255, 255, 0.9)")
    .attr("stroke-width", 1.5);
  
  // Add contact name
  node.filter((d: any) => d.type === 'contact')
    .append("text")
    .text((d: any) => d.name)
    .attr("text-anchor", "middle")
    .attr("dy", "-10")
    .attr("fill", "#0E1525")
    .attr("font-weight", "600");
  
  // Add contact role
  node.filter((d: any) => d.type === 'contact')
    .append("text")
    .text((d: any) => d.role || '')
    .attr("text-anchor", "middle")
    .attr("dy", "15")
    .attr("fill", "#0E1525")
    .attr("font-size", "14px");
  
  // Pin the Portico node to center if it exists
  if (hasPorticoNode) {
    const porticoNode = nodes.find(n => n.id === "portico") as any;
    if (porticoNode) {
      porticoNode.fx = width / 2;
      porticoNode.fy = height / 2;
    }
  }
  
  // Update the simulation on each tick
  simulation.on("tick", () => {
    link
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y);
    
    node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    
    // Keep nodes within bounds
    nodes.forEach((d: any) => {
      d.x = Math.max(85, Math.min(width - 85, d.x));
      d.y = Math.max(50, Math.min(height - 50, d.y));
    });
  });
  
  // Drag functions
  function dragstarted(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(event: any, d: any) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0);
    
    // Save node position permanently by keeping the fixed coordinates
    // This makes the drag position persistent
    d.fx = d.x;
    d.fy = d.y;
    
    // Create or update the node position in localStorage
    try {
      const savedPositions = JSON.parse(localStorage.getItem('nodePositions') || '{}');
      savedPositions[d.id] = { x: d.x, y: d.y };
      localStorage.setItem('nodePositions', JSON.stringify(savedPositions));
    } catch (e) {
      console.error('Failed to save node position:', e);
    }
  }
  
  // Return a cleanup function
  return () => {
    simulation.stop();
  };
}
