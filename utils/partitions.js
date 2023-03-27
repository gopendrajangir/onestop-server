function partitions(str, i) {
  const parts = str.split(' ');

  const result = [];

  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j <= parts.length; j++) {
      result.push(parts.slice(i, j).join(' '));
    }
  }

  return result;
}

module.exports = partitions;
