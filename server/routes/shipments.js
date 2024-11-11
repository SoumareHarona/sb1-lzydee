import express from 'express';
import { asyncAll, asyncGet } from '../db.js';
import { calculatePrice } from '../pricing.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const shipments = await asyncAll(`
      SELECT 
        c.*,
        f.number as freight_number,
        f.mode,
        f.origin,
        f.destination,
        f.status
      FROM clients c
      JOIN freight_numbers f ON c.freight_number_id = f.id
      ORDER BY c.created_at DESC
    `);

    const mappedShipments = shipments.map(shipment => {
      const weights = {
        food: shipment.food_weight || 0,
        nonFood: shipment.non_food_weight || 0,
        hn7: shipment.hn7_weight || 0
      };

      const volume = shipment.mode === 'sea' ? {
        length: shipment.length || 0,
        width: shipment.width || 0,
        height: shipment.height || 0
      } : undefined;

      const price = calculatePrice(shipment.mode, weights, volume);

      return {
        id: shipment.id,
        trackingNumber: shipment.tracking_number,
        freightNumber: shipment.freight_number,
        mode: shipment.mode,
        origin: shipment.origin,
        destination: shipment.destination,
        status: shipment.status,
        sender: {
          name: shipment.sender_name,
          phone: shipment.sender_phone
        },
        recipient: {
          name: shipment.recipient_name,
          phone: shipment.recipient_phone,
          email: shipment.recipient_email,
          street: shipment.recipient_street,
          city: shipment.recipient_city,
          landmark: shipment.recipient_landmark
        },
        weights,
        volume,
        packaging: shipment.packaging,
        payment: {
          baseAmount: price.baseAmountEUR,
          baseAmountXOF: price.baseAmountXOF,
          advanceAmount: price.advanceAmountEUR,
          advanceAmountXOF: price.advanceAmountXOF,
          remainingAmount: price.remainingEUR,
          remainingAmountXOF: price.remainingXOF
        },
        createdAt: shipment.created_at
      };
    });

    res.json(mappedShipments);
  } catch (err) {
    console.error('Error fetching shipments:', err);
    res.status(500).json({ 
      error: 'Failed to retrieve shipments',
      details: err.message 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const shipment = await asyncGet(`
      SELECT 
        c.*,
        f.number as freight_number,
        f.mode,
        f.origin,
        f.destination,
        f.status
      FROM clients c
      JOIN freight_numbers f ON c.freight_number_id = f.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const weights = {
      food: shipment.food_weight || 0,
      nonFood: shipment.non_food_weight || 0,
      hn7: shipment.hn7_weight || 0
    };

    const volume = shipment.mode === 'sea' ? {
      length: shipment.length || 0,
      width: shipment.width || 0,
      height: shipment.height || 0
    } : undefined;

    const price = calculatePrice(shipment.mode, weights, volume);

    res.json({
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      freightNumber: shipment.freight_number,
      mode: shipment.mode,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status,
      sender: {
        name: shipment.sender_name,
        phone: shipment.sender_phone
      },
      recipient: {
        name: shipment.recipient_name,
        phone: shipment.recipient_phone,
        email: shipment.recipient_email,
        street: shipment.recipient_street,
        city: shipment.recipient_city,
        landmark: shipment.recipient_landmark
      },
      weights,
      volume,
      packaging: shipment.packaging,
      payment: {
        baseAmount: price.baseAmountEUR,
        baseAmountXOF: price.baseAmountXOF,
        advanceAmount: price.advanceAmountEUR,
        advanceAmountXOF: price.advanceAmountXOF,
        remainingAmount: price.remainingEUR,
        remainingAmountXOF: price.remainingXOF
      },
      createdAt: shipment.created_at
    });
  } catch (err) {
    console.error('Error fetching shipment:', err);
    res.status(500).json({ 
      error: 'Failed to retrieve shipment',
      details: err.message 
    });
  }
});

export default router;