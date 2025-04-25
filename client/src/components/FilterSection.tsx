import React from 'react';
import { Cluster } from '@shared/schema';
import { Search } from 'lucide-react';

interface FilterSectionProps {
  clusters: Cluster[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilters: number[];
  toggleFilter: (clusterId: number) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ 
  clusters, 
  searchTerm, 
  setSearchTerm,
  activeFilters,
  toggleFilter
}) => {
  return (
    <div className="glass rounded-xl p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Suche nach Namen oder Rolle..."
            className="pl-10 pr-4 py-2 rounded-lg w-full border border-gray-200 bg-white bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
        </div>
        
        {/* Cluster Legend */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <span className="text-sm font-medium mr-2 self-center">Filter:</span>
          
          {clusters.map((cluster) => (
            <label key={cluster.id} className="inline-flex items-center">
              <input 
                type="checkbox" 
                className="form-checkbox h-4 w-4 rounded" 
                checked={activeFilters.includes(cluster.id)} 
                onChange={() => toggleFilter(cluster.id)}
                style={{ color: cluster.color }} 
              />
              <span className="ml-2 text-sm">{cluster.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
