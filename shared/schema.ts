import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the cluster table
export const clusters = pgTable("clusters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

// Define contacts table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  company: text("company"),
  department: text("department"),
  // Erweiterte Kontaktfelder
  emails: jsonb("emails"),
  phones: jsonb("phones"),
  socialLinks: jsonb("social_links"),
  tags: jsonb("tags"),
  address: jsonb("address"),
  firstContact: text("first_contact"),
  lastContact: text("last_contact"),
  nextFollowUp: text("next_follow_up"),
  relationshipStatus: text("relationship_status"),
  relationshipStrength: integer("relationship_strength"),
  profileImage: text("profile_image"),
  communicationPreferences: jsonb("communication_preferences"),
  customFields: jsonb("custom_fields"),
  clusterId: integer("cluster_id").notNull(),
});

// Define the connections (links between nodes)
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  targetId: text("target_id").notNull(),
  sourceType: text("source_type").notNull(),
  targetType: text("target_type").notNull(),
});

// Zod schemas for validation
export const insertClusterSchema = createInsertSchema(clusters).pick({
  name: true,
  color: true,
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  role: true,
  email: true,
  phone: true,
  notes: true,
  company: true,
  department: true,
  emails: true,
  phones: true,
  socialLinks: true,
  tags: true,
  address: true,
  firstContact: true,
  lastContact: true,
  nextFollowUp: true,
  relationshipStatus: true,
  relationshipStrength: true,
  profileImage: true,
  communicationPreferences: true,
  customFields: true,
  clusterId: true,
});

export const insertConnectionSchema = createInsertSchema(connections).pick({
  sourceId: true,
  targetId: true,
  sourceType: true,
  targetType: true,
});

// Node types for the frontend
export const nodeTypes = ["cluster", "contact"] as const;

// Node and Link interfaces for D3.js
export interface Node {
  id: string;
  type: (typeof nodeTypes)[number];
  name: string;
  role?: string;
  company?: string;
  department?: string;
  color?: string;
  clusterId?: number;
  email?: string;
  phone?: string;
  notes?: string;
  // Erweiterte Kontaktfelder
  emails?: string[];
  phones?: string[];
  socialLinks?: Record<string, string>;
  tags?: string[];
  address?: Record<string, string>;
  firstContact?: string;
  lastContact?: string;
  nextFollowUp?: string;
  relationshipStatus?: string;
  relationshipStrength?: number;
  profileImage?: string;
  communicationPreferences?: Record<string, unknown>;
  customFields?: string[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  originalId?: number; // Hinzugefügt für die eindeutige Referenz auf die ursprüngliche ID
}

export interface Link {
  id: string;
  source: string;
  target: string;
  sourceType: (typeof nodeTypes)[number];
  targetType: (typeof nodeTypes)[number];
}

export interface NetworkData {
  nodes: Node[];
  links: Link[];
}

// Types
export type InsertCluster = z.infer<typeof insertClusterSchema>;
export type Cluster = typeof clusters.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connections.$inferSelect;
