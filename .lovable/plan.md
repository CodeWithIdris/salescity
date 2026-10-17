# AI-assisted sale drafts

## Goal
Let signed-in shop owners describe a sale in plain language, review the extracted sale details, and explicitly confirm before it is recorded.

## Approach
- Add an authenticated server function that loads the signed-in owner’s products, calls Lovable AI Gateway with a strict structured response, and returns only a proposed product, quantity, payment method, and any clarification/error state.
- Keep the AI call and its prompt in server-only code; require the owner to confirm the draft in the existing quick-sale screen before using the existing sale insert and stock trigger.
- Add a compact phone-friendly input and review state, validate the proposed product/quantity against current inventory, and let the owner correct or discard it.
- Add focused tests for sale-draft validation, run project tests, and inspect preview diagnostics.

## Technical details
- Use authenticated `createServerFn` with the existing bearer-token middleware and per-user RLS client.
- Use a streamed AI SDK Responses call through Lovable AI Gateway with the workspace’s resolved default chat model; consume its structured result server-side.
- Do not let the AI write sales or change inventory; only the existing explicit confirmation action may insert a sale.