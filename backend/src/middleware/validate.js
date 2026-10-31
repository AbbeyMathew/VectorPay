/** Validates req[source] against a zod schema and replaces it with the parsed (typed) value. */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error);
  req[source] = result.data;
  next();
};

module.exports = validate;
