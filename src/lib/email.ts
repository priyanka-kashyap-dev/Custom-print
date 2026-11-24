import nodemailer from 'nodemailer';
import { IOrder } from '@/models/Order';

/**
 * Creates nodemailer transport using environment credentials
 */
function createTransporter() {
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Sends order confirmation email to customer (and CCs store admin)
 */
export async function sendOrderConfirmationEmail(order: IOrder): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Email credentials not configured (GMAIL_EMAIL/GMAIL_APP_PASSWORD). Skipping email.');
    return false;
  }

  try {
    const isCOD = order.paymentMethod === 'COD';
    const isPaid = order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'Paid';

    const statusTitle = isCOD
      ? 'Order Placed Successfully – Cash on Delivery'
      : isPaid
      ? 'Payment Successful! Your order has been placed successfully.'
      : 'Order Received – Payment Verification';

    const itemsRowsHtml = order.items
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; font-size: 14px; color: #1e293b;">
            <strong>${item.title}</strong>
            ${item.customDesign?.text ? `<br/><span style="font-size: 12px; color: #64748b;">Custom Text: "${item.customDesign.text}"</span>` : ''}
          </td>
          <td style="padding: 12px 8px; font-size: 14px; text-align: center; color: #475569;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 8px; font-size: 14px; text-align: right; color: #1e293b; font-weight: 600;">
            ₹${item.price * item.quantity}
          </td>
        </tr>
      `
      )
      .join('');

    const shipping = order.shippingAddress;
    const shippingHtml = shipping
      ? `
        <p style="margin: 0; line-height: 1.5; color: #334155;">
          <strong>${shipping.fullName || order.customerName}</strong><br/>
          ${shipping.addressLine1 || ''} ${shipping.addressLine2 || ''}<br/>
          ${shipping.city || ''}, ${shipping.state || ''} ${shipping.postalCode || ''}<br/>
          Phone: ${shipping.phone || order.customerPhone || 'N/A'}
        </p>
      `
      : '<p style="color: #64748b;">Delivery address provided at checkout.</p>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${statusTitle}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">PrintStyle</h1>
            <p style="margin: 6px 0 0; font-size: 15px; opacity: 0.9;">Custom Printing & Personalized Gifts</p>
          </div>

          <!-- Alert Banner -->
          <div style="background: ${isPaid ? '#ecfdf5' : '#eff6ff'}; border-bottom: 1px solid ${isPaid ? '#a7f3d0' : '#bfdbfe'}; padding: 16px 24px; text-align: center;">
            <h2 style="margin: 0; color: ${isPaid ? '#065f46' : '#1e40af'}; font-size: 17px; font-weight: 600;">
              ${statusTitle}
            </h2>
            <p style="margin: 4px 0 0; font-size: 13px; color: ${isPaid ? '#047857' : '#2563eb'};">
              Order ID: <strong>#${order.orderId}</strong>
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <p style="font-size: 15px; color: #334155; margin-top: 0;">
              Hello <strong>${order.customerName}</strong>,
            </p>
            <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
              Thank you for choosing PrintStyle! We have received your order and are currently preparing your custom prints.
            </p>

            <!-- Order & Payment Summary Cards -->
            <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin: 20px -12px;">
              <tr>
                <td style="width: 50%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; vertical-align: top;">
                  <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Payment Method</span>
                  <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                    ${order.paymentMethod === 'UPI' ? 'UPI / QR Code' : order.paymentMethod === 'Card' ? 'Credit / Debit Card' : 'Cash on Delivery (COD)'}
                  </p>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #475569;">
                    Status: <strong style="color: ${isPaid ? '#10b981' : '#f59e0b'};">${order.paymentStatus}</strong>
                  </p>
                  ${order.transactionId ? `<p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">Txn: ${order.transactionId}</p>` : ''}
                </td>
                <td style="width: 50%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; vertical-align: top;">
                  <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Order Progress</span>
                  <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #4f46e5;">
                    ${order.status}
                  </p>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">
                    Placed on: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </td>
              </tr>
            </table>

            <!-- Items Table -->
            <h3 style="font-size: 15px; color: #0f172a; margin: 24px 0 12px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="border-bottom: 2px solid #cbd5e1; background: #f8fafc;">
                  <th style="padding: 10px 8px; font-size: 12px; text-transform: uppercase; text-align: left; color: #475569;">Product</th>
                  <th style="padding: 10px 8px; font-size: 12px; text-transform: uppercase; text-align: center; color: #475569;">Qty</th>
                  <th style="padding: 10px 8px; font-size: 12px; text-transform: uppercase; text-align: right; color: #475569;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>

            <!-- Price Breakdown -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #475569;">
                <span>Product Subtotal</span>
                <span>₹${order.subtotal}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #475569;">
                <span>Delivery Charges</span>
                <span style="color: #10b981;">FREE</span>
              </div>
              ${
                isCOD
                  ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #dc2626; font-weight: 500;">
                  <span>COD Extra Charge ${order.deliveryDistanceKm ? `(${order.deliveryDistanceKm} KM)` : ''}</span>
                  <span>₹${order.codCharge}</span>
                </div>
              `
                  : ''
              }
              <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 10px 0;" />
              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #0f172a;">
                <span>Total Payable</span>
                <span style="color: #4f46e5;">₹${order.total}</span>
              </div>
            </div>

            <!-- Shipping Address -->
            <h3 style="font-size: 15px; color: #0f172a; margin: 24px 0 8px;">Delivery Address</h3>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
              ${shippingHtml}
            </div>

            <!-- Call to action button -->
            <div style="text-align: center; margin: 32px 0 16px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://printstyle.store'}/orders" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; box-shadow: 0 2px 4px rgba(79,70,229,0.3);">
                Track Your Order
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p style="margin: 0 0 6px;">Questions? Reply directly to this email or reach us at <a href="mailto:${process.env.GMAIL_EMAIL || 'support@printstyle.store'}" style="color: #4f46e5;">support</a></p>
            <p style="margin: 0;">© ${new Date().getFullYear()} PrintStyle. All rights reserved.</p>
          </div>

        </div>
      </body>
      </html>
    `;

    const recipients = [order.customerEmail];
    const adminEmail = process.env.ADMIN_EMAIL || 'pkashyap1506@gmail.com';
    if (adminEmail && !recipients.includes(adminEmail)) {
      recipients.push(adminEmail);
    }

    await transporter.sendMail({
      from: `"PrintStyle Orders" <${process.env.GMAIL_EMAIL}>`,
      to: order.customerEmail,
      bcc: adminEmail,
      subject: `Order Confirmation #${order.orderId} - ${statusTitle}`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

/**
 * Sends order status update email to customer
 */
export async function sendOrderStatusUpdateEmail(
  order: IOrder,
  newStatus: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Order Status Update</h2>
          <p>Hello <strong>${order.customerName}</strong>,</p>
          <p>Your order <strong>#${order.orderId}</strong> has been updated to:</p>
          <div style="background: #f1f5f9; padding: 14px 20px; border-radius: 8px; font-size: 18px; font-weight: 700; color: #1e293b; margin: 16px 0;">
            ${newStatus}
          </div>
          <p style="font-size: 14px; color: #64748b;">
            Track the full progress of your order anytime in your account dashboard.
          </p>
          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
            Thank you for shopping with PrintStyle!
          </p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"PrintStyle Updates" <${process.env.GMAIL_EMAIL}>`,
      to: order.customerEmail,
      subject: `Update on your Order #${order.orderId}: ${newStatus}`,
      html: htmlContent,
    });

    return true;
  } catch (err) {
    console.error('Failed to send order status update email:', err);
    return false;
  }
}
