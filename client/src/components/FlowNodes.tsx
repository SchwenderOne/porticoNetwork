import React from 'react';
import { Handle, Position } from 'reactflow';
import { Node as NetworkNode } from '@shared/schema';

interface NodeProps {
  data: {
    label: string;
    color?: string;
    originalNode: NetworkNode;
  };
}

export const ClusterNode: React.FC<NodeProps> = ({ data }) => (
  <div className="glass p-3 rounded-lg border relative" style={{ backgroundColor: data.color }}>
    <strong>{data.label}</strong>
    <Handle id="top" type="target" position={Position.Top} />
    <Handle id="bottom" type="source" position={Position.Bottom} />
  </div>
);

export const ContactNode: React.FC<NodeProps> = ({ data }) => (
  <div className="glass p-2 rounded-lg border relative" style={{ backgroundColor: data.color }}>
    {data.label}
    <Handle id="left" type="target" position={Position.Left} />
    <Handle id="right" type="source" position={Position.Right} />
  </div>
);

export const nodeTypes = {
  cluster: ClusterNode,
  contact: ContactNode,
}; 