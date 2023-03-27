const mongoose = require('mongoose');
require('./Review');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: [5, 'Name must be atleast 5 characters long'],
      maxLength: [256, 'Name must be less than or equal to 256 characters'],
      trim: true,
    },
    manufacturer: String,
    countryOfOrigin: String,
    baseColor: {
      type: String,
      minLength: [1, 'Name must be atleast 1 characters long'],
      maxLength: [256, 'Name must be less than or equal to 256 characters'],
      trim: true,
    },
    ratings: {
      type: {
        averageRating: Number,
        totalCount: Number,
        ratingInfo: [
          {
            rating: Number,
            count: Number,
          },
        ],
        reviewInfo: {
          reviewsCount: Number,
        },
      },
    },
    brand: {
      type: {
        name: String,
        image: String,
      },
      required: true,
    },
    sizeChart: {
      type: {
        sizeChartUrl: 'String',
        sizeRepresentationUrl: 'String',
      },
    },
    details: {
      type: [
        {
          title: 'String',
          description: 'String',
        },
      ],
      required: true,
      default: [],
    },
    specifications: {
      type: {},
    },
    sellers: {},
    expiryDate: {
      type: Date,
      default: null,
    },
    analytics: {
      type: {
        articleType: String,
        subCategory: String,
        masterCategory: String,
        gender: String,
        brand: String,
      },
    },
    master: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Product',
    },
    media: {
      type: {
        videos: [],
        albums: [],
      },
    },
    mrp: {
      type: Number,
      min: 0,
      required: true,
    },
    discount: {
      type: { label: String, discountPercent: Number },
      default: null,
    },
    sizes: {
      type: [{}],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

productSchema.virtual('skus', {
  ref: 'Sku',
  foreignField: 'productId',
  localField: '_id',
});

productSchema.virtual('variants', {
  ref: 'Product',
  foreignField: 'master',
  localField: '_id',
});

productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'productId',
  localField: '_id',
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
