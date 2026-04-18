export function createMockReq({
  method = 'GET',
  body = {},
  query = {},
  headers = {}
} = {}) {
  return {
    method,
    body,
    query,
    headers,
    on() {}
  };
}

export function createMockRes() {
  const response = {
    statusCode: 200,
    headers: {},
    body: null,
    redirectedTo: null,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
    redirect(location) {
      this.statusCode = 302;
      this.redirectedTo = location;
      this.headersSent = true;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    }
  };

  return response;
}
