import express from 'express';
import { createClient, updateClient, deleteClient } from '../controllers/clientController.js';
import { asyncAll } from '../db.js';
import { db } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const clients = await asyncAll(`
      SELECT * FROM clients 
      ORDER BY created_at DESC
    `);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      error: 'Failed to retrieve clients',
      details: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createClient(db, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(error.message.includes('required') ? 400 : 500).json({
      error: error.message || 'Failed to create client'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await updateClient(db, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message || 'Failed to update client'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteClient(db, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message || 'Failed to delete client'
    });
  }
});

export default router;