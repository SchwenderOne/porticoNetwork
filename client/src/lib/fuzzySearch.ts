import Fuse from 'fuse.js';
import { Node } from '@shared/schema';

/**
 * Performs a fuzzy search on network nodes based on name or role
 */
export function fuzzySearch(nodes: Node[], searchTerm: string): Node[] {
  if (!searchTerm.trim()) {
    return nodes;
  }

  const options = {
    keys: ['name', 'role'],
    threshold: 0.4,
    ignoreLocation: true,
  };

  const fuse = new Fuse(nodes, options);
  const result = fuse.search(searchTerm);
  
  return result.map(item => item.item);
}
