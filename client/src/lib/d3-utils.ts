import * as d3 from 'd3';
import { NetworkData, Node as NetworkNode } from '@shared/schema';

// Implementation with zoom functionality
export function initializeNetworkGraph(
  svgElement: SVGSVGElement,
  data: NetworkData,
  onNodeClick: (node: NetworkNode) => void
): () => void {
  // Clear the SVG
  d3.select(svgElement).selectAll("*").remove();
  
  const svg = d3.select(svgElement);
  const width = svgElement.clientWidth || 800;
  const height = svgElement.clientHeight || 600;
  
  // Create main container for graph that will be zoomed
  const graphContainer = svg.append("g")
    .attr("class", "graph-container");
  
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
  
  // Center coordinates
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Find and position the Portico node in the center
  const porticoNode = nodes.find(n => n.id === "portico");
  if (porticoNode) {
    porticoNode.fx = centerX;
    porticoNode.fy = centerY;
  }
  
  // Position new clusters around the Portico node if they don't have a fixed position
  const clusterNodes = nodes.filter(n => n.type === 'cluster' && n.id !== 'portico');
  const totalClusters = clusterNodes.length;
  
  if (totalClusters > 0) {
    const radius = 250; // Distance from center
    
    clusterNodes.forEach((node, index) => {
      // If no saved position exists, set a fixed position in a circle
      if (!node.fx && !node.fy) {
        const angle = (index / totalClusters) * 2 * Math.PI;
        node.fx = centerX + radius * Math.cos(angle);
        node.fy = centerY + radius * Math.sin(angle);
      }
    });
  }
  
  // Create simulation with forces - applying different strengths to different node types
  const simulation = d3.forceSimulation()
    .nodes(nodes as any)
    .force("link", d3.forceLink(links as any).id((d: any) => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength((d: any) => 
      d.type === 'contact' ? -400 : -100 // Only contacts get strong repulsion
    ))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius((d: any) => 
      d.id === "portico" ? 120 : (d.type === 'cluster' ? 90 : 85)
    ));
  
  // Add links with styles based on connection type
  const link = graphContainer.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke", (d: any) => {
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
      return d.source === "portico" || d.target === "portico" ? "5,3" : null;
    });
  
  // Create node groups
  const node = graphContainer.append("g")
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
      // Find the corresponding cluster node
      const clusterNode = nodes.find(n => 
        n.type === 'cluster' && 
        (n.id === `cluster-${d.clusterId}` || 
         (n.originalId !== undefined && n.originalId === d.clusterId))
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
  
  // Make sure Portico stays centered
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
    d.fx = d.x;
    d.fy = d.y;
    
    // Store position in localStorage
    try {
      const savedPositions = JSON.parse(localStorage.getItem('nodePositions') || '{}');
      savedPositions[d.id] = { x: d.x, y: d.y };
      localStorage.setItem('nodePositions', JSON.stringify(savedPositions));
    } catch (e) {
      console.error('Failed to save node position:', e);
    }
  }
  
  // Add zoom functionality
  const zoom = d3.zoom()
    .scaleExtent([0.3, 3]) // Min and max zoom scale
    .on("zoom", (event) => {
      // Transform the graph container based on zoom event
      graphContainer.attr("transform", event.transform);
    });
  
  // Enable zooming on the SVG element
  svg.call(zoom as any);
  
  // Add zoom controls
  const zoomControls = svg.append("g")
    .attr("class", "zoom-controls")
    .attr("transform", `translate(${width - 70}, ${height - 100})`);
  
  // Zoom-In Button
  zoomControls.append("circle")
    .attr("cx", 25)
    .attr("cy", 25)
    .attr("r", 20)
    .attr("fill", "rgba(255, 255, 255, 0.8)")
    .attr("stroke", "#ccc");
  
  zoomControls.append("text")
    .attr("x", 25)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .attr("fill", "#333")
    .text("+")
    .style("pointer-events", "none");
  
  // Zoom-Out Button
  zoomControls.append("circle")
    .attr("cx", 25)
    .attr("cy", 75)
    .attr("r", 20)
    .attr("fill", "rgba(255, 255, 255, 0.8)")
    .attr("stroke", "#ccc");
  
  zoomControls.append("text")
    .attr("x", 25)
    .attr("y", 80)
    .attr("text-anchor", "middle")
    .attr("font-size", "24px")
    .attr("fill", "#333")
    .text("−")
    .style("pointer-events", "none");
  
  // Event listeners for zoom buttons
  zoomControls.select("circle:first-of-type")
    .on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy as any, 1.3);
    });
  
  zoomControls.select("circle:last-of-type")
    .on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy as any, 0.7);
    });
  
  // Return cleanup function
  return () => {
    simulation.stop();
    svg.on(".zoom", null);
  };
}
