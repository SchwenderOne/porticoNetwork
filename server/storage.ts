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
    // Für Debug-Zwecke den Initialisierungsprozess protokollieren
    console.log('MemStorage wird initialisiert...');
    
    this.clusters = new Map();
    this.contacts = new Map();
    this.connections = new Map();
    
    // Mit Cluster ID 5 beginnen, damit wir Raum für die vordefinierten haben
    this.clusterCurrentId = 5;
    this.contactCurrentId = 1;
    this.connectionCurrentId = 1;

    // Einige Cluster mit festen IDs für Konsistenz initialisieren
    const defaultClusters = [
      { id: 1, name: "Marketing", color: "rgba(173, 216, 230, 0.45)" },
      { id: 2, name: "Finanzen", color: "rgba(144, 238, 144, 0.45)" },
      { id: 3, name: "Technologie", color: "rgba(221, 160, 221, 0.45)" },
      { id: 4, name: "Vertrieb", color: "rgba(255, 255, 224, 0.45)" }
    ];
    
    // Vordefinierte Cluster mit festen IDs hinzufügen
    defaultClusters.forEach(cluster => {
      this.clusters.set(cluster.id, cluster);
    });
    
    console.log(`MemStorage wurde mit ${this.clusters.size} vordefinierten Clustern initialisiert`);
  }

  // Cluster methods
  async getClusters(): Promise<Cluster[]> {
    return Array.from(this.clusters.values());
  }

  async getCluster(id: number): Promise<Cluster | undefined> {
    return this.clusters.get(id);
  }

  async createCluster(insertCluster: InsertCluster): Promise<Cluster> {
    // Nächste verfügbare ID verwenden
    const id = this.clusterCurrentId++;
    
    // Cluster mit der neuen ID erstellen
    const cluster: Cluster = { ...insertCluster, id };
    
    // Cluster in die Map einfügen
    this.clusters.set(id, cluster);
    
    console.log(`Neuer Cluster erstellt: ID=${id}, Name=${cluster.name}, Farbe=${cluster.color}`);
    console.log(`Aktuelle Cluster-Anzahl: ${this.clusters.size}`);
    
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
    const contact: Contact = {
      id,
      name: insertContact.name,
      role: insertContact.role,
      email: insertContact.email || null,
      phone: insertContact.phone || null,
      notes: insertContact.notes || null,
      company: insertContact.company || null,
      department: insertContact.department || null,
      emails: insertContact.emails ?? [],
      phones: insertContact.phones ?? [],
      socialLinks: insertContact.socialLinks ?? {},
      tags: insertContact.tags ?? [],
      address: insertContact.address ?? {},
      firstContact: insertContact.firstContact || null,
      lastContact: insertContact.lastContact || null,
      nextFollowUp: insertContact.nextFollowUp || null,
      relationshipStatus: insertContact.relationshipStatus || null,
      relationshipStrength: insertContact.relationshipStrength ?? null,
      profileImage: insertContact.profileImage || null,
      communicationPreferences: insertContact.communicationPreferences ?? {},
      customFields: insertContact.customFields ?? [],
      clusterId: insertContact.clusterId
    };
    
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
    
    // Create a properly typed updated contact
    const updatedContact: Contact = {
      ...existingContact,
      name: contactUpdate.name !== undefined ? contactUpdate.name : existingContact.name,
      role: contactUpdate.role !== undefined ? contactUpdate.role : existingContact.role,
      email: contactUpdate.email !== undefined ? (contactUpdate.email || null) : existingContact.email,
      phone: contactUpdate.phone !== undefined ? (contactUpdate.phone || null) : existingContact.phone,
      notes: contactUpdate.notes !== undefined ? (contactUpdate.notes || null) : existingContact.notes,
      company: contactUpdate.company !== undefined ? contactUpdate.company : existingContact.company,
      department: contactUpdate.department !== undefined ? contactUpdate.department : existingContact.department,
      emails: contactUpdate.emails !== undefined ? contactUpdate.emails : existingContact.emails,
      phones: contactUpdate.phones !== undefined ? contactUpdate.phones : existingContact.phones,
      socialLinks: contactUpdate.socialLinks !== undefined ? contactUpdate.socialLinks : existingContact.socialLinks,
      tags: contactUpdate.tags !== undefined ? contactUpdate.tags : existingContact.tags,
      address: contactUpdate.address !== undefined ? contactUpdate.address : existingContact.address,
      firstContact: contactUpdate.firstContact !== undefined ? contactUpdate.firstContact : existingContact.firstContact,
      lastContact: contactUpdate.lastContact !== undefined ? contactUpdate.lastContact : existingContact.lastContact,
      nextFollowUp: contactUpdate.nextFollowUp !== undefined ? contactUpdate.nextFollowUp : existingContact.nextFollowUp,
      relationshipStatus: contactUpdate.relationshipStatus !== undefined ? contactUpdate.relationshipStatus : existingContact.relationshipStatus,
      relationshipStrength: contactUpdate.relationshipStrength !== undefined ? contactUpdate.relationshipStrength : existingContact.relationshipStrength,
      profileImage: contactUpdate.profileImage !== undefined ? contactUpdate.profileImage : existingContact.profileImage,
      communicationPreferences: contactUpdate.communicationPreferences !== undefined ? contactUpdate.communicationPreferences : existingContact.communicationPreferences,
      customFields: contactUpdate.customFields !== undefined ? contactUpdate.customFields : existingContact.customFields,
      clusterId: contactUpdate.clusterId !== undefined ? contactUpdate.clusterId : existingContact.clusterId
    };
    
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
    
    // Logging für Debug-Zwecke
    console.log(`getNetworkData: Abfrage von ${clusters.length} Clustern und ${contacts.length} Kontakten`);
    console.log(`Cluster IDs: ${clusters.map(c => c.id).join(', ')}`);
    
    // Create a central Portico node
    const porticoNode: Node = {
      id: "portico",
      type: "cluster",
      name: "Portico",
      color: "rgba(255, 144, 104, 0.6)"
    };
    
    // Map clusters and contacts to nodes with distinct IDs
    // Use 'cluster-{id}' for clusters and 'contact-{id}' for contacts
    const nodes: Node[] = [
      porticoNode,
      ...clusters.map(cluster => ({
        id: `cluster-${cluster.id}`,
        type: 'cluster' as const,
        name: cluster.name,
        color: cluster.color,
        originalId: cluster.id // Keep the original ID for reference
      })),
      ...contacts.map(contact => ({
        id: `contact-${contact.id}`,
        type: 'contact' as const,
        name: contact.name,
        role: contact.role,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        notes: contact.notes || undefined,
        // Erweiterte Felder mit Typassertionen
        emails: contact.emails as string[],
        phones: contact.phones as string[],
        socialLinks: contact.socialLinks as Record<string, string>,
        tags: contact.tags as string[],
        address: contact.address as Record<string, string>,
        firstContact: contact.firstContact ?? undefined,
        lastContact: contact.lastContact ?? undefined,
        nextFollowUp: contact.nextFollowUp ?? undefined,
        relationshipStatus: contact.relationshipStatus ?? undefined,
        relationshipStrength: contact.relationshipStrength ?? undefined,
        profileImage: contact.profileImage ?? undefined,
        communicationPreferences: contact.communicationPreferences as Record<string, unknown>,
        customFields: contact.customFields as string[],
        clusterId: contact.clusterId,
        originalId: contact.id // Keep the original ID for reference
      }))
    ];
    
    // Connect contacts to their respective clusters
    const contactClusterLinks: Link[] = contacts.map(contact => ({
      id: `link-cluster-contact-${contact.id}`,
      source: `cluster-${contact.clusterId}`,
      target: `contact-${contact.id}`,
      sourceType: "cluster",
      targetType: "contact"
    }));
    
    // Create links from Portico to each cluster
    const porticoLinks: Link[] = clusters.map((cluster) => ({
      id: `link-portico-cluster-${cluster.id}`,
      source: "portico",
      target: `cluster-${cluster.id}`,
      sourceType: "cluster",
      targetType: "cluster"
    }));
    
    return { 
      nodes, 
      links: [...contactClusterLinks, ...porticoLinks]
    };
  }
}

export const storage = new MemStorage();
