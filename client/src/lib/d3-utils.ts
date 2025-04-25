import * as d3 from 'd3';
import { NetworkData, Node } from '@shared/schema';

export function initializeNetworkGraph(
  svgElement: SVGSVGElement,
  data: NetworkData,
  onNodeClick: (node: Node) => void
) {
  // Clear existing elements
  d3.select(svgElement).selectAll("*").remove();
  
  const svg = d3.select(svgElement);
  const width = svgElement.clientWidth;
  const height = svgElement.clientHeight;
  
  // Create g elements for links and nodes
  const linksGroup = svg.append("g").attr("class", "links");
  const nodesGroup = svg.append("g").attr("class", "nodes");
  
  // Pin the Portico node to the center
  const porticoNode = data.nodes.find(n => n.id === "portico");
  if (porticoNode) {
    porticoNode.fx = width / 2;
    porticoNode.fy = height / 2;
  }
  
  // Create a force simulation
  const simulation = d3.forceSimulation<Node>(data.nodes)
    .force("link", d3.forceLink<Node, any>(data.links)
      .id(d => d.id)
      .distance(d => {
        // Increase distance for links connected to Portico
        if (d.source.id === "portico" || d.target.id === "portico") {
          return 200;
        }
        return 150;
      }))
    .force("charge", d3.forceManyBody().strength(d => 
      d.id === "portico" ? -800 : -400
    ))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => 
      d.id === "portico" ? 100 : (d.type === 'cluster' ? 70 : 85)
    ));
  
  // Create the links
  const link = linksGroup
    .selectAll("line")
    .data(data.links)
    .join("line")
    .attr("stroke", "rgba(150, 150, 150, 0.3)")
    .attr("stroke-width", 1.5);
  
  // Create the nodes
  const node = nodesGroup
    .selectAll("g")
    .data(data.nodes)
    .join("g")
    .call(d3.drag<SVGGElement, Node>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on("click", (event, d) => {
      event.stopPropagation();
      onNodeClick(d);
    });
  
  // Add cluster nodes (circles)
  node.filter(d => d.type === 'cluster')
    .append("circle")
    .attr("r", d => d.id === "portico" ? 90 : 70)
    .attr("fill", d => d.color || 'rgba(200, 200, 200, 0.45)')
    .attr("class", d => d.id === "portico" ? "portico-node" : "cluster-node")
    .attr("stroke", "rgba(255, 255, 255, 0.8)")
    .attr("stroke-width", d => d.id === "portico" ? 2 : 1);
  
  // Add cluster node labels
  node.filter(d => d.type === 'cluster')
    .append("text")
    .text(d => d.name)
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .attr("fill", "#0E1525")
    .attr("font-weight", d => d.id === "portico" ? "700" : "600")
    .attr("font-size", d => d.id === "portico" ? "16px" : "14px");
  
  // Add contact nodes (rectangles)
  node.filter(d => d.type === 'contact')
    .append("rect")
    .attr("width", 170)
    .attr("height", 100)
    .attr("x", -85)
    .attr("y", -50)
    .attr("rx", 24)
    .attr("ry", 24)
    .attr("fill", d => {
      // Find the cluster this contact belongs to
      const clusterNode = data.nodes.find(n => 
        n.type === 'cluster' && n.id === d.clusterId?.toString()
      );
      return clusterNode?.color || 'rgba(200, 200, 200, 0.45)';
    })
    .attr("class", "contact-node")
    .attr("stroke", "rgba(255, 255, 255, 0.8)")
    .attr("stroke-width", 1);
  
  // Add contact node text (name)
  node.filter(d => d.type === 'contact')
    .append("text")
    .text(d => d.name)
    .attr("text-anchor", "middle")
    .attr("dy", "-10")
    .attr("fill", "#0E1525")
    .attr("font-weight", "600");
  
  // Add contact node text (role)
  node.filter(d => d.type === 'contact')
    .append("text")
    .text(d => d.role || '')
    .attr("text-anchor", "middle")
    .attr("dy", "15")
    .attr("fill", "#0E1525")
    .attr("font-size", "14px");
  
  // Update forces on tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => (d.source as any).x)
      .attr("y1", d => (d.source as any).y)
      .attr("x2", d => (d.target as any).x)
      .attr("y2", d => (d.target as any).y);
    
    node.attr("transform", d => `translate(${d.x},${d.y})`);
    
    // Keep nodes within bounds
    node.each((d: any) => {
      d.x = Math.max(85, Math.min(width - 85, d.x));
      d.y = Math.max(50, Math.min(height - 50, d.y));
    });
  });
  
  // Drag functions
  function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
    if (!event.active) simulation.alphaTarget(0);
    
    // Keep Portico node pinned to center, but let other nodes be free
    if (d.id !== "portico") {
      d.fx = null;
      d.fy = null;
    }
  }
  
  // Return a cleanup function
  return () => {
    simulation.stop();
  };
}
