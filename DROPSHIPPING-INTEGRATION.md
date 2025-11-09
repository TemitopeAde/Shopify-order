# Shopify Dropshipping Integration

This Shopify app automatically forwards orders to the Quintessence Jewelry dropshipping API when a new order is placed on your Shopify store.

## Features

- **Automatic Order Forwarding**: When a customer places an order on your Shopify store, the order is automatically sent to the dropshipping API
- **Complete Data Mapping**: Shopify order data (items, shipping address, billing address) is automatically mapped to the dropshipping API format
- **Error Handling**: Comprehensive error handling and logging for troubleshooting
- **Type Safety**: Built with TypeScript for better code reliability

## Architecture

### Components

1. **Webhook Handler** (`app/routes/webhooks.orders.create.tsx`)
   - Receives Shopify order creation events
   - Processes order data
   - Calls the dropshipping service

2. **Dropshipping Service** (`app/lib/services/dropshippingService.ts`)
   - Handles API communication with the dropshipping provider
   - Formats requests according to API specifications
   - Manages authentication and error handling

3. **Order Mapper** (`app/lib/services/orderMapper.ts`)
   - Converts Shopify order format to dropshipping API format
   - Maps addresses, line items, and customer information
   - Generates purchase order numbers

4. **Type Definitions** (`app/lib/types/dropshipping.ts`)
   - TypeScript interfaces for type safety
   - Defines data structures for both Shopify and dropshipping API

## Setup

### 1. Install Dependencies

The required dependencies are already included in package.json:
- `axios` - HTTP client for API requests
- `qs` - Query string encoding
- `@types/qs` - TypeScript types for qs

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and add your dropshipping API credentials:

```env
DROPSHIP_API_USERNAME=your_api_username
DROPSHIP_API_PASSWORD=your_api_password
```

### 3. Deploy the App

Deploy your Shopify app:

```bash
npm run deploy
```

### 4. Update App Scopes

The app requires the `read_orders` scope to receive order webhooks. This is already configured in `shopify.app.toml`. When you deploy the app or update it, users will be prompted to accept the new permissions.

### 5. Webhook Registration

The `orders/create` webhook is automatically registered when you deploy the app. It's configured in `shopify.app.toml`:

```toml
[[webhooks.subscriptions]]
topics = [ "orders/create" ]
uri = "/webhooks/orders/create"
```

## How It Works

### Order Flow

1. **Customer Places Order**: A customer completes a purchase on your Shopify store
2. **Shopify Triggers Webhook**: Shopify sends an `orders/create` webhook to your app
3. **Webhook Handler Processes Order**: The webhook handler in `app/routes/webhooks.orders.create.tsx` receives the order
4. **Data Mapping**: Order data is mapped from Shopify format to dropshipping API format
5. **API Request**: The order is submitted to the dropshipping API
6. **Response Handling**: Success/failure is logged for monitoring

### Data Mapping

#### Product Information
- **SKU**: Mapped from line item SKU
- **Size**: Mapped from variant title (e.g., "size 7.00")
- **Quantity**: Order quantity

#### Shipping Address
Shopify address fields are mapped to the dropshipping API format:
- `shipping_address.first_name` → `s_first_name`
- `shipping_address.last_name` → `s_last_name`
- `shipping_address.address1` → `s_address_1`
- etc.

#### Billing Address
Similar mapping for billing address fields (prefixed with `b_`)

#### Order Metadata
- **Customer PO**: Generated as `PO-SHOPIFY-{order_number}`
- **Email**: Customer email from order
- **Logistics**: Default "FedEx Ground" (customizable)

## API Endpoint Details

**Endpoint**: `https://www.quintessencejewelry.com/qjcapis/makebulkOrders.xml`

**Method**: POST

**Content-Type**: `application/x-www-form-urlencoded`

**Accept**: `application/xml`

### Required Parameters

- `uname`: API username (from environment variables)
- `pass`: API password (from environment variables)
- `productBucket[N][sku]`: Product SKU
- `productBucket[N][size]`: Product size
- `productBucket[N][qty]`: Quantity
- `email`: Customer email
- `customer_po`: Purchase order number
- `Logistic`: Shipping method
- Shipping address fields (prefixed with `s_`)
- Billing address fields (prefixed with `b_`)

## Monitoring and Debugging

### Logs

The app logs important events:

```javascript
// Order received
console.log(`Received orders/create webhook for shop: ${shop}`);

// Order submitted successfully
console.log(`✓ Order #${orderData.order_number} successfully submitted`);

// Submission failed
console.error(`✗ Failed to submit order #${orderData.order_number}`);
```

### Testing the Integration

You can test the dropshipping service connection:

```typescript
import { dropshippingService } from './app/lib/services/dropshippingService';

const isConnected = await dropshippingService.testConnection();
console.log('API Connection:', isConnected ? 'OK' : 'Failed');
```

## Error Handling

### Webhook Errors

If the webhook handler encounters an error:
- Returns HTTP 500 to Shopify
- Shopify will retry the webhook automatically
- Error is logged for investigation

### Dropshipping API Errors

If the dropshipping API fails:
- Error is logged with details
- Webhook still returns HTTP 200 to prevent Shopify retries
- Consider implementing:
  - Database storage for failed orders
  - Admin notifications
  - Manual retry mechanism

## Customization

### Shipping Method

Edit `app/lib/services/orderMapper.ts` to customize the logistics method:

```typescript
static getLogisticMethod(orderData: ShopifyOrderData): string {
  // Customize based on shipping_lines in order
  // Example: map Shopify shipping to dropshipping carriers
  return 'FedEx Ground';
}
```

### Email Handling

By default, shipping and billing emails use placeholder addresses. Customize in `orderMapper.ts`:

```typescript
s_email: address.first_name ? `${address.first_name.toLowerCase()}@customer.com` : '',
```

### SKU Filtering

If you only want to dropship certain products, add filtering logic in the webhook handler:

```typescript
// Only process orders with dropship SKUs
const dropshipItems = orderData.line_items.filter(item =>
  item.sku?.startsWith('QR')
);

if (dropshipItems.length === 0) {
  console.log('No dropship items in order');
  return new Response('OK', { status: 200 });
}
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with real credentials
2. **Webhook Verification**: Shopify webhook authentication is handled by the Shopify app framework
3. **API Credentials**: Store credentials securely in environment variables
4. **HTTPS**: Always use HTTPS for your app URL

## Troubleshooting

### Webhook Not Triggering

1. Check webhook registration:
   ```bash
   shopify app webhooks list
   ```

2. Verify scopes include `read_orders`

3. Check app logs for errors

### Orders Not Forwarding

1. Verify environment variables are set correctly
2. Check dropshipping API credentials
3. Review app logs for error messages
4. Test API connection using `testConnection()` method

### Invalid SKU or Size

- Ensure Shopify products have SKU field populated
- Check variant titles match expected size format
- Review mapping logic in `orderMapper.ts`

## Support

For issues with:
- **Shopify Integration**: Check Shopify app logs and webhook delivery status
- **Dropshipping API**: Contact Quintessence Jewelry support with API credentials
- **App Functionality**: Review logs and error messages

## Files Modified/Created

### Created Files
- `app/lib/types/dropshipping.ts` - Type definitions
- `app/lib/services/dropshippingService.ts` - API service
- `app/lib/services/orderMapper.ts` - Data mapping
- `app/routes/webhooks.orders.create.tsx` - Webhook handler
- `.env.example` - Environment variables template
- `DROPSHIPPING-INTEGRATION.md` - This documentation

### Modified Files
- `shopify.app.toml` - Added orders/create webhook and read_orders scope
- `package.json` - Added axios and qs dependencies
