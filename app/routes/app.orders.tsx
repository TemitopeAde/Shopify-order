import { useState, useEffect } from "react";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useRevalidator } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { dropshippingService } from "../lib/services/dropshippingService";
import type { DropshipOrder } from "../lib/types/dropshipping";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Fetch orders from the dropshipping API
  const ordersResponse = await dropshippingService.getOrders();

  return {
    orders: ordersResponse.orders || [],
    success: ordersResponse.success,
    error: ordersResponse.error,
    message: ordersResponse.message,
  };
};

export default function Orders() {
  const data = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const isLoading = revalidator.state === "loading";

  const handleRefresh = () => {
    revalidator.revalidate();
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeTone = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus.includes("shipped") || normalizedStatus === "completed") {
      return "success";
    } else if (normalizedStatus.includes("pending") || normalizedStatus.includes("processing")) {
      return "warning";
    } else if (normalizedStatus.includes("cancelled") || normalizedStatus.includes("failed")) {
      return "critical";
    }
    return "info";
  };

  return (
    <s-page heading="Orders">
      <s-button
        slot="primary-action"
        onClick={handleRefresh}
        {...(isLoading ? { loading: true } : {})}
      >
        Refresh Orders
      </s-button>

      {!data.success && data.error && (
        <s-section>
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="critical"
          >
            <s-paragraph>
              <strong>Error:</strong> {data.message || data.error}
            </s-paragraph>
          </s-box>
        </s-section>
      )}

      <s-section heading="Recent Orders">
        {data.orders.length === 0 ? (
          <s-box
            padding="large"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="base" alignItems="center">
              <s-heading>No orders found</s-heading>
              <s-paragraph>
                Orders from the Quintessence Jewelry API will appear here.
              </s-paragraph>
              <s-button onClick={handleRefresh}>Refresh</s-button>
            </s-stack>
          </s-box>
        ) : (
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Showing {data.orders.length} order{data.orders.length !== 1 ? "s" : ""}
            </s-paragraph>

            {data.orders.map((order: DropshipOrder) => (
              <s-box
                key={order.orderId}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="surface"
              >
                <s-stack direction="block" gap="base">
                  {/* Order Header */}
                  <s-stack direction="inline" gap="base" alignItems="center">
                    <div style={{ flex: 1 }}>
                      <s-heading level={3}>Order #{order.orderId}</s-heading>
                      <s-paragraph>
                        <s-text variant="subdued">
                          {formatDate(order.orderDate)}
                        </s-text>
                      </s-paragraph>
                    </div>
                    <s-badge tone={getStatusBadgeTone(order.status)}>
                      {order.status}
                    </s-badge>
                    <s-button
                      variant="tertiary"
                      onClick={() => toggleOrderDetails(order.orderId)}
                    >
                      {expandedOrder === order.orderId
                        ? "Hide Details"
                        : "View Details"}
                    </s-button>
                  </s-stack>

                  {/* Order Summary */}
                  <s-stack direction="inline" gap="large">
                    <div>
                      <s-text variant="subdued">Customer</s-text>
                      <s-paragraph>{order.customerName}</s-paragraph>
                    </div>
                    <div>
                      <s-text variant="subdued">Email</s-text>
                      <s-paragraph>{order.customerEmail}</s-paragraph>
                    </div>
                    <div>
                      <s-text variant="subdued">Total</s-text>
                      <s-paragraph>${order.total}</s-paragraph>
                    </div>
                    {order.trackingNumber && (
                      <div>
                        <s-text variant="subdued">Tracking #</s-text>
                        <s-paragraph>{order.trackingNumber}</s-paragraph>
                      </div>
                    )}
                    {order.shippedOn && (
                      <div>
                        <s-text variant="subdued">Shipped Date</s-text>
                        <s-paragraph>{formatDate(order.shippedOn)}</s-paragraph>
                      </div>
                    )}
                    {order.shippedVia && (
                      <div>
                        <s-text variant="subdued">Shipping Method</s-text>
                        <s-paragraph>{order.shippedVia}</s-paragraph>
                      </div>
                    )}
                  </s-stack>

                  {/* Expanded Details */}
                  {expandedOrder === order.orderId && (
                    <s-box
                      padding="base"
                      borderWidth="base"
                      borderRadius="base"
                      background="subdued"
                    >
                      <s-stack direction="block" gap="base">
                        {/* Shipping Address */}
                        <div>
                          <s-heading level={4}>Shipping Address</s-heading>
                          <s-paragraph>{order.shippingAddress}</s-paragraph>
                        </div>

                        {/* Order Items */}
                        {order.items && order.items.length > 0 && (
                          <div>
                            <s-heading level={4}>Items</s-heading>
                            <s-stack direction="block" gap="small">
                              {order.items.map((item, index) => (
                                <s-box
                                  key={index}
                                  padding="small"
                                  borderWidth="base"
                                  borderRadius="base"
                                  background="surface"
                                >
                                  <s-stack direction="inline" gap="base">
                                    <div style={{ flex: 1 }}>
                                      <s-paragraph>
                                        <strong>{item.name}</strong>
                                      </s-paragraph>
                                      <s-text variant="subdued">
                                        SKU: {item.sku}
                                      </s-text>
                                    </div>
                                    <div>
                                      <s-text>Qty: {item.quantity}</s-text>
                                    </div>
                                    <div>
                                      <s-text>${item.price}</s-text>
                                    </div>
                                  </s-stack>
                                </s-box>
                              ))}
                            </s-stack>
                          </div>
                        )}
                      </s-stack>
                    </s-box>
                  )}
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="About Orders">
        <s-paragraph>
          This page displays orders fetched from the Quintessence Jewelry API.
        </s-paragraph>
        <s-paragraph>
          Click "View Details" on any order to see the shipping address and items.
        </s-paragraph>
        <s-paragraph>
          Use the "Refresh Orders" button to fetch the latest orders from the API.
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Order Status">
        <s-unordered-list>
          <s-list-item>
            <s-badge tone="success">order shipped</s-badge> - Order has been shipped with tracking
          </s-list-item>
          <s-list-item>
            <s-badge tone="warning">pending</s-badge> - Order is being processed
          </s-list-item>
          <s-list-item>
            <s-badge tone="critical">cancelled</s-badge> - Order was cancelled
          </s-list-item>
        </s-unordered-list>
        <s-paragraph>
          Shipped orders display tracking number, shipped date, and shipping method.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
