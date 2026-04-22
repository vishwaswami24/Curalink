export function errorHandler(error, request, response, next) {
  console.error(error);
  response.status(500).json({
    message: "Something went wrong while processing the medical research request.",
    error: error.message
  });
}

