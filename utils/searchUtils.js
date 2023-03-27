const Product = require('../models/Product');

const pushClause = (query, path, type, clauses, isKeyword = true) => {
  const clause = {
    text: {
      query,
      path: isKeyword ? { value: path, multi: 'keywordAnalyzer' } : path,
    },
  };
  if (clauses[type]) {
    clauses[type].push(clause);
  } else {
    clauses[type] = [clause];
  }
};

const createManualClauses = (queryObj, filters = {}) => {
  const clauses = {};

  Object.keys(queryObj).forEach((key) => {
    queryObj[key].map((value) => {
      pushClause(value, key, 'should', clauses, false);
    });
  });

  console.log(clauses.should.map((obj) => obj.text.path));

  Object.keys(filters).forEach((key) => {
    if (filters[key].length) {
      const clause = {
        text: {
          query: filters[key],
          path: { value: key, multi: 'keywordAnalyzer' },
        },
      };

      if (clauses.filter) {
        clauses.filter.push(clause);
      } else {
        clauses.filter = [clause];
      }
    }
  });

  return clauses;
};

exports.createManualClauses = createManualClauses;

const createClauses = (queryObj, filters = {}) => {
  const clauses = {};

  if (queryObj['analytics.gender']) {
    pushClause(
      queryObj['analytics.gender'],
      'analytics.gender',
      'must',
      clauses
    );
    delete queryObj['analytics.gender'];
  }

  if (!queryObj['analytics.articleType']) {
    if (queryObj['specifications.Type']) {
      pushClause(
        queryObj['specifications.Type'],
        'specifications.Type',
        'must',
        clauses
      );
      delete queryObj['specifications.Type'];
    } else if (queryObj['analytics.subCategory']) {
      pushClause(
        queryObj['analytics.subCategory'],
        'analytics.subCategory',
        'must',
        clauses
      );
      delete queryObj['analytics.subCategory'];
    } else if (queryObj['analytics.masterCategory']) {
      pushClause(
        queryObj['analytics.masterCategory'],
        'analytics.masterCategory',
        'must',
        clauses
      );
      delete queryObj['analytics.masterCategory'];
    }
  } else {
    pushClause(
      queryObj['analytics.articleType'],
      'analytics.articleType',
      'must',
      clauses
    );
    delete queryObj['analytics.articleType'];
    delete queryObj['analytics.subCategory'];
    delete queryObj['analytics.masterCategory'];
  }

  if (!clauses.must?.length) {
    if (queryObj['analytics.brand']) {
      pushClause(
        queryObj['analytics.brand'],
        'analytics.brand',
        'must',
        clauses
      );
      delete queryObj['analytics.brand'];
    } else if (queryObj['baseColor']) {
      pushClause(queryObj['baseColor'], 'baseColor', 'must', clauses);
      delete queryObj['baseColor'];
    } else if (queryObj['specifications.Occasion']) {
      pushClause(
        queryObj['specifications.Occasion'],
        'specifications.Occasion',
        'must',
        clauses
      );
      delete queryObj['specifications.Occasion'];
    }
  }

  Object.keys(queryObj).forEach((key) => {
    pushClause(queryObj[key], key, 'should', clauses);
  });

  Object.keys(filters).forEach((key) => {
    if (filters[key].length) {
      const clause = {
        text: {
          query: filters[key],
          path: { value: key, multi: 'keywordAnalyzer' },
        },
      };

      if (clauses.filter) {
        clauses.filter.push(clause);
      } else {
        clauses.filter = [clause];
      }
    }
  });

  return clauses;
};

const conditionalGroup = (
  field,
  textFilters = {},
  rangeFilters = {},
  isText = true
) => {
  const group = {
    $group: {
      _id: '$' + field,
      ...(textFilters[field] && isText
        ? {
            selected: {
              $sum: {
                $cond: [
                  {
                    $in: ['$' + field, textFilters[field]],
                  },
                  1,
                  0,
                ],
              },
            },
          }
        : {}),
      count: {
        $sum: {
          $cond: [
            {
              $and: [
                ...(!Object.keys(textFilters).length
                  ? [{}]
                  : Object.keys(textFilters).map((key) => {
                      if (key != field) {
                        if (!textFilters[key].length) return [{}];
                        return {
                          $or: textFilters[key].map((value) => {
                            return {
                              $eq: ['$' + key, value],
                            };
                          }),
                        };
                      } else {
                        return [{}];
                      }
                    })),
                ...(!Object.keys(rangeFilters).length
                  ? [{}]
                  : Object.keys(rangeFilters).map((key) => {
                      if (key != field) {
                        if (!rangeFilters[key].length) return [{}];
                        return {
                          $or: rangeFilters[key].map((obj) => {
                            return {
                              $and: [
                                {
                                  $lt: ['$' + key, obj.max],
                                },
                                {
                                  $gte: ['$' + key, obj.min],
                                },
                              ],
                            };
                          }),
                        };
                      } else {
                        return [{}];
                      }
                    })),
              ],
            },
            1,
            0,
          ],
        },
      },
    },
  };
  return group;
};

const groupDiscounts = (discounts, filters = []) => {
  discounts = discounts.filter(({ _id }) => !!_id);

  const ranges = [90, 80, 70, 60, 50, 40, 30, 20, 10, 1];
  const discountRanges = {};

  let discountIdx = 0;

  ranges.forEach((value, i) => {
    while (discounts[discountIdx] && discounts[discountIdx]._id >= value) {
      const range = {
        max: i == 0 ? 100 : ranges[i - 1],
        min: value,
      };
      if (discountRanges[value]) {
        discountRanges[value].count += discounts[discountIdx].count;
        discountRanges[value].range = range;
      } else {
        discountRanges[value] = {
          range,
          count: discounts[discountIdx].count,
        };
      }
      discountIdx++;
    }
  });

  return Object.keys(discountRanges).map((key) => {
    const {
      range: { min, max },
    } = discountRanges[key];
    return {
      _id: `${min}% to ${max}%`,
      ...discountRanges[key],
      selected: filters.filter((obj) => {
        const {
          range: { min, max },
        } = discountRanges[key];
        if (obj.min == min && obj.max == max) {
          return true;
        }
      }).length
        ? true
        : false,
    };
  });
};

const groupRatings = (ratings, filters = []) => {
  ratings.sort((a, b) => b._id - a._id);

  ratings = ratings.filter(({ _id }) => !!_id);

  const ranges = [4, 3, 2, 1, 0];
  const ratingRanges = {};

  let ratingIdx = 0;

  ranges.forEach((value, i) => {
    while (ratings[ratingIdx] && ratings[ratingIdx]._id >= value) {
      const range = {
        max: i == 0 ? 5 : ranges[i - 1],
        min: value,
      };
      if (ratingRanges[value]) {
        ratingRanges[value].count += ratings[ratingIdx].count;
        ratingRanges[value].range = range;
      } else {
        ratingRanges[value] = {
          range,
          count: ratings[ratingIdx].count,
        };
      }
      ratingIdx++;
    }
  });

  return Object.keys(ratingRanges).map((key) => {
    const {
      range: { min, max },
    } = ratingRanges[key];
    return {
      _id: `${min} to ${max}`,
      ...ratingRanges[key],
      selected: filters.filter((obj) => {
        if (obj.min == min && obj.max == max) {
          return true;
        }
      }).length
        ? true
        : false,
    };
  });
};

const groupMrps = (mrps, filters = []) => {
  mrps.sort((a, b) => a._id - b._id);

  const ranges = [99, 499, 999, 1999, 5999, 9999, 1499, 19999, 24999, 49999];

  let mrpsIdx = 0;

  const mrpRanges = {};

  ranges.forEach((value, i) => {
    while (mrps[mrpsIdx] && mrps[mrpsIdx]._id < value) {
      const range = {
        min: i == 0 ? 0 : ranges[i - 1],
        max: value,
      };

      const key = `${range.min}.${range.max}`;

      if (mrpRanges[key]) {
        mrpRanges[key].count += mrps[mrpsIdx].count;
      } else {
        mrpRanges[key] = {
          count: mrps[mrpsIdx].count,
          range,
        };
      }
      mrpsIdx++;
    }
  });

  return Object.keys(mrpRanges).map((key) => {
    const {
      range: { min, max },
    } = mrpRanges[key];
    return {
      _id: `Rs. ${min} to Rs. ${max}`,
      ...mrpRanges[key],
      selected: filters.filter((obj) => {
        if (obj.min == min && obj.max == max) {
          return true;
        }
      }).length
        ? true
        : false,
    };
  });
};

exports.fetchFilters = async (query, queryObj, prevFilters, manual = false) => {
  let clauses = manual
    ? createManualClauses(Object.assign({}, queryObj), {})
    : createClauses(Object.assign({}, queryObj), {});

  const filtersResult = await Product.aggregate([
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
    {
      $facet: {
        articleTypes: [
          conditionalGroup(
            'analytics.articleType',
            prevFilters.text,
            prevFilters.range
          ),
          {
            $sort: {
              count: -1,
            },
          },
        ],
        genders: [
          conditionalGroup(
            'analytics.gender',
            prevFilters.text,
            prevFilters.range
          ),
          {
            $sort: {
              count: -1,
            },
          },
        ],
        colors: [
          conditionalGroup('baseColor', prevFilters.text, prevFilters.range),
          {
            $sort: {
              count: -1,
            },
          },
        ],
        brands: [
          conditionalGroup(
            'analytics.brand',
            prevFilters.text,
            prevFilters.range
          ),
          {
            $sort: {
              count: -1,
            },
          },
        ],
        mrps: [
          conditionalGroup('mrp', prevFilters.text, prevFilters.range, false),
          {
            $sort: {
              count: -1,
            },
          },
        ],
        discounts: [
          conditionalGroup(
            'discount.discountPercent',
            prevFilters.text,
            prevFilters.range,
            false
          ),
          {
            $sort: {
              count: -1,
            },
          },
        ],
        countryOfOrigin: [
          conditionalGroup(
            'countryOfOrigin',
            prevFilters.text,
            prevFilters.range
          ),
          {
            $sort: {
              count: -1,
            },
          },
        ],
        ratings: [
          conditionalGroup(
            'ratings.averageRating',
            prevFilters.text,
            prevFilters.range,
            false
          ),
          {
            $sort: {
              count: -1,
            },
          },
        ],
      },
    },
  ]).collation({
    locale: 'en',
    strength: 2,
  });

  let filters = filtersResult[0];

  const mrps = filters.mrps;
  const discounts = filters.discounts;
  const ratings = filters.ratings;

  if (ratings.length) {
    filters.ratings = groupRatings(
      ratings,
      prevFilters.range['ratings.averageRating']
    );
  }

  if (discounts.length) {
    filters.discounts = groupDiscounts(
      discounts,
      prevFilters.range['discount.discountPercent']
    );
  }

  if (mrps.length) {
    filters.mrps = groupMrps(mrps, prevFilters.range.mrp);
  }

  Object.keys(filters).forEach((key) => {
    filters[key] = filters[key]
      .filter((obj) => obj.count)
      .map((obj) => {
        obj.selected = obj.selected ? true : false;
        return obj;
      });
  });

  const newFilters = {
    primary: {
      text: {
        'analytics.articleType': {
          title: 'Categories',
          abbr: 'ftt',
          values: filters.articleTypes,
        },
        'analytics.gender': {
          title: 'Gender',
          abbr: 'ftg',
          values: filters.genders,
        },
        baseColor: { title: 'Color', abbr: 'ftc', values: filters.colors },
        'analytics.brand': {
          title: 'Brands',
          abbr: 'ftb',
          values: filters.brands,
        },
      },
      range: {
        mrp: { title: 'Price', abbr: 'frm', values: filters.mrps },
        'discount.discountPercent': {
          title: 'Discount',
          abbr: 'frd',
          values: filters.discounts,
        },
      },
    },
    secondary: {
      text: {
        countryOfOrigin: {
          title: 'Country of origin',
          abbr: 'ftco',
          values: filters.countryOfOrigin,
        },
      },
      range: {
        'ratings.averageRating': {
          title: 'Rating',
          abbr: 'frr',
          values: filters.ratings,
        },
      },
    },
  };

  const allFilters = {
    ...newFilters.primary.text,
    ...newFilters.primary.range,
    ...newFilters.secondary.text,
    ...newFilters.secondary.range,
  };

  const selectedFilters = {};

  Object.keys(allFilters).map((key) => {
    const values = allFilters[key].values.filter((value) => value.selected);
    if (values.length) {
      selectedFilters[key] = { ...allFilters[key], values };
    }
  });

  return { filters: newFilters, selectedFilters };
};

exports.createRangeFilterStage = (rangeFilters = {}) => {
  const exprArr = Object.keys(rangeFilters).map((key) => {
    return rangeFilters[key] && rangeFilters[key].length
      ? {
          $or: rangeFilters[key].map((obj) => {
            return {
              [key]: {
                $lt: obj.max,
                $gte: obj.min,
              },
            };
          }),
        }
      : {};
  });

  return {
    $match: {
      $and: exprArr.length ? exprArr : [{}],
    },
  };
};

exports.createClauses = createClauses;
