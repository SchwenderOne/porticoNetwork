import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClusterSchema, 
  insertContactSchema, 
  insertConnectionSchema 
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for clusters
  app.get("/api/clusters", async (req, res) => {
    try {
      const clusters = await storage.getClusters();
      res.json(clusters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clusters" });
    }
  });

  app.get("/api/clusters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cluster = await storage.getCluster(id);
      
      if (!cluster) {
        return res.status(404).json({ message: "Cluster not found" });
      }
      
      res.json(cluster);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cluster" });
    }
  });

  app.post("/api/clusters", async (req, res) => {
    try {
      const parseResult = insertClusterSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: fromZodError(parseResult.error).message 
        });
      }
      
      const newCluster = await storage.createCluster(parseResult.data);
      res.status(201).json(newCluster);
    } catch (error) {
      res.status(500).json({ message: "Failed to create cluster" });
    }
  });

  app.patch("/api/clusters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = insertClusterSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: fromZodError(parseResult.error).message 
        });
      }
      
      const updatedCluster = await storage.updateCluster(id, parseResult.data);
      
      if (!updatedCluster) {
        return res.status(404).json({ message: "Cluster not found" });
      }
      
      res.json(updatedCluster);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cluster" });
    }
  });

  app.delete("/api/clusters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCluster(id);
      
      if (!success) {
        return res.status(404).json({ message: "Cluster not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cluster" });
    }
  });

  // API routes for contacts
  app.get("/api/contacts", async (req, res) => {
    try {
      let contacts;
      
      // Filter by cluster if clusterId is provided
      if (req.query.clusterId) {
        const clusterId = parseInt(req.query.clusterId as string);
        contacts = await storage.getContactsByCluster(clusterId);
      } else {
        contacts = await storage.getContacts();
      }
      
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContact(id);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const parseResult = insertContactSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: fromZodError(parseResult.error).message 
        });
      }
      
      // Validate if cluster exists
      const cluster = await storage.getCluster(parseResult.data.clusterId);
      if (!cluster) {
        return res.status(400).json({ message: "Specified cluster does not exist" });
      }
      
      const newContact = await storage.createContact(parseResult.data);
      res.status(201).json(newContact);
    } catch (error) {
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = insertContactSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: fromZodError(parseResult.error).message 
        });
      }
      
      // If clusterId is provided, validate if cluster exists
      if (parseResult.data.clusterId) {
        const cluster = await storage.getCluster(parseResult.data.clusterId);
        if (!cluster) {
          return res.status(400).json({ message: "Specified cluster does not exist" });
        }
      }
      
      const updatedContact = await storage.updateContact(id, parseResult.data);
      
      if (!updatedContact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(updatedContact);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContact(id);
      
      if (!success) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // API routes for connections
  app.get("/api/connections", async (req, res) => {
    try {
      const connections = await storage.getConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.post("/api/connections", async (req, res) => {
    try {
      const parseResult = insertConnectionSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: fromZodError(parseResult.error).message 
        });
      }
      
      const newConnection = await storage.createConnection(parseResult.data);
      res.status(201).json(newConnection);
    } catch (error) {
      res.status(500).json({ message: "Failed to create connection" });
    }
  });

  app.delete("/api/connections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteConnection(id);
      
      if (!success) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  // API route for full network data
  app.get("/api/network", async (req, res) => {
    try {
      const networkData = await storage.getNetworkData();
      res.json(networkData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch network data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
