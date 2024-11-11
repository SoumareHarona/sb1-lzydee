import { v4 as uuidv4 } from 'uuid';
import { asyncGet, asyncRun } from '../db.js';
import { generateTrackingNumber } from '../utils/tracking.js';
import { generateQRCode } from '../utils/qrcode.js';
import { sendNotification } from '../utils/notifications.js';

export async function createClient(db, data) {
  const {
    freightNumberId,
    senderName,
    senderPhone,
    recipientName,
    recipientPhone,
    recipientEmail = null,
    recipientStreet = null,
    recipientCity = null,
    recipientLandmark = null,
    recipientNotes = null,
    foodWeight = 0,
    nonFoodWeight = 0,
    hn7Weight = 0,
    length = 0,
    width = 0,
    height = 0,
    packageType = null,
    packaging,
    specialHandling = [],
    comments = null,
    additionalFeesAmount = 0,
    additionalFeesCurrency = 'EUR',
    advanceAmount = 0,
    advanceCurrency = 'EUR'
  } = data;

  // Validate required fields
  if (!freightNumberId || !senderName || !senderPhone || !recipientName || !recipientPhone || !packaging) {
    throw new Error('Missing required fields');
  }

  // Get the freight number for tracking number generation
  const freightNumber = await asyncGet('SELECT number FROM freight_numbers WHERE id = ?', [freightNumberId]);
  if (!freightNumber) {
    throw new Error('Freight number not found');
  }

  const id = uuidv4();
  const trackingNumber = generateTrackingNumber(freightNumber.number);

  // Generate QR code
  const qrCode = await generateQRCode({
    trackingNumber,
    freightNumber: freightNumber.number,
    sender: { name: senderName, phone: senderPhone },
    recipient: { name: recipientName, phone: recipientPhone },
    packaging
  });

  const stmt = db.prepare(`
    INSERT INTO clients (
      id, freight_number_id, tracking_number, qr_code,
      sender_name, sender_phone,
      recipient_name, recipient_phone, recipient_email,
      recipient_street, recipient_city, recipient_landmark, recipient_notes,
      food_weight, non_food_weight, hn7_weight,
      length, width, height,
      package_type, packaging, special_handling, comments,
      additional_fees_amount, additional_fees_currency,
      advance_amount, advance_currency,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  try {
    stmt.run(
      id, freightNumberId, trackingNumber, qrCode,
      senderName, senderPhone,
      recipientName, recipientPhone, recipientEmail,
      recipientStreet, recipientCity, recipientLandmark, recipientNotes,
      foodWeight, nonFoodWeight, hn7Weight,
      length, width, height,
      packageType, packaging, JSON.stringify(specialHandling), comments,
      additionalFeesAmount, additionalFeesCurrency,
      advanceAmount, advanceCurrency
    );

    // Send notifications
    await Promise.all([
      sendNotification(senderPhone, `Your shipment has been created with tracking number: ${trackingNumber}`),
      sendNotification(recipientPhone, `A shipment is on its way to you. Tracking number: ${trackingNumber}`)
    ]);

    return {
      id,
      trackingNumber,
      qrCode
    };
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  } finally {
    stmt.finalize();
  }
}

export async function updateClient(db, id, data) {
  const client = await asyncGet('SELECT id FROM clients WHERE id = ?', [id]);
  if (!client) {
    throw new Error('Client not found');
  }

  const updateFields = [];
  const values = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  try {
    await asyncRun(
      `UPDATE clients SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    return await asyncGet('SELECT * FROM clients WHERE id = ?', [id]);
  } catch (error) {
    throw new Error(`Failed to update client: ${error.message}`);
  }
}

export async function deleteClient(db, id) {
  const client = await asyncGet('SELECT id FROM clients WHERE id = ?', [id]);
  if (!client) {
    throw new Error('Client not found');
  }

  try {
    await asyncRun('DELETE FROM clients WHERE id = ?', [id]);
  } catch (error) {
    throw new Error(`Failed to delete client: ${error.message}`);
  }
}