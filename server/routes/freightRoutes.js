import express from 'express';
import { createFreightNumber, updateFreightNumber, deleteFreightNumber } from '../controllers/freightController.js';
import { asyncAll } from '../db.js';
import { db } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const freightNumbers = await asyncAll('SELECT * FROM freight_numbers ORDER BY created_at DESC');
    res.json(freightNumbers);
  } catch (error) {
    console.error('Error fetching freight numbers:', error);
    res.status(500).json({
      error: 'Failed to retrieve freight numbers',
      details: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createFreightNumber(db, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating freight number:', error);
    res.status(error.message.includes('required') ? 400 : 500).json({
      error: error.message || 'Failed to create freight number'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await updateFreightNumber(db, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating freight number:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message || 'Failed to update freight number'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteFreightNumber(db, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting freight number:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message || 'Failed to delete freight number'
    });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    await asyncAll(
      'UPDATE freight_numbers SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating freight status:', error);
    res.status(500).json({
      error: 'Failed to update freight status',
      details: error.message
    });
  }
});

export default router;