# Assignment Sonali Bandi Network Structures and Cloud computing




## Goal
<span style="background-color: #FFFF00">The main goal of this assignment is to build a APIs for an User to register and retreive his details using Node.js</span>

<span style="background-color: #88FF00">Added Product Table and created Endpoints for that </span>

## Features
* As a developer, I am able to create new account by providing the following fields as an input
sassdas

    * Email Address
    * Password
    * First Name
    * Last Name
* As a developer, I am able to get a particular user after the user has entered his credentials by      implementing basic auth
* As a developer, I am able to edit a particular user after the user has entered his credentials by     


## Requirements


* Node.js
  * express.js
* Sequelize
* Base-64
* Bcrypt js
* Jest
* Supertest
* Postman- Recommended for Testing
* Morgan

## Implementation
  

  ### APIs

  Available APIs in the project:
  This is built using REST API and appropriate conventions
  Unauthenticated Endpoints
  #### Create a User
  This endpoint allows creating a new user account. It's a POST request that should be sent to /v1/user.

  #### Health Check
  This endpoint is used to check the health of the server. It's a GET request that should be sent to /healthz.

  #### Get Product
  This endpoint allows retrieving information about a product. It's a GET request that should be sent to /v1/product/:id, where :id is the product ID.

  #### Authenticated Endpoints
    Update User
    This endpoint allows updating information for an existing user account. It's a PUT request that should be sent to /v1/user/:id, where :id is the user ID.

  #### Create a Product
    This endpoint allows creating a new product. It's a POST request that should be sent to /v1/product.

    
  #### Update a Product
  This endpoint allows updating information for an existing product. It can be done using either a PATCH or PUT request, sent to /v1/product/:id, where :id is the product ID.

  #### Delete Product
  This endpoint allows deleting an existing product. It's a DELETE request that should be sent to /v1/product/:id, where :id is the product ID.
  ### How to use

    Run: Node listener.js
    Test:  npm run test 


  *Non Authenticated Endpoints*:
   ```sh
    
 
  * Create a user *:
   
    POST /v1/user


  * Health Check *:
   
    GET /healthz

  * Get Product *:

    /v1/product/:id
    
  ```
  *Authenticated Endpoints*


```sh
    
  * Update User *
    
      PUT   /v1/user/:id

  * Create a Product *:
   
      POST /v1/product

  * Update a Product*:
   
      PATCH /v1/product/:id
      PUT   /v1/product/:id
  
  * Delete Product *:

      DELETE /v1/product/:id
    
  ```


  ## Added workflow changes

  * Creates an `AMI` when merging the PR into the main repo with shell scrip as the provisioners.
  

   ## Added Image Create Read and Delete operations:
   
     * image_id	
     * product_id	
     * file_name	
     * date_created	
     * s3_bucket_path	
 



    
------
    
