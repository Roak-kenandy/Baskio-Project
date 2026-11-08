/**
 * Validates request parts with Zod schemas. Parsed (and stripped) values are
 * exposed on `req.validated`; controllers must only read from there.
 */
function validate(schemas) {
  return (req, _res, next) => {
    req.validated = {};
    for (const part of ['params', 'query', 'body']) {
      if (schemas[part]) req.validated[part] = schemas[part].parse(req[part] ?? {});
    }
    next();
  };
}

module.exports = validate;
