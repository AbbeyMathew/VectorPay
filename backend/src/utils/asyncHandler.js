/** Lets async route handlers throw; Express 4 would otherwise hang on rejections. */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
