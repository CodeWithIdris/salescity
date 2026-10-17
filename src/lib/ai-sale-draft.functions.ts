import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { clearSaleAiAccessBlock, createSaleDraftWithAi } from "@/lib/ai-sale-draft.server";

const descriptionSchema = z.object({ description: z.string().trim().min(1).max(500) });

export const createAiSaleDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => descriptionSchema.parse(input))
  .handler(async ({ data, context }) =>
    createSaleDraftWithAi(context.supabase, context.userId, getRequest(), data.description),
  );

export const clearAiSaleAccessBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => clearSaleAiAccessBlock(context.supabase, context.userId));