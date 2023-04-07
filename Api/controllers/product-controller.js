const base64 = require("base-64")
const bcrypt = require("bcryptjs"); 
const AWS = require("aws-sdk")
const multer = require("multer")
const { v4: uuidv4 } = require('uuid');
const StatsD = require('hot-shots');
const statsd = new StatsD({ host: 'localhost', port: 8125 });
const {User,Product,Image} = require( '../models/model.js');

function productPostValidation(name,description,sku,manufacturer,quantity){
    if(!name || !description || !sku || !manufacturer || !quantity || quantity<=0 || typeof quantity === 'string'|| quantity>100) return false;
    else return true;
    
}

const prodPost = async (request,response)=>{
    const {name,description,sku,manufacturer,quantity,date_added,date_last_updated,owner_user_id } = request.body;

    if (productPostValidation(name,description,sku,manufacturer,quantity)===false){
      statsd.increment('prodpostinvaliddataerror.calls')
        response.status(400).send({
            message:" product cannot have empty description or less than zero quantity",})
    }
    else if(date_added || date_last_updated || owner_user_id){ response.status(400).send({
        message:" invalid parameters date added or date updated or owner_user_id",}) }
    else{
    if(!request.headers.authorization){
      statsd.increment('prodpostinvaliddataerror.calls')
        response.status(400).send({
            message:"No Auth",
        });
    }
    else{
        const encodedToken = request.headers.authorization.split(" ")[1];
    
       const baseToAlpha = base64.decode(encodedToken).split(":");
       let username = baseToAlpha[0];
       let decodedPassword = baseToAlpha[1];

       User.findOne({
        where:{
            username,
        },
     })
        .then(async(user)=>{
            if(!user){
              statsd.increment('prodpostinvaliddataerror.calls')
                response.status(400).send({
                    message: "Invalid User",})
            } else{
                const valid= await bcrypt.compare(decodedPassword,user.getDataValue("password"))
                if (valid===true){
                 const skuCheck = await Product.findAll({
                    where: {
                      sku: sku
                    }
                
                  });
                if (skuCheck.length!==0){
                  statsd.increment('prodpostinvaliddataerror.calls')
                    response.status(400).send({
                    message: "SKU exists",})}
                else{
                 Product.create({
                        
                            name:name,
                            description:description,
                            sku:sku,
                            manufacturer:manufacturer,
                            quantity:quantity,
                            date_added: new Date(),
                            date_last_edited: new Date(),
                            owner_user_id: user.getDataValue("id")


                        
                    })
                    .then((feedback)=>{
                      statsd.increment('prodpostsuccess.calls')
                            response.status(201).send({
                                
                                name: feedback.getDataValue("name"),
                                description: feedback.getDataValue("description"),
                                sku: feedback.getDataValue("sku"),
                                manufacturer: feedback.getDataValue("manufacturer"),
                                quantity: feedback.getDataValue("quantity"),
                                date_added:feedback.getDataValue("createdAt"),
                                date_last_edited:feedback.getDataValue("updatedAt"),
                                owner_user_id: feedback.getDataValue("owner_user_id")
                              });
                        
                        
                    })
                    .catch(() => {
                      statsd.increment('prodpostinvaliddataerror.calls')
                        response.status(400).send({
                          message: "Bad Request",
                        });
                      });
                }}
                else{
                  statsd.increment('prodpostautherror.calls')
                    response.status(401).send({
                        message: "Incorrect password",})
                }
                
            }
        })
                    }
}
}

const prodGet = async(request,response)=>{ 
    const id = Number(request.params.id)
    if(!id || typeof id === "string"){
      statsd.increment('prodgettinvaliddataerror.calls')
        response.status(400).send({message:"invalid Id"})
    }
    else
    {
        Product.findOne(
            {
                where:{
                    id:id,
                },
            }
        )
        .then((prod)=> {
            if(prod){
              statsd.increment('prodgetsuccess.calls')
                response.status(200).send({
                  
                        id: prod.getDataValue("id"),
                        name: prod.getDataValue("name"),
                        description: prod.getDataValue("description"),
                        sku: prod.getDataValue("sku"),
                        manufacturer: prod.getDataValue("manufacturer"),
                        quantity: prod.getDataValue("quantity"),
                        date_added: prod.getDataValue("date_added"),
                        date_last_updated: prod.getDataValue("date_last_updated"),
                        owner_user_id: prod.getDataValue("owner_user_id")
                      
                })
            }
            else
            { statsd.increment('progetdoesnotexist.calls')
                response.status(404).send({
                    message:"Id does not exist"
                })
            }
        })
        .catch(()=>{
          statsd.increment('prodgettinvaliddataerror.calls')
            response.status(400).send({
                message:"invalid "
            })
        })
    }

}
const prodPatch = async(request,response)=>{
    const id = Number(request.params.id);
    console.log(id)
   if (!request.headers.authorization){
     response.status(400).send({
       message:"No Auth",
   });
   }

   else if(!id || typeof id === "string"){
    response.status(400).send({message:"invalid Id"})
   }

   else{
        const encodedToken = request.headers.authorization.split(" ")[1];
        const {name,description,sku,manufacturer,quantity,date_added,date_last_updated,owner_user_id} = request.body;
        const baseToAlpha = base64.decode(encodedToken).split(":");
        let decodedUsername = baseToAlpha[0];
        let decodedPassword = baseToAlpha[1];
        if (date_added || date_last_updated || owner_user_id){
            response.status(400).send({
                message: "Invalid entry date updated || date added",
              })
        }
       else if(name===""|| description === "" || sku === "" || manufacturer === "" || quantity === "" || typeof quantity === 'string'|| quantity<0 || quantity>100){
            response.status(400).send({
                message: "Invalid entry",
              })
        }
        else{
        User.findOne({
            where: {
              username: decodedUsername,
            },
          })
        .then(
            async (user)=>{
            const valid = await bcrypt.compare(decodedPassword,user.getDataValue("password")) 
           if(valid===true && decodedUsername === user.getDataValue("username")){
            Product.findOne({
                where:{
                    id:id,
                },
            })
            .then(
                async (product)=>{
                    if (!product){
                        response.status(404).send({
                            message: "Product Not available",
                          })
                    }
                    else if (product.getDataValue("owner_user_id")!== user.getDataValue("id")){
                        response.status(403).send({
                            message: "Forbidden access",
                          })}
                    else{
                    if(product.getDataValue("owner_user_id")===user.getDataValue("id")){
                            product.update(
                                {
                                   name:name,
                                   description:description,
                                   sku:sku,
                                   manufacturer:manufacturer,
                                   quantity:quantity,
                                   date_last_updated: new Date()
                                }
                            )
                            .then((result) => {
                                response.status(204).send({
                                    });
                              })
                            .catch(() => {
                                response.status(400).send({
                                  message: "Bad Request. Incorrect inputs for Update",
                                });
                              })
                    }else{response.status(400).send({
                        message: "Invalid product Id",
                      });}
                }
            }
            )

            } else{response.status(401).send({
                message: "Invalid Password",
              });

            }}
        )
        .catch(() => {
            response.status(401).send({
              message: "Bad Request. Incorrect password",
            })});
   }}
    
}
// const prodDelete= async(request,response)=>
// {
//     const id = Number(request.params.id);
//     console.log(id)
//    if (!request.headers.authorization){
//      response.status(400).send({
//        message:"No Auth",
//    });
//    }

//    else if(!id || typeof id === "string"){
//     response.status(400).send({message:"invalid Id"})
//    }

//    else{
//         const encodedToken = request.headers.authorization.split(" ")[1];
//         const baseToAlpha = base64.decode(encodedToken).split(":");
//         let decodedUsername = baseToAlpha[0];
//         let decodedPassword = baseToAlpha[1];
//         User.findOne({
//             where: {
//               username: decodedUsername,
//             },
//           })
//           .then(async (user)=>{
//             const valid = await bcrypt.compare(decodedPassword,user.getDataValue("password")) 
//            if(valid===true && decodedUsername === user.getDataValue("username")){
//             Product.findOne({
//                 where:{
//                     id:id,
//                 },
//             })
//             .then(async (product)=>{
//                 if (product.getDataValue("owner_user_id")!== user.getDataValue("id")){
//                     response.status(403).send({
//                         message: "Unauthorized access",
//                       })}
//                 else{
//                     Product.destroy({
//                         where:{
//                         id:id,
//                     },
//                 })
//                 .then((val)=>{
//                     if(val){
//                         response.status(204).send({})
//                     }
//                 })
//                 }
                


//             })
//             .catch((val)=>{
//                 console.log(val)
//                 response.status(404).send({
//                     message: "Product Not available",
//                   })
//             })
//         }
//         else{
//             response.status(401).send({
//                 message: "Wrong credentials",
//               })   
//         }
//     })
//     .catch(()=>{
//         response.status(400).send({
//             message: "Bad Request",
//           })
//     })

// }

// }


const prodPut = async(request,response)=>{
    const id = Number(request.params.id);
    console.log(id)
   if (!request.headers.authorization){
     response.status(400).send({
       message:"No Auth",
   });
   }

   else if(!id || typeof id === "string"){
    response.status(400).send({message:"invalid Id"})
   }

   else{
        const encodedToken = request.headers.authorization.split(" ")[1];
        const {name,description,sku,manufacturer,quantity,date_added,date_last_updated,owner_user_id} = request.body;
        const baseToAlpha = base64.decode(encodedToken).split(":");
        let decodedUsername = baseToAlpha[0];
        let decodedPassword = baseToAlpha[1];
        if (date_added || date_last_updated || owner_user_id){
            response.status(400).send({
                message: "Invalid entry date updated || date added || owner_user_id",
              })
        }
       else if ( !productPostValidation(name,description,sku,manufacturer,quantity)){
            response.status(400).send({
                message: "Please add all details ",
              });}

       else if(name===""|| description === "" || sku === "" || manufacturer === "" || quantity === "" || typeof quantity === 'string' || quantity <=0 || quantity>100 ){
            response.status(400).send({
                message: "Invalid entry",
              })
        }
        else{
        User.findOne({
            where: {
              username: decodedUsername,
            },
          })
        .then(
            async (user)=>{
            const valid = await bcrypt.compare(decodedPassword,user.getDataValue("password")) 
           if(valid===true && decodedUsername === user.getDataValue("username")){
            Product.findOne({
                where:{
                    id:id,
                },
            })
            .then(
                async (product)=>{
                    if (!product){
                        response.status(404).send({
                            message: "Product Not available",
                          })
                    }
                    else if (product.getDataValue("owner_user_id")!== user.getDataValue("id")){
                        response.status(403).send({
                            message: "Unauthorized access",
                          })}
                    else{
                    if(product.getDataValue("owner_user_id")===user.getDataValue("id")){
                            product.update(
                                {
                                   name:name,
                                   description:description,
                                   sku:sku,
                                   manufacturer:manufacturer,
                                   quantity:quantity,
                                   date_last_updated: new Date()
                                }
                            )
                            .then((result) => {
                                response.status(204).send({
                                    });
                              })
                            .catch(() => {
                                response.status(400).send({
                                  message: "Bad Request. Incorrect inputs for Update",
                                });
                              })
                    }else{response.status(400).send({
                        message: "Invalid product Id",
                      });}
                }
            }
            )
            .catch(() => {
                response.status(401).send({
                  message: "Bad Request. Incorrect password",
                })});

            } else{response.status(401).send({
                message: "Invalid Password",
              });

            }}
        )
        .catch(() => {
            response.status(401).send({
              message: "Bad Request. Incorrect password",
            })});
   }}
    
}
const s3 = new AWS.S3({
  // accessKeyId: 'AKIA3EFUIO4NLYYK34NL',
  // secretAccessKey: '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'
  region:process.env.AWS_REGION
});

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, '');
  },
});

const upload = multer({ storage }).single('image');

const imageUpload = (req, res) => {
  const id = Number(req.params.prodId);
  if (!req.headers.authorization) {
    statsd.increment('prodimgfail.calls')
    res.status(400).send({
      message: 'No Auth',
    });
  } else if (!id || typeof id === 'string') {
    // handle invalid id
  } else {
    const encodedToken = req.headers.authorization.split(' ')[1];
    const baseToAlpha = base64.decode(encodedToken).split(':');
    let decodedUsername = baseToAlpha[0];
    let decodedPassword = baseToAlpha[1];
    
    Product.findOne({
      where: {
        id: id,
      },
    }).then(async (product) => {
      User.findOne({
        where: {
          id: product.getDataValue('owner_user_id'),
        },
      }).then(async (user) => {
        const valid = await bcrypt.compare(
          decodedPassword,
          user.getDataValue('password')
        );
        const existinguser = await User.findOne({ where: {
          username: decodedUsername,
        },

        });
        if (valid && user.getDataValue('username') === decodedUsername) {
          upload(req, res, function (err) {
            if (err) {
              return res.status(400).json({ message: err.message });
            }

            // Image was successfully uploaded to memory buffer
            const imageData = req.file.buffer;
            const imageName = `${uuidv4()}-${req.file.originalname}`;
            const fileTypes = /jpeg|jpg|png/;
            if(!fileTypes.test(imageName.toLowerCase()))
            {return res.status(401).json({ message: 'Invalid input' });}
            const bucketName = process.env.AWS_BUCKET_NAME;
            
            // Upload the image to S3
            const params = {
              Bucket: bucketName,
              Key: imageName,
              Body: imageData,
              ContentType: req.file.mimetype,
            };
            s3.upload(params, (err, data) => {
              if (err) {
                return res.status(400).json({ message: err.message });
              }

              // Image was successfully uploaded to S3
              const imageUrl = data.Location;
              
              // Get the metadata for the uploaded image
              const params = {
                Bucket: bucketName,
                Key: imageName,
              };
              s3.headObject(params, function (err, metadata) {
                
                if (err) {
                  return res.status(400).json({ message: err.message });
                }
                Image.create({
                        
                  product_id: id,
                  file_name:imageName,
                  s3_bucket_path:imageUrl,
                  createdAt: new Date(),


              
          })
          .then((feedback)=>{
            statsd.increment('prodimgsuccess.calls')
                  res.status(201).send({
                      
                      product_id: feedback.getDataValue("product_id"),
                      file_name: feedback.getDataValue("file_name"),
                      s3_bucket_path: feedback.getDataValue("s3_bucket_path"),
                      
                      date_added:feedback.getDataValue("createdAt"),
                      
                    });
              
              
          })
                

                // Return metadata along with the image URL

                
              });
            });
          });
        }
        
        else if(existinguser){
          
          res.status(403).send({
            message: 'forbidden',
          });
        }
        else{
          res.status(401).send({
            message: 'Bad Request. Incorrect id',
          });
        }
        
        
      })
      .catch((err)=> {
        res.status(401).send({
          message: err,
        });
      });
       
    }).catch((err) => {
      res.status(401).send({
        message: err,
      });
    });
  }
};

const deleteImage = (req, res) => {
  const id = Number(req.params.imageId);
  const productID = Number(req.params.prodId);
  if (!req.headers.authorization) {
    res.status(400).send({
      message: 'No Auth',
    });
  } else if (!id || typeof id === 'string') {
    res.status(400).send({
      message: 'Bad Request. Incorrect id1',
    });
  } else {
    const encodedToken = req.headers.authorization.split(' ')[1];
    const baseToAlpha = base64.decode(encodedToken).split(':');
    let decodedUsername = baseToAlpha[0];
    let decodedPassword = baseToAlpha[1];

    Image.findOne({
      where: {
        id: id,
      },
    })
      .then(async (image) => {
        Product.findOne({
          where: {
            id: image.getDataValue('product_id'),
          },
        })
          .then(async (product) => {
            User.findOne({
              where: {
                id: product.getDataValue('owner_user_id'),
              },
            })
            .then(async (user)=>{
              if(product.getDataValue('id')!==productID){
                return res.status(400).json({ message: 'Bad Request. Incorrect product id' })
              }
            if (!product) {
              console.log(product)
              return res.status(400).json({ message: 'Bad Request. Incorrect product id' });
            } else {
              const valid = await bcrypt.compare(decodedPassword, user.getDataValue('password') );
              if (valid === true && decodedUsername === user.getDataValue('username')) {
                const bucketName = process.env.AWS_BUCKET_NAME;
                const params = {
                  Bucket: bucketName,
                  Key: image.getDataValue('file_name'),
                };
                s3.deleteObject(params, function (err, data) {
                  if (err) {
                    return res.status(400).json({ message: err.message });
                  }
                  Image.destroy({
                    where: {
                      id: id,
                    },
                  })
                    .then(() => {
                      statsd.increment('prodimgdelete.calls')
                      return res.status(200).json({ message: 'Image deleted successfully' });
                    })
                    .catch(() => {
                      return res.status(500).json({ message: 'Internal S3 Error' });
                    });
                });
              } else {
                return res.status(403).json({ message: 'Forbidden' });
              }
            }
          })
          })
          .catch(() => {
            return res.status(400).json({ message: 'Bad Request. Incorrect product id' });
          });
      })
      .catch(() => {
        return res.status(404).json({ message: 'Bad Request. Incorrect image id' });
      });
  }
};

const getImage = (req, res) => {
  const id = Number(req.params.imageId);
  const productID = Number(req.params.prodId)
  if (!req.headers.authorization) {
    res.status(400).send({
      message: 'No Auth',
    });
  } else if (!id || typeof id === 'string') {
    res.status(400).send({
      message: 'Bad Request. Incorrect id',
    });
  } else {
    const encodedToken = req.headers.authorization.split(' ')[1];
    const baseToAlpha = base64.decode(encodedToken).split(':');
    let decodedUsername = baseToAlpha[0];
    let decodedPassword = baseToAlpha[1];

    Image.findOne({
      where: {
        id: id,
      },
    })
      .then(async (image) => {
        Product.findOne({
          where: {
            id: image.getDataValue('product_id'),
          },
        })
          .then(async (product) => {
            if(product.getDataValue('id')!==productID){
              return res.status(400).json({ message: 'Bad Request. Incorrect product id' })
            }
            User.findOne({
              where: {
                id: product.getDataValue('owner_user_id'),
              },
            })
            .then(async (user)=>{
            if (!product) {
              console.log(product)
              return res.status(400).json({ message: 'Bad Request. Incorrect product id' });
            } else {
              const valid = await bcrypt.compare(decodedPassword, user.getDataValue('password') );
              if (valid === true && decodedUsername === user.getDataValue('username')) {
                return res.status(200).json({
                  id: image.getDataValue('id'),
                  product_id: image.getDataValue('product_id'),
                  file_name: image.getDataValue('file_name'),
                  created_at: image.getDataValue('createdAt'),
                  updated_at: image.getDataValue('updatedAt'),
                });
              } else {
                return res.status(403).json({ message: 'Forbidden' });
              }
            }
          })
          })
          .catch(() => {
            return res.status(400).json({ message: 'Bad Request. Incorrect product id' });
          });
      })
      .catch(() => {
        return res.status(400).json({ message: 'Bad Request. Incorrect image id' });
      });
  }
};


const getImagesByProductId = (req, res) => {
  const productId = Number(req.params.prodId);

  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = req.headers.authorization.split(' ')[1];
  const [username, password] = Buffer.from(token, 'base64').toString().split(':');

  User.findOne({ where: { username } })
    .then(async (user) => {
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      Product.findByPk(productId).then((product) => {
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
        else if(product.getDataValue('owner_user_id')!==user.getDataValue('id')){
          return res.status(403).json({ message: 'Forbidden' });
        }

        Image.findAll({ where: { product_id: productId } })
          .then((images) => {
            return res.status(200).json({ images });
          })
          .catch((error) => {
            console.log(error);
            return res.status(500).json({ message: 'Internal Server Error' });
          });
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    });

    
};


const prodDelete1 = async (request, response) => {
  const id = Number(request.params.id);
  console.log(id);
  if (!request.headers.authorization) {
    response.status(400).send({
      message: 'No Auth',
    });
  } else if (!id || typeof id === 'string') {
    response.status(400).send({ message: 'Invalid Id' });
  } else {
    const encodedToken = request.headers.authorization.split(' ')[1];
    const baseToAlpha = base64.decode(encodedToken).split(':');
    let decodedUsername = baseToAlpha[0];
    let decodedPassword = baseToAlpha[1];
    User.findOne({
      where: {
        username: decodedUsername,
      },
    })
      .then(async (user) => {
        const valid = await bcrypt.compare(decodedPassword, user.getDataValue('password'));
        if (valid === true && decodedUsername === user.getDataValue('username')) {
          Product.findOne({
            where: {
              id: id,
            },
          })
            .then(async (product) => {
              if (product.getDataValue('owner_user_id') !== user.getDataValue('id')) {
                response.status(403).send({
                  message: 'Unauthorized access',
                });
              } else {
                // Delete all images belonging to the product
              Image.findAll({
              where: {
                product_id: id,
              },
            }).then(async (images) => {
              const imageKeys = images.map((image) => ({
                Key: image.getDataValue('file_name'),
              }));
              console.log('Image keys:', imageKeys); // Add this line to log the image keys
              await s3
                .deleteObjects({
                  Bucket: process.env.AWS_BUCKET_NAME,
                  Delete: { Objects: imageKeys },
                })
                .promise()
                .then((data) => {
                  console.log('Deleted objects:', data); // Add this line to log the response from S3
                })
                .catch((err) => {
                  console.log('Error deleting objects:', err); // Add this line to log any errors
                });
           
                  await Product.destroy({
                    where: {
                      id: id,
                    },
                  }).then((val) => {
                    if (val) {
                      response.status(204).send({});
                    }
                  });
                });
              }
            })
            .catch((val) => {
              console.log(val);
              response.status(404).send({
                message: 'Product Not available',
              });
            });
        } else {
          response.status(401).send({
            message: 'Wrong credentials',
          });
        }
      })
      .catch(() => {
        response.status(400).send({
          message: 'Bad Request',
        });
      });
  }
};


module.exports = {prodPost,prodGet,prodPatch,prodDelete1,prodPut,imageUpload,deleteImage,getImage,getImagesByProductId}
