//core modules
const path = require('path');

//packages
const dotenv = require('dotenv');
dotenv.config();
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const helmet = require("helmet");
const cors = require("cors");

//environmetal variable
const port = process.env.PORT;
const mongodbUri = process.env.MONGODB_URI;

//helper middlewares
const { errorHandler } = require('./middlewares/errorHandler');
const { corsHeaders } = require('./middlewares/corsHeaders');

//routes
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + '-' + file.originalname);
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

const app = express();

app.use(express.urlencoded()); 
app.use( 
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(helmet());
app.use(cors());
app.use(corsHeaders);

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use(errorHandler);

(async ()=>{
    try{
        const result = await mongoose.connect(mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Database connected...");
        app.listen(port, () => {
            console.log("Server started on port:", port);
        });
    }
    catch(err){
        console.log(err);
    }
})();