const mergeDeep = (target, source) => {
  const isObject = (obj) => obj && typeof obj === 'object';
  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach(key => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      target[key] = targetValue.concat(sourceValue);
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
};

const isObjectLike = (value) => {
  return value && typeof value === 'object';
};

const isString = (value) => {
  return typeof value === 'string' ||
    (!Array.isArray(value) && isObjectLike(value) && value.toString().call(value) === '[object String]');
};

module.exports = {
  union: (...args) => [...new Set([].concat(...args))],
  clone: obj => Object.assign({}, obj),
  get: (obj, path, defaultValue) => {
    const result = String.prototype.split.call(path, /[,[\].]+?/)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined) ? res[key] : res, obj);
    return (result === undefined || result === obj) ? defaultValue : result;
  },
  mergeDeep,
  isString
};
