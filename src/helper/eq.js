module.exports = function(a, b, options) {
  return a.toString().toLocaleLowerCase() === b.toString().toLocaleLowerCase() ? options.fn(this) : options.inverse(this);
};
