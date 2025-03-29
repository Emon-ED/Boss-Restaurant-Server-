const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.PAYMENT_SK_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());

// Mongo Connects ---------------------------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vdv6d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
// Mongo data base ------------------------
    const userCollection = client.db("Boss-Restuarant").collection("users");
    const menuCollection = client.db("Boss-Restuarant").collection("menu");
    // Mongo Reviewss-----------
    const reviewCollection = client.db("Boss-Restuarant").collection("reviews");
    const cartCollection = client.db("Boss-Restuarant").collection("carts");
    const paymentCollection = client.db("Boss-Restuarant").collection("payments");
    

    // user info save in database----------
    app.post ('/user',async(req,res)=>{
      const user = req.body;
      // google user checking======
      const query= {email:user.email}
      const existingEmail = await userCollection.findOne(query);
      if(existingEmail){
        return res.send({message:'already registered', insertedId:null});
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })


    
    // Secure api ---------------------
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_SECRET,{expiresIn:'1h'})
      res.send({token})
    })


       // Verify middle ware token --------------------
       const verifyToken = (req,res,next)=>{
        if(!req.headers.authorization){
          return res.status(401).send({message: 'forbidden access'})
        }
        const token = req.headers.authorization.split(' ')[1]
       jwt.verify(token,process.env.ACCESS_SECRET,(err,decoded)=>{
         if(err){
          return res.status(401).send({message:'forbidden access'})
         }
         req.decoded=decoded;
         next();
       })
      }
      
      const verifyAdmin = async(req,res,next)=>{
        const email = req.decoded.email;
        const query = {email:email};
        const user = await userCollection.findOne(query);
        const isAdmin = user?.role === 'admin';
        if(!isAdmin){
          res.status(403).send({message:'forbidden access'})
        }
        next();
      }
// Admin checking-----------------------
      app.get('/users/admin/:email',verifyToken, async(req,res)=>{
        const email = req.params.email;
        if(! email ===req.decoded.email){
          return res.status(403).send({message:'forbidden access'})
        }
        const query = {email:email};
        const user = await userCollection.findOne(query);
        let admin = false;
        if(user){
          admin = user?.role === 'admin';
        }
        res.send({admin});
       }) 

    app.get('/user',verifyToken,verifyAdmin, async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })


    // delete user-------------------
    app.delete('/user/:id',verifyToken,verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)}
      const result = await userCollection.deleteOne(filter);
      res.send(result);
    })
    // make admin ?--------------
    app.patch('/user/admin/:id',verifyToken,verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set:{
          role:'admin'
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })
// get all menu items --------------
    app.get('/menu',async(req,res)=>{
        const result =await menuCollection.find().toArray();
        res.send(result);
    });
    app.get('/menu/:id',async(req,res)=>{
      const id = req.params.id;
      const query ={_id: new ObjectId(id)};
      const result = await menuCollection.findOne(query);
      res.send(result);
    })
    app.patch('/menu/:id',verifyToken,verifyAdmin, async(req,res)=>{
      const item = req.body;
      const id =req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set:{
          name:item.name,
          price:item.price,
          image:item.image,
          recipe:item.recipe,
          category:item.category
        }
      }
      const result = await menuCollection.updateOne(filter,updatedDoc);
      res.send(result);
    })
    app.post('/menu',verifyToken,verifyAdmin, async(req,res)=>{
      const item = req.body;
      const result = await menuCollection.insertOne(item);
      res.send(result);
    });
    app.delete('/menu/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params;
      const query = {_id: new ObjectId(id)};
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    })

    // get all reviews------------
    app.get('/reviews',async(req,res)=>{
        const result = await reviewCollection.find().toArray();
        res.send(result)
    })

    // cart post api 
    app.post ('/cart', async(req,res)=>{
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })

    app.get ('/carts',async(req,res)=>{
      const email = req.query.email;
      const query = {email: email};
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });
// payment apI -----------

    app.post('/create-payment-intent',async(req,res)=>{
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency:'usd',
        payment_method_types:['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret
      });
    })
    
    app.delete('/cart/:id',async(req,res)=>{
      const id = req.params.id;
      const query ={_id:new ObjectId(id)};
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })


      // Payment related api--------------------
    app.post('/payment', async(req,res)=>{
      const payment = req.body;
       console.log(payment.cartIds)
      const paymentResult = await paymentCollection.insertOne(payment);
       console.log(payment);
      const query = {
        _id:{
        $in: payment.cartIds.map(itemId =>new ObjectId(itemId))
      }}
     const deleteResult = await cartCollection.deleteMany(query);
      res.send({paymentResult,deleteResult});
    })

    app.get('/payment/:email',verifyToken, async(req,res)=>{
      const query ={email:req.params.email};
      if(req.decoded.email !== req.params.email){
        return res.status(403).send({message:'forbidden access'});
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })
    // get all admin panel info like revenue,orders, user etc--------------
    app.get('/admin-stats',verifyToken,verifyAdmin, async(req,res)=>{
      const totalUser = await userCollection.estimatedDocumentCount();
      const totalItems = await menuCollection.estimatedDocumentCount();
      const totalOrders = await paymentCollection.estimatedDocumentCount();
      // total revenue calculate----------
      const result = await paymentCollection.aggregate([
        {
          $group:{
            _id: null,
            totalRevenue: {
              $sum:'$price'
            }
          }
        }
      ]).toArray();

      const revenue = result.length> 0 ? result[0].totalRevenue : 0;

      res.send({
        totalUser,
        totalItems,
        totalOrders,
        revenue
      })
    })

    // Using aggregate pipeline -----------------------
    app.get('/order-stats',verifyToken,verifyAdmin, async(req,res)=>{
      const result = await paymentCollection.aggregate([
        {
          $unwind: '$menuIds'
        },
        {
          $set:{menuIds : {$toObjectId:'$menuIds'}}
        },
        {
          $lookup:{
            from:'menu',
            localField: 'menuIds',
            foreignField:'_id',
            as:'menuItems'
          }
        },
        {
          $unwind: '$menuItems'
        },
        {
          $group: {
            _id:'$menuItems.category',
            quantity:{ $sum:1 },
            revenue:{$sum:'$menuItems.price'}
          }
        },
        {
          $project:{
            _id: 0,
            category:'$_id',
            quantity:'$quantity',
            revenue:'$revenue'
          }
        }
      ]).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('Boss is Running....')
});

app.listen(port,()=>{
    console.log(`Boss is running on ${port}`)
})


// Boss-Restaurant
// 7ScZ4EUGT3aLg3ni