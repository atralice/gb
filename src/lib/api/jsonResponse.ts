export function success(data: any = { message: "Success" }) {
  return Response.json(data, { status: 200 });
}

export function noContent() {
  return new Response(null, { status: 204 });
}

export function created(data: any = { message: "Created" }) {
  return Response.json(data, { status: 201 });
}

export function badRequest(data: any = { error: "Bad Request" }) {
  return Response.json(data, { status: 400 });
}

export function unauthorized(data: any = { error: "Unauthorized" }) {
  return Response.json(data, { status: 401 });
}

export function notFound(data: any = { error: "Not found" }) {
  return Response.json(data, { status: 404 });
}

export function conflict(data: any = { error: "Conflict" }) {
  return Response.json(data, { status: 409 });
}

export function unprocessableEntity(
  data: any = { error: "Unprocessable Entity" }
) {
  return Response.json(data, { status: 422 });
}

export function serverError(
  data: any = { error: "An unexpected error occurred" }
) {
  return Response.json(data, { status: 500 });
}

export function gatewayTimeout(data: any = { error: "Gateway Timeout" }) {
  return Response.json(data, { status: 504 });
}
