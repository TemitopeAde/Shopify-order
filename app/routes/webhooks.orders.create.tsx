import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { dropshippingService } from "../lib/services/dropshippingService";
import type { ShopifyOrderData } from "../lib/types/dropshipping";

/**
 * Webhook handler for Shopify orders/create events
 * This is triggered whenever a new order is placed on the Shopify store
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate the webhook request
    const { shop, topic, payload } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for shop: ${shop}`);
    console.log(`Order ID: ${payload.id}, Order Number: ${payload.order_number}`);

    // Extract order data from payload
    const orderData: ShopifyOrderData = {
      id: payload.id,
      order_number: payload.order_number,
      email: payload.email,
      line_items: payload.line_items,
      shipping_address: payload.shipping_address,
      billing_address: payload.billing_address,
      customer: payload.customer,
    };

    // Submit order to dropshipping API
    const result = await dropshippingService.submitOrder(orderData);

    if (result.success) {
      console.log(`✓ Order #${orderData.order_number} successfully submitted to dropshipping API`);
      console.log(`  Dropship Order ID: ${result.orderId}`);
    } else {
      console.error(`✗ Failed to submit order #${orderData.order_number} to dropshipping API`);
      console.error(`  Error: ${result.error}`);
      console.error(`  Message: ${result.message}`);

      // You might want to:
      // 1. Store failed orders in database for retry
      // 2. Send notification to admin
      // 3. Create a tag on the Shopify order indicating dropship failure
    }

    // Always return 200 to acknowledge receipt of webhook
    // Even if dropshipping fails, we don't want Shopify to retry
    return new Response(JSON.stringify({
      received: true,
      dropship_success: result.success,
      order_id: orderData.order_number,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("Error processing orders/create webhook:", error);

    // Return 500 to indicate processing error
    // Shopify will retry the webhook
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
