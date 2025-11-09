import type { ActionFunctionArgs } from "react-router";
import { json } from "react-router";
import { authenticate } from "../shopify.server";
import { dropshippingService } from "../lib/services/dropshippingService";
import type { ShopifyOrderData } from "../lib/types/dropshipping";

/**
 * Test route to manually place an order and see the API response in logs
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);

  try {
    console.log('\n========================================');
    console.log('🧪 MANUAL ORDER TEST INITIATED');
    console.log('========================================\n');

    // Sample test order data
    const testOrderData: ShopifyOrderData = {
      id: Date.now(),
      order_number: Date.now(),
      email: "test@example.com",
      line_items: [
        {
          id: 1,
          sku: "TEST-SKU-001",
          variant_title: "Medium",
          quantity: 2,
          price: "29.99",
          name: "Test Product 1",
        },
        {
          id: 2,
          sku: "TEST-SKU-002",
          variant_title: "Large",
          quantity: 1,
          price: "49.99",
          name: "Test Product 2",
        },
      ],
      shipping_address: {
        first_name: "John",
        last_name: "Doe",
        company: "Test Company",
        address1: "123 Test Street",
        address2: "Apt 4B",
        city: "New York",
        province: "NY",
        country: "United States",
        zip: "10001",
        phone: "555-0123",
      },
      billing_address: {
        first_name: "John",
        last_name: "Doe",
        company: "Test Company",
        address1: "123 Test Street",
        address2: "Apt 4B",
        city: "New York",
        province: "NY",
        country: "United States",
        zip: "10001",
        phone: "555-0123",
      },
      customer: {
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
      },
    };

    console.log('Test Order Data:', JSON.stringify(testOrderData, null, 2));
    console.log('\n');

    // Submit the test order
    const result = await dropshippingService.submitOrder(testOrderData);

    console.log('\n========================================');
    console.log('🧪 MANUAL ORDER TEST RESULT');
    console.log('========================================');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('Order ID:', result.orderId);
    if (result.error) {
      console.log('Error:', result.error);
    }
    console.log('========================================\n');

    return json({
      success: result.success,
      message: result.message,
      orderId: result.orderId,
      error: result.error,
      testOrderData,
    });
  } catch (error) {
    console.error('\n❌ ERROR IN TEST ORDER:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to process test order",
      },
      { status: 500 }
    );
  }
};

export default function TestOrder() {
  return (
    <s-page heading="Test Order Placement">
      <s-section heading="Manual Order Test">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Use this page to manually test order placement and view the API response in your server logs.
          </s-paragraph>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="base">
              <s-heading>How to use:</s-heading>
              <s-ordered-list>
                <s-list-item>
                  Open your terminal where the dev server is running
                </s-list-item>
                <s-list-item>
                  Click the "Place Test Order" button below
                </s-list-item>
                <s-list-item>
                  Watch the logs in your terminal to see the full request and response
                </s-list-item>
              </s-ordered-list>
            </s-stack>
          </s-box>

          <s-form method="post">
            <s-button submit variant="primary">
              Place Test Order
            </s-button>
          </s-form>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
          >
            <s-stack direction="block" gap="small">
              <s-heading>Sample Test Data:</s-heading>
              <s-text variant="subdued">
                • Customer: John Doe (test@example.com)
              </s-text>
              <s-text variant="subdued">
                • Products: 2 items with test SKUs
              </s-text>
              <s-text variant="subdued">
                • Shipping: 123 Test Street, New York, NY 10001
              </s-text>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Log Details">
        <s-paragraph>
          The logs will show:
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>Full request data sent to API</s-list-item>
          <s-list-item>Response status and headers</s-list-item>
          <s-list-item>Raw XML response data</s-list-item>
          <s-list-item>Parsed response details</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}
