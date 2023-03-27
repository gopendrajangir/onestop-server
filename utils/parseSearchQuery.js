// @ts-nocheck

const Fuse = require('fuse.js');
const analytics = require('../data/analytics.json');
const partitions = require('./partitions');
const synonyms = require('../data/synonyms.json');

function parseSearchQuery(query) {
  const conjuctions = ['for', 'in', 'and', 'of', 'under', 'by'];

  const parts = partitions(
    query
      .split(' ')
      .filter((word) => !conjuctions.includes(word))
      .join(' ')
  );

  if (parts.indexOf('&') !== -1) {
    parts.splice(parts.indexOf('&'), 1);
  }

  let result = {};

  parts.forEach((part) => {
    Object.keys(analytics).forEach((key) => {
      const fuse = new Fuse(
        [
          ...analytics[key],
          ...(synonyms[key] ? Object.keys(synonyms[key]) : []),
        ],
        {
          includeScore: true,
        }
      );

      const res = fuse.search(part);

      if (res[0]) {
        res[0].term = part;
        if (synonyms[key] && synonyms[key][res[0].item]) {
          res[0].item = synonyms[key][res[0].item];
        }

        if (result[key]) {
          if (result[key].score > res[0].score) result[key] = res[0];
          if (result[key].score === res[0].score) {
            if (result[key].item.length < res[0].item.length) {
              result[key] = res[0];
            }
          }
        } else {
          result[key] = res[0];
        }
      }
    });
  });

  const termResult = {};

  Object.keys(result).forEach((key, i) => {
    const term = result[key].term;
    if (termResult[term]) {
      termResult[term].push({ key, value: result[key] });
      termResult[term].sort((a, b) => a.value.score - b.value.score);
    } else {
      termResult[term] = [{ key, value: result[key] }];
    }
  });

  result = {};

  Object.keys(termResult).forEach((term) => {
    const highScoredTerm = termResult[term][0];
    let results;
    if (highScoredTerm) {
      results = termResult[term].filter((obj) => {
        return highScoredTerm.value.score === obj.value.score;
      });
    }

    results = results.slice(0, 2);

    results.map((obj) => {
      if (result[obj.key]) {
        if (result[obj.key].score < obj.score) {
          result[obj.key] = obj.value;
        }
      } else {
        result[obj.key] = obj.value;
      }
    });
  });

  Object.keys(result).forEach((key, i) => {
    if (result[key]) {
      const term = result[key].term;

      Object.keys(result).forEach((k, j) => {
        if (term !== result[k].term) {
          if (
            term.includes(result[k].term) &&
            result[key].score <= result[k].score
          ) {
            delete result[k];
          }
        }
      });
    }
  });

  if (result['analytics.brand']) {
    const term = result['analytics.brand'].term;

    let found = false;

    Object.keys(result).forEach((key) => {
      if (key !== 'analytics.brand') {
        if (
          result[key].term === term &&
          result[key].score < result['analytics.brand'].score
        ) {
          found = true;
        }
      }
    });

    if (found) {
      delete result['analytics.brand'];
    }
  }

  if (result['specifications.Type']) {
    if (
      result['analytics.articleType'] &&
      result['analytics.articleType'] < result['specifications.Type']
    ) {
      delete result['specifications.Type'];
    }
  }

  const resultKeys = Object.keys(result);

  if (resultKeys.length !== 1) {
    resultKeys.forEach((key) => {
      if (result[key].score <= 0.25)
        result[key] = {
          item: result[key].item,
          term: result[key].term,
          score: result[key].score,
        };
      else delete result[key];
    });
  }

  if (
    result['analytics.gender'] &&
    result['analytics.gender']?.term === result['analytics.brand']?.term
  ) {
    delete result['analytics.brand'];
  }

  if (result['analytics.articleType'] && result['analytics.subCategory']) {
    if (
      result['analytics.articleType'].score >
      result['analytics.subCategory'].score
    ) {
      delete result['analytics.articleType'];
    }
  }

  Object.keys(result).forEach((key) => {
    result[key] = result[key].item;
  });

  console.log(result);

  return result;
}

module.exports = parseSearchQuery;
