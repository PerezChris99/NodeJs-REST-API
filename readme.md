Node.js Product API - Readme
----------------------------

This is a Node.js API for displaying product information. Currently, it focuses on phone products, but it can be easily extended to handle other categories.

### Features

*   **List Products:** Retrieve a list of all available products.
    
*   **Product Details:** Get detailed information about a specific product by its ID.
    

### Technologies

*   Node.js: JavaScript runtime environment used to build the API.
    
*   Express.js: Web framework for building APIs in Node.js.
    

### Installation

1.  Bashgit clone https://github.com/PerezChris99/NodeJs-REST-API Use code [with caution.](/faq#coding)content\_copy
    
2.  Bashcd product-apinpm install Use code [with caution.](/faq#coding)content\_copy
    

### Usage

1.  Bashnpm start Use code [with caution.](/faq#coding)content\_copy
    
2.  The API will be running on the default port (usually 3000). You can interact with it using tools like Postman or by sending HTTP requests directly.
    

### Endpoints

*   **GET /products** - Returns a list of all products in JSON format.
    
*   **GET /products/:id** - Returns details of a specific product with the given ID in JSON format.
    

**Example Usage (using Postman):**

1.  **GET Products:**
    
    *   Set the request method to GET.
        
    *   Set the URL to http://localhost:5000/products.
        
    *   Send the request. The response will be a JSON array containing all products.
        
2.  **GET Product Details:**
    
    *   Set the request method to GET.
        
    *   Set the URL to http://localhost:3000/products/1 (replace 1 with the actual product ID).
        
    *   Send the request. The response will be a JSON object containing details of the specified product.
        

### Contribution

We welcome contributions to this project! Please feel free to fork the repository and submit pull requests with your improvements.

### License

This project is licensed under the MIT License. See the LICENSE file for more details.