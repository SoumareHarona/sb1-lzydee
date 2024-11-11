import express from 'express';
import cors from 'cors';
import { db, asyncRun, asyncGet, asyncAll } from './db.js';
import { calculatePrice } from './pricing.js';
import clientRoutes from './routes/clientRoutes.js';
import freightRoutes from './routes/freightRoutes.js';
import shipmentRoutes from './routes/shipments.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/freight-numbers', freightRoutes);
app.use('/api/shipments', shipmentRoutes);

// Get dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    const [stats, totalClients, recentShipments] = await Promise.all([
      asyncGet(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN mode = 'air' THEN 1 ELSE 0 END) as airFreight,
          SUM(CASE WHEN mode = 'sea' THEN 1 ELSE 0 END) as seaFreight
        FROM freight_numbers
      `),
      asyncGet('SELECT COUNT(DISTINCT sender_phone) + COUNT(DISTINCT recipient_phone) as total FROM clients'),
      asyncAll(`
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
        LIMIT 5
      `)
    ]);

    if (!stats || !totalClients) {
      throw new Error('Failed to retrieve dashboard statistics');
    }

    const mappedShipments = recentShipments.map(shipment => {
      const weights = {
        food: shipment.food_weight || 0,
        nonFood: shipment.non_food_weight || 0,
        hn7: shipment.hn7_weight || 0
      };

      const volume = {
        length: shipment.length || 0,
        width: shipment.width || 0,
        height: shipment.height || 0
      };

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
          phone: shipment.recipient_phone
        },
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

    res.json({
      activeShipments: stats.total || 0,
      airFreight: stats.airFreight || 0,
      seaFreight: stats.seaFreight || 0,
      totalClients: totalClients.total || 0,
      recentShipments: mappedShipments
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ 
      error: 'Failed to retrieve dashboard data',
      details: err.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});