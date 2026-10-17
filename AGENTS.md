<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep the shop workflow on the public home route with session-aware sign-in and account states; browser data access is protected by per-user row-level policies, and inventory is decremented by a database trigger when a sale is inserted so the update stays atomic.
- Keep one-shot Lovable AI Gateway calls in authenticated `createServerFn` functions with prompts and provider setup in server-only modules, so private credentials never reach the browser and user-confirmed writes remain protected.
