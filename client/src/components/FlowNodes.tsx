import React from 'react';
import { Handle, Position } from 'reactflow';
import { Node as NetworkNode } from '@shared/schema';
import { motion } from 'framer-motion';

interface NodeProps {
  data: {
    label: string;
    color?: string;
    originalNode: NetworkNode;
  };
}

export const ClusterNode: React.FC<NodeProps> = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.3 }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="glass p-3 rounded-lg border relative"
    style={{ backgroundColor: data.color }}
  >
    <strong>{data.label}</strong>
    <Handle id="top" type="target" position={Position.Top} />
    <Handle id="bottom" type="source" position={Position.Bottom} />
  </motion.div>
);

export const ContactNode: React.FC<NodeProps> = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.3 }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="glass p-2 rounded-lg border relative"
    style={{ backgroundColor: data.color }}
  >
    {data.label}
    <Handle id="left" type="target" position={Position.Left} />
    <Handle id="right" type="source" position={Position.Right} />
  </motion.div>
);

export const nodeTypes = {
  cluster: ClusterNode,
  contact: ContactNode,
}; 