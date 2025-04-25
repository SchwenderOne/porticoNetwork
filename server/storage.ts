import { 
  Cluster, InsertCluster, Contact, InsertContact, 
  Connection, InsertConnection, Node, Link, NetworkData
} from "@shared/schema";

export interface IStorage {
  // Cluster operations
  getClusters(): Promise<Cluster[]>;
  getCluster(id: number): Promise<Cluster | undefined>;
  createCluster(cluster: InsertCluster): Promise<Cluster>;
  updateCluster(id: number, cluster: Partial<InsertCluster>): Promise<Cluster | undefined>;
  deleteCluster(id: number): Promise<boolean>;

  // Contact operations
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByCluster(clusterId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  // Connection operations
  getConnections(): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  deleteConnection(id: number): Promise<boolean>;

  // Network operations
  getNetworkData(): Promise<NetworkData>;
}

export class MemStorage implements IStorage {
  private clusters: Map<number, Cluster>;
  private contacts: Map<number, Contact>;
  private connections: Map<number, Connection>;
  private clusterCurrentId: number;
  private contactCurrentId: number;
  private connectionCurrentId: number;

  constructor() {
    this.clusters = new Map();
    this.contacts = new Map();
    this.connections = new Map();
    this.clusterCurrentId = 1;
    this.contactCurrentId = 1;
    this.connectionCurrentId = 1;

    // Initialize with some default clusters
    this.createCluster({ name: "Marketing", color: "rgba(173, 216, 230, 0.45)" });
    this.createCluster({ name: "Finanzen", color: "rgba(144, 238, 144, 0.45)" });
    this.createCluster({ name: "Technologie", color: "rgba(221, 160, 221, 0.45)" });
    this.createCluster({ name: "Vertrieb", color: "rgba(255, 255, 224, 0.45)" });
  }

  // Cluster methods
  async getClusters(): Promise<Cluster[]> {
    return Array.from(this.clusters.values());
  }

  async getCluster(id: number): Promise<Cluster | undefined> {
    return this.clusters.get(id);
  }

  async createCluster(insertCluster: InsertCluster): Promise<Cluster> {
    const id = this.clusterCurrentId++;
    const cluster: Cluster = { ...insertCluster, id };
    this.clusters.set(id, cluster);
    return cluster;
  }

  async updateCluster(id: number, clusterUpdate: Partial<InsertCluster>): Promise<Cluster | undefined> {
    const existingCluster = this.clusters.get(id);
    if (!existingCluster) return undefined;
    
    const updatedCluster = { ...existingCluster, ...clusterUpdate };
    this.clusters.set(id, updatedCluster);
    return updatedCluster;
  }

  async deleteCluster(id: number): Promise<boolean> {
    // Delete all contacts associated with this cluster
    const contactsToDelete = Array.from(this.contacts.values())
      .filter(contact => contact.clusterId === id);
    
    contactsToDelete.forEach(contact => {
      this.contacts.delete(contact.id);
      
      // Delete connections for this contact
      const connectionsToDelete = Array.from(this.connections.values())
        .filter(conn => 
          (conn.sourceType === 'contact' && conn.sourceId === contact.id.toString()) || 
          (conn.targetType === 'contact' && conn.targetId === contact.id.toString())
        );
      
      connectionsToDelete.forEach(conn => {
        this.connections.delete(conn.id);
      });
    });
    
    // Delete connections to this cluster
    const clusterConnectionsToDelete = Array.from(this.connections.values())
      .filter(conn => 
        (conn.sourceType === 'cluster' && conn.sourceId === id.toString()) || 
        (conn.targetType === 'cluster' && conn.targetId === id.toString())
      );
    
    clusterConnectionsToDelete.forEach(conn => {
      this.connections.delete(conn.id);
    });
    
    return this.clusters.delete(id);
  }

  // Contact methods
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactsByCluster(clusterId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values())
      .filter(contact => contact.clusterId === clusterId);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.contactCurrentId++;
    const contact: Contact = { ...insertContact, id };
    this.contacts.set(id, contact);
    
    // Automatically create a connection between this contact and its cluster
    this.createConnection({
      sourceId: insertContact.clusterId.toString(),
      targetId: id.toString(),
      sourceType: 'cluster',
      targetType: 'contact'
    });
    
    return contact;
  }

  async updateContact(id: number, contactUpdate: Partial<InsertContact>): Promise<Contact | undefined> {
    const existingContact = this.contacts.get(id);
    if (!existingContact) return undefined;
    
    // If cluster is changing, update connections
    if (contactUpdate.clusterId && contactUpdate.clusterId !== existingContact.clusterId) {
      // Find and delete the old cluster connection
      const oldConnections = Array.from(this.connections.values())
        .filter(conn => 
          conn.sourceType === 'cluster' && 
          conn.targetType === 'contact' && 
          conn.targetId === id.toString() &&
          conn.sourceId === existingContact.clusterId.toString()
        );
      
      oldConnections.forEach(conn => {
        this.connections.delete(conn.id);
      });
      
      // Create new connection to the new cluster
      this.createConnection({
        sourceId: contactUpdate.clusterId.toString(),
        targetId: id.toString(),
        sourceType: 'cluster',
        targetType: 'contact'
      });
    }
    
    const updatedContact = { ...existingContact, ...contactUpdate };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    // Delete connections for this contact
    const connectionsToDelete = Array.from(this.connections.values())
      .filter(conn => 
        (conn.sourceType === 'contact' && conn.sourceId === id.toString()) || 
        (conn.targetType === 'contact' && conn.targetId === id.toString())
      );
    
    connectionsToDelete.forEach(conn => {
      this.connections.delete(conn.id);
    });
    
    return this.contacts.delete(id);
  }

  // Connection methods
  async getConnections(): Promise<Connection[]> {
    return Array.from(this.connections.values());
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const id = this.connectionCurrentId++;
    const connection: Connection = { ...insertConnection, id };
    this.connections.set(id, connection);
    return connection;
  }

  async deleteConnection(id: number): Promise<boolean> {
    return this.connections.delete(id);
  }

  // Network data methods
  async getNetworkData(): Promise<NetworkData> {
    const clusters = await this.getClusters();
    const contacts = await this.getContacts();
    const connections = await this.getConnections();
    
    // Create a central Portico node
    const porticoNode: Node = {
      id: "portico",
      type: "cluster",
      name: "Portico",
      color: "rgba(255, 144, 104, 0.6)"
    };
    
    // Map clusters and contacts to nodes
    const nodes: Node[] = [
      porticoNode,
      ...clusters.map(cluster => ({
        id: cluster.id.toString(),
        type: 'cluster' as const,
        name: cluster.name,
        color: cluster.color
      })),
      ...contacts.map(contact => ({
        id: contact.id.toString(),
        type: 'contact' as const,
        name: contact.name,
        role: contact.role,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        notes: contact.notes || undefined,
        clusterId: contact.clusterId
      }))
    ];
    
    // Map connections to links
    const links: Link[] = connections.map(connection => ({
      id: connection.id.toString(),
      source: connection.sourceId,
      target: connection.targetId,
      sourceType: connection.sourceType as any,
      targetType: connection.targetType as any
    }));
    
    // Create links from Portico to each cluster
    const porticoLinks: Link[] = clusters.map((cluster, index) => ({
      id: `portico-${cluster.id}`,
      source: "portico",
      target: cluster.id.toString(),
      sourceType: "cluster",
      targetType: "cluster"
    }));
    
    return { 
      nodes, 
      links: [...links, ...porticoLinks]
    };
  }
}

export const storage = new MemStorage();
