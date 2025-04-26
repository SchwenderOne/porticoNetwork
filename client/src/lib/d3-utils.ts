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
  
  // Vorherige Transformation aus dem localStorage wiederherstellen
  const savedTransform = localStorage.getItem('networkZoomTransform');
  
  // Add zoom functionality
  const zoom = d3.zoom()
    .scaleExtent([0.3, 3]) // Min and max zoom scale
    .on("zoom", (event) => {
      // Transform the graph container based on zoom event
      graphContainer.attr("transform", event.transform);
      
      // Speichern der aktuellen Transformation in localStorage
      localStorage.setItem('networkZoomTransform', JSON.stringify({
        x: event.transform.x,
        y: event.transform.y,
        k: event.transform.k
      }));
    });
  
  // Enable zooming on the SVG element
  svg.call(zoom as any);
  
  // Hilfsfunktion für "Fit-to-View" Funktionalität
  const fitToViewHelper = () => {
    // Berechne die Grenzen des Netzwerks
    const nodeElements = graphContainer.selectAll(".nodes g");
    if (nodeElements.size() === 0) return;
    
    // Berechne den Mittelpunkt und die benötigte Skalierung
    const bounds = { 
      minX: Infinity, minY: Infinity, 
      maxX: -Infinity, maxY: -Infinity 
    };
    
    nodeElements.each((d: any) => {
      const x = d.x || 0;
      const y = d.y || 0;
      const radius = d.type === 'cluster' ? 100 : 85;
      
      bounds.minX = Math.min(bounds.minX, x - radius);
      bounds.minY = Math.min(bounds.minY, y - radius);
      bounds.maxX = Math.max(bounds.maxX, x + radius);
      bounds.maxY = Math.max(bounds.maxY, y + radius);
    });
    
    // Hinzufügen eines Puffers
    const padding = 40;
    bounds.minX -= padding;
    bounds.minY -= padding;
    bounds.maxX += padding;
    bounds.maxY += padding;
    
    const dx = bounds.maxX - bounds.minX;
    const dy = bounds.maxY - bounds.minY;
    const x = (bounds.minX + bounds.maxX) / 2;
    const y = (bounds.minY + bounds.maxY) / 2;
    
    // Berechne die benötigte Skalierung
    const scale = Math.min(
      0.9 * width / dx,
      0.9 * height / dy
    );
    
    // Setze die Transformation
    svg.transition().duration(750).call(
      zoom.transform as any,
      d3.zoomIdentity.translate(width / 2, height / 2)
        .scale(scale)
        .translate(-x, -y)
    );
  };
  
  // Wir verwenden einen einfacheren Ansatz zur Vermeidung des häufigen Zoomens
  // Ein Flag im localStorage gibt an, ob wir beim ersten Laden einen initialen Zoom durchführen sollen
  const initialZoomPerformedString = sessionStorage.getItem('initialZoomPerformed');
  const initialZoomPerformed = initialZoomPerformedString === 'true';
  
  // Nur beim ersten Laden die Zoom-Transformation anwenden
  if (!initialZoomPerformed) {
    // Flag setzen, damit wir nur einmal zoomen
    sessionStorage.setItem('initialZoomPerformed', 'true');
    
    if (savedTransform) {
      try {
        const transform = JSON.parse(savedTransform);
        // Direkte Anwendung ohne setTimeout, um Timing-Probleme zu vermeiden
        // Explizite Transition mit dem transform verwenden
        svg.transition().duration(200).call(
          zoom.transform as any,
          d3.zoomIdentity
            .translate(transform.x, transform.y)
            .scale(transform.k)
        );
        console.log("Zoom-Transformation beim Start wiederhergestellt");
      } catch (e) {
        console.error('Failed to restore zoom transform:', e);
        // Bei Fehler den Fit-to-View als Fallback verwenden
        fitToViewHelper();
      }
    } else {
      // Wenn keine gespeicherte Transformation vorhanden ist, an die Netzwerkgröße anpassen
      setTimeout(() => {
        fitToViewHelper();
      }, 300);
    }
  }
  
  // Add zoom controls - positioniert auf der linken Seite, um Überlappung zu vermeiden
  const zoomControls = svg.append("g")
    .attr("class", "zoom-controls")
    .attr("transform", `translate(25, ${height - 150})`);
  
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
  
  // Fit to View Button (zeigt das gesamte Netzwerk)
  zoomControls.append("circle")
    .attr("cx", 25)
    .attr("cy", 125)
    .attr("r", 20)
    .attr("fill", "rgba(255, 255, 255, 0.8)")
    .attr("stroke", "#ccc");
  
  // Kleines Icon zum Anzeigen der "alles anzeigen" Funktion (Fit to View)
  const fitToViewIcon = zoomControls.append("g")
    .attr("transform", "translate(25, 125)")
    .style("pointer-events", "none");
  
  // Äußerer Rahmen für das Symbol
  fitToViewIcon.append("rect")
    .attr("x", -8)
    .attr("y", -8) 
    .attr("width", 16)
    .attr("height", 16)
    .attr("rx", 2)
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5);
  
  // Vier kleine Pfeile nach außen an den Ecken
  // Oben links
  fitToViewIcon.append("path")
    .attr("d", "M-6,-2 L-6,-6 L-2,-6")
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5);
    
  // Oben rechts
  fitToViewIcon.append("path")
    .attr("d", "M6,-2 L6,-6 L2,-6") 
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5);
    
  // Unten links  
  fitToViewIcon.append("path")
    .attr("d", "M-6,2 L-6,6 L-2,6")
    .attr("fill", "none") 
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5);
    
  // Unten rechts
  fitToViewIcon.append("path") 
    .attr("d", "M6,2 L6,6 L2,6")
    .attr("fill", "none")
    .attr("stroke", "#333") 
    .attr("stroke-width", 1.5);
  
  // Event listeners for zoom buttons
  zoomControls.select("circle:nth-of-type(1)")
    .on("click", (event) => {
      event.stopPropagation(); // Verhindert, dass das Event weitergeleitet wird
      svg.transition().duration(300).call(zoom.scaleBy as any, 1.3);
    });
  
  zoomControls.select("circle:nth-of-type(2)")
    .on("click", (event) => {
      event.stopPropagation(); // Verhindert, dass das Event weitergeleitet wird
      svg.transition().duration(300).call(zoom.scaleBy as any, 0.7);
    });
  
  // Fit to View Button - Zeigt das gesamte Netzwerk
  zoomControls.select("circle:nth-of-type(3)")
    .on("click", (event) => {
      event.stopPropagation(); // Verhindert, dass das Event weitergeleitet wird
      
      // Beim Klick auf "Fit to View" setzen wir den gespeicherten Zoom-Status zurück
      localStorage.removeItem('networkZoomTransform');
      
      // Verwende die Hilfsfunktion, um die Ansicht anzupassen
      fitToViewHelper(); 
    });
  
  // Return cleanup function
  return () => {
    simulation.stop();
    svg.on(".zoom", null);
  };
}
