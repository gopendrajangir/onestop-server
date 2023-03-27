const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

const errorController = require('./controllers/errorController');

const app = express();

app.use(morgan('tiny'));
app.use(
  cors({
    origin: ['https://gopendrajangir.github.io', 'http://localhost:8080'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/carts', cartRoutes);
app.use('/wishlists', wishlistRoutes);

app.use(errorController);

module.exports = app;
