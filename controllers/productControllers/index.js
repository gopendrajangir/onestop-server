// @ts-nocheck

const crypto = require('crypto');
const { getStorage } = require('firebase-admin/storage');

const Product = require('../../models/Product');
const Phrase = require('../../models/Phrase');

const catchAsync = require('../../utils/catchAsync');

const parseSearchQuery = require('../../utils/parseSearchQuery');
const {
  createClauses,
  createManualClauses,
  createRangeFilterStage,
  fetchFilters,
} = require('../../utils/searchUtils');

exports.createProduct = catchAsync(async (req, res) => {
  const bucket = getStorage().bucket();

  const id = crypto.randomBytes(16).toString('hex');

  let images;

  if (req.files) {
    images = await Promise.all(
      req.files.map(async (file, i) => {
        const name =
          id +
          '-' +
          i +
          file.originalname.slice(file.originalname.lastIndexOf('.'));
        const f = bucket.file(name);
        await f.save(file.buffer);
        return name;
      })
    );
  }

  res.status(200).json({
    status: 'success',
    data: [],
  });
});

exports.searchProducts = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 15,
    prevQueryObj = {},
    includeFilters = false,
    filters = {},
    manualQueries = { 'analytics.articleType': ['tshirts'] },
    manual = false,
    sort = { 'ratings.totalCount': -1, 'ratings.ratingsAverage': -1 },
  } = req.body;

  let { query = '' } = req.body;

  query = query.toLowerCase();

  const queryObj = manual
    ? manualQueries
    : Object.keys(prevQueryObj).length
    ? prevQueryObj
    : parseSearchQuery(query);

  let products = [];
  let total = 0;
  let newFilters;

  if (manual || (query && Object.keys(queryObj).length)) {
    let clauses;

    if (manual) {
      clauses = createManualClauses(Object.assign({}, queryObj), filters.text);
    } else {
      clauses = createClauses(Object.assign({}, queryObj), filters.text);
    }

    const result = await Product.aggregate([
      {
        $search: !Object.keys(queryObj).length
          ? {
              text: {
                query,
                path: {
                  wildcard: '*',
                },
              },
            }
          : {
              compound: clauses,
            },
      },
      createRangeFilterStage(filters.range),
      {
        $set: {
          score: {
            $meta: 'searchScore',
          },
        },
      },
      sort ? { $sort: { score: -1, ...sort } } : null,
      {
        $facet: {
          products: [
            {
              $skip: (page - 1) * limit,
            },
            {
              $limit: limit,
            },
          ],
          total: [
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
              },
            },
          ],
        },
      },
    ]);

    products = result[0].products;

    total = result[0].total[0] ? result[0].total[0].count : 0;

    newFilters =
      includeFilters && (await fetchFilters(query, queryObj, filters));
  }

  res.status(200).json({
    total,
    products,
    queryObject: queryObj,
    ...(newFilters ? { ...newFilters } : {}),
  });
});

function refineVariants(variants, productId) {
  return variants
    .map(({ _id, media, name, baseColor }) => {
      const image = media?.albums?.[0]?.images?.[0]?.src;
      return {
        _id,
        name,
        image,
        baseColor,
      };
    })
    .filter((p) => {
      return !p._id.equals(productId);
    });
}

exports.getProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findById(productId)
    .populate({
      path: 'skus',
    })
    .populate({
      path: 'variants',
      select: '_id name media baseColor',
    })
    .populate({
      path: 'reviews',
    });

  product.variants = refineVariants(product.variants, product._id);

  if (product.master) {
    let variants = await Product.find(
      {
        $or: [{ _id: product.master }, { master: product.master }],
      },
      { _id: 1, name: 1, media: 1, baseColor: 1 }
    );
    if (variants) {
      variants = refineVariants(variants, product._id);
    } else {
      variants = [];
    }
    product.variants = variants;
  }

  res.status(200).json({
    status: 'success',
    product,
  });
});

exports.autocomplete = catchAsync(async (req, res, next) => {
  let { query } = req.query;

  query = query.toLowerCase();

  const result = await Phrase.aggregate([
    {
      $search: {
        index: 'autocomplete',
        autocomplete: {
          query,
          path: 'phrase',
        },
        highlight: {
          path: 'phrase',
        },
      },
    },
    {
      $set: {
        score: {
          $meta: 'searchScore',
        },
      },
    },
    {
      $set: {
        highlights: { $meta: 'searchHighlights' },
      },
    },
    {
      $sort: { score: -1 },
    },
    {
      $limit: 8,
    },
  ]);

  res.status(200).json({
    status: 'success',
    result: result,
  });
});
