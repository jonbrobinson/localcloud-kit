/**
 * Minimal handler for LocalStack / LocalCloud Kit demos.
 * Create a Node function with handler `index.handler`, then upload this folder as a zip
 * (or use `samples/lambda-demo.zip`).
 */
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello from samples/lambda-demo",
      received: event,
    }),
  };
};
