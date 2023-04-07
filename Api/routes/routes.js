const express = require("express");
const {healthCheck,post,get,update} =require( '../controllers/userdb-controller.js');
const {prodPost,prodGet,prodPatch,prodDelete1,prodPut,imageUpload,deleteImage,getImage,getImagesByProductId}=require('../controllers/product-controller.js')

const router = express.Router(); // get router object

// route for 'get' (fetch all todo's) and 'post' requests on endpoint '/todo-items' 
router.route('/v1/user/:id')
      .get(get)
      .put(update)

//route for 'get', 'put' and 'delete' for single instance of todo item based on request parameter 'id'
router.route('/v1/user')
      .post(post)

router.route('/healthz')
      .get(healthCheck)

router.route('/v1/product')
      .post(prodPost)
router.route('/v1/product/:id')
      .get(prodGet)
      .patch(prodPatch)
      .delete(prodDelete1)
      .put(prodPut)
router.route('/v1/product/:prodId/image')
      .post(imageUpload)
      .get(getImagesByProductId)
router.route('/v1/product/:prodId/image/:imageId')
      .delete(deleteImage)
      .get(getImage)
      
      
module.exports=router