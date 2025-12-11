# Node.js Product REST API

A lightweight RESTful API built with vanilla Node.js for managing product information. This API provides full CRUD (Create, Read, Update, Delete) operations for products without any external frameworks.

## Features

- **List Products** - Retrieve all available products
- **Get Product** - Fetch detailed information about a specific product by ID
- **Create Product** - Add new products to the database
- **Update Product** - Modify existing product information
- **Delete Product** - Remove products from the database

## Technologies

- **Node.js** - JavaScript runtime environment (no Express.js - pure Node.js HTTP module)
- **UUID** - For generating unique product identifiers
- **JSON File Storage** - Simple file-based data persistence

## Project Structure

```
NodeJs-REST-API/
├── server.js              # Main entry point - HTTP server and routing
├── controllers/
│   └── productController.js   # Request handlers for product operations
├── models/
│   └── productModel.js        # Data access layer for products
├── data/
│   └── products.json          # JSON file storing product data
├── utils.js               # Utility functions (file writing, request parsing)
├── package.json           # Project dependencies and scripts
└── readme.md              # Documentation
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PerezChris99/NodeJs-REST-API.git
   ```

2. Navigate to the project directory:
   ```bash
   cd NodeJs-REST-API
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Start the Server

**Production mode:**
```bash
npm start
```

**Development mode (with auto-reload):**
```bash
npm run dev
```

The API will be running at `http://localhost:5000` (or the port specified in the `PORT` environment variable).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get a single product by ID |
| POST | `/api/products` | Create a new product |
| PUT | `/api/products/:id` | Update an existing product |
| DELETE | `/api/products/:id` | Delete a product |

## API Examples

### Get All Products
```bash
curl http://localhost:5000/api/products
```

### Get Single Product
```bash
curl http://localhost:5000/api/products/1
```

### Create Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"title": "New Product", "description": "Product description", "price": 99.99}'
```

### Update Product
```bash
curl -X PUT http://localhost:5000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Product", "price": 149.99}'
```

### Delete Product
```bash
curl -X DELETE http://localhost:5000/api/products/1
```

## Response Format

### Success Response
```json
{
  "id": "1",
  "title": "Product Name",
  "description": "Product description",
  "price": 99.99
}
```

### Error Response
```json
{
  "message": "Product Not Found"
}
```

## Product Schema

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (auto-generated UUID) |
| title | string | Product name |
| description | string | Product description |
| price | number | Product price |

## Contributing

We welcome contributions to this project! Please feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.