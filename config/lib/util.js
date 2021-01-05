module.exports = {
  union: (...args) => [...new Set([].concat(...args))],
  clone: obj => Object.assign({}, obj),
  get: (obj, path, defaultValue) => {
    const result = String.prototype.split.call(path, /[,[\].]+?/)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined) ? res[key] : res, obj);
    return (result === undefined || result === obj) ? defaultValue : result;
  }
};
