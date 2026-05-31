import { z } from "zod";

export type ValidatedJson<T> = { success: true; data: T } | { success: false; response: Response };

export function validationErrorResponse(
  message: string,
  errors?: ReturnType<typeof z.flattenError>,
) {
  return Response.json({ message, ...(errors ? { errors } : {}) }, { status: 400 });
}

export async function validateJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ValidatedJson<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: validationErrorResponse("Malformed JSON body"),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      response: validationErrorResponse("Invalid request body", z.flattenError(result.error)),
    };
  }

  return { success: true, data: result.data };
}

export const nonEmptyString = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} is required`);

export const optionalString = z.string().trim().optional().nullable();

export const optionalId = z
  .union([z.string().trim().min(1), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value === "" ? null : value));
