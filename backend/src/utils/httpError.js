class HttpError extends Error {
  /**
   * @param {number} status   HTTP status code
   * @param {string} message  Human-readable message
   * @param {Record<string,string>} [fields] Per-field messages for forms
   */
  constructor(status, message, fields) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.fields = fields;
  }
}

module.exports = HttpError;
