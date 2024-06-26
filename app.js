const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');


const {graphqlHTTP}=require('express-graphql')
const graphqlSchema=require('./graphql/schema')
const graphqlResolver=require('./graphql/resolver')
const authMiddleware = require('./middleware/auth');

const app = express();


const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
app.use(authMiddleware);
app.use('/graphql',graphqlHTTP({
  schema:graphqlSchema,
  rootValue:graphqlResolver,
  graphiql:true,
  formatError(err){
    if(!err.originalError){
      return err
    }
    const data=err.originalError.data
    const message=err.message||'An error occurred'
    const code=err.originalError.code||500
    return {message,data,code}
  }
}))

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});
console.log("trying to connect to database");
mongoose
  .connect(
    'mongodb+srv://ratma96:ratmans96@cluster0.ffagtwk.mongodb.net/messages?retryWrites=true&w=majority&appName=Cluster0', 
  )
  .then(result => {
    console.log("connected to database"); 
     app.listen(8080);
  
  })
  .catch(err => console.log(err));