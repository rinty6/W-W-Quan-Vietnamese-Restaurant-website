const pool = require('../config/db');

async function createOrder(order, items) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.execute(
      `INSERT INTO orders
       (name, phone, note, pickup_type, datetime, subtotal, total, stripe_payment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.name,
        order.phone,
        order.note || null,
        order.pickup_type,
        order.datetime,
        order.subtotal,
        order.total,
        order.stripe_payment_id
      ]
    );

    const orderId = res.insertId;

    for (const item of items) {
      const [itemRes] = await conn.execute(
        `INSERT INTO order_items
         (order_id, dish_id, dish_name, dish_price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id ?? null,
          item.name ?? null,
          item.dishPrice ?? null,
          item.quantity ?? 1
        ]
      );

      const orderItemId = itemRes.insertId;

      if (item.sides) {
        for (const side of item.sides) {
          await conn.execute(
            `INSERT INTO order_item_sides
             (order_item_id, side_name, side_price)
             VALUES (?, ?, ?)`,
            [
              orderItemId,
              side.name ?? null,
              side.price ?? null
            ]
          );
        }
      }
    }

    await conn.commit();
    return orderId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { createOrder };