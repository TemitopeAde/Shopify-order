import { useState } from "react";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  HeadersFunction,
} from "react-router";
import { useActionData, Form } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { dropshippingService } from "../lib/services/dropshippingService";
import type { ShopifyOrderData } from "../lib/types/dropshipping";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return {};
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);

  console.log('\n========== TEST ORDER SUBMISSION STARTED ==========');

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const address1 = formData.get("address1") as string;
  const city = formData.get("city") as string;
  const province = formData.get("province") as string;
  const zip = formData.get("zip") as string;
  const country = formData.get("country") as string;
  const phone = formData.get("phone") as string;
  const sku = formData.get("sku") as string;

  console.log('Form Data Received:');
  console.log('  Email:', email);
  console.log('  Name:', firstName, lastName);
  console.log('  SKU:', sku);
  console.log('===================================================\n');

  // Create a test order
  const testOrder: ShopifyOrderData = {
    id: Math.floor(Math.random() * 1000000),
    order_number: Math.floor(Math.random() * 10000),
    email: email || "test@example.com",
    line_items: [
      {
        sku: sku || "TEST-SKU-001",
        variant_title: "Default",
        quantity: 1,
        name: "Test Product",
      },
    ],
    shipping_address: {
      first_name: firstName || "Test",
      last_name: lastName || "Customer",
      company: "Test Company",
      address1: address1 || "123 Test St",
      address2: "",
      city: city || "Test City",
      province: province || "CA",
      country: country || "US",
      zip: zip || "12345",
      phone: phone || "555-1234",
    },
    billing_address: {
      first_name: firstName || "Test",
      last_name: lastName || "Customer",
      company: "Test Company",
      address1: address1 || "123 Test St",
      address2: "",
      city: city || "Test City",
      province: province || "CA",
      country: country || "US",
      zip: zip || "12345",
      phone: phone || "555-1234",
    },
  };

  try {
    const result = await dropshippingService.submitOrder(testOrder);

    console.log('\n========== TEST ORDER RESULT ==========');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('Order ID:', result.orderId);
    console.log('Error:', result.error || 'None');
    console.log('=======================================\n');

    return {
      success: result.success,
      message: result.message,
      error: result.error,
      orderId: result.orderId,
    };
  } catch (error) {
    console.error('\n========== TEST ORDER EXCEPTION ==========');
    console.error('Exception caught:', error);
    console.error('==========================================\n');

    return {
      success: false,
      message: "Failed to submit test order",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default function TestOrder() {
  const actionData = useActionData<typeof action>();

  return (
    <s-page heading="Test Order Submission">
      <s-section heading="Submit Test Order">
        <s-paragraph>
          Use this form to submit a test order to the dropshipping API. This
          helps verify the integration is working correctly.
        </s-paragraph>

        <Form method="post">
          <s-stack direction="block" gap="base">
            {/* Customer Info */}
            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="surface"
            >
              <s-stack direction="block" gap="base">
                <s-heading level={3}>Customer Information</s-heading>

                <div>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    defaultValue="test@example.com"
                    required
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      defaultValue="Test"
                      required
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      defaultValue="Customer"
                      required
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                </div>
              </s-stack>
            </s-box>

            {/* Shipping Address */}
            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="surface"
            >
              <s-stack direction="block" gap="base">
                <s-heading level={3}>Shipping Address</s-heading>

                <div>
                  <label htmlFor="address1">Address</label>
                  <input
                    type="text"
                    name="address1"
                    id="address1"
                    defaultValue="123 Test Street"
                    required
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      defaultValue="Test City"
                      required
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="province">State/Province</label>
                    <input
                      type="text"
                      name="province"
                      id="province"
                      defaultValue="CA"
                      required
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="zip">ZIP Code</label>
                    <input
                      type="text"
                      name="zip"
                      id="zip"
                      defaultValue="12345"
                      required
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      name="country"
                      id="country"
                      defaultValue="US"
                      required
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    defaultValue="555-1234"
                    required
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              </s-stack>
            </s-box>

            {/* Product Info */}
            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="surface"
            >
              <s-stack direction="block" gap="base">
                <s-heading level={3}>Product</s-heading>

                <div>
                  <label htmlFor="sku">Product SKU</label>
                  <input
                    type="text"
                    name="sku"
                    id="sku"
                    defaultValue="TEST-SKU-001"
                    required
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                  <s-text variant="subdued">
                    Enter a valid SKU from the dropshipping supplier
                  </s-text>
                </div>
              </s-stack>
            </s-box>

            <s-button type="submit">Submit Test Order</s-button>
          </s-stack>
        </Form>

        {/* Result Message */}
        {actionData && (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background={actionData.success ? "success" : "critical"}
            style={{ marginTop: "16px" }}
          >
            <s-stack direction="block" gap="small">
              <s-heading level={4}>
                {actionData.success ? "Success!" : "Error"}
              </s-heading>
              <s-paragraph>{actionData.message}</s-paragraph>
              {actionData.orderId && (
                <s-paragraph>Order ID: {actionData.orderId}</s-paragraph>
              )}
              {actionData.error && (
                <s-paragraph>Error: {actionData.error}</s-paragraph>
              )}
            </s-stack>
          </s-box>
        )}
      </s-section>

      <s-section slot="aside" heading="How This Works">
        <s-paragraph>
          This form simulates a Shopify order being submitted to the
          dropshipping API.
        </s-paragraph>
        <s-paragraph>
          After submitting, the order will be sent to the Quintessence Jewelry
          API for fulfillment.
        </s-paragraph>
        <s-paragraph>
          Once the supplier processes and ships the order, you'll see it appear
          in the Orders page with tracking information.
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Next Steps">
        <s-ordered-list>
          <s-list-item>Submit a test order using this form</s-list-item>
          <s-list-item>
            Wait for the supplier to process the order (may take 1-2 days)
          </s-list-item>
          <s-list-item>
            Check the Orders page to see the shipping status
          </s-list-item>
          <s-list-item>
            Orders with tracking numbers are confirmed as shipped
          </s-list-item>
        </s-ordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
