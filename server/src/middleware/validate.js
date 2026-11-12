const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    req.body = parsed.body ?? req.body;
    req.query = parsed.query ?? req.query;
    req.params = parsed.params ?? req.params;

    next();
  } catch (error) {
    if (error instanceof ZodError || error.name === 'ZodError') {
      const issueList = error.issues || error.errors || [];
      const formattedErrors = issueList.map((err) => ({
        field: err.path.slice(1).join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        status: 'fail',
        message: 'Invalid request payload',
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

module.exports = validate;
