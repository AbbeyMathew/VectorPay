const HttpError = require('../utils/httpError');

const FIELD_LABELS = { phone: 'phone number', email: 'email' };

function notFound(req, res) {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Validation failures from zod -> 400 with per-field messages for forms.
  if (err?.name === 'ZodError') {
    const fields = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return res.status(400).json({ message: err.issues[0]?.message || 'Invalid request', errors: fields });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...(err.fields && { errors: err.fields }) });
  }

  // Unique index violation (e.g. two sign-ups racing for the same phone number).
  if (err?.code === 11000) {
    const key = Object.keys(err.keyPattern || {})[0] || 'value';
    const label = FIELD_LABELS[key] || key;
    const message = `This ${label} is already registered`;
    return res.status(409).json({ message, errors: { [key]: message } });
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
}

module.exports = { notFound, errorHandler };
