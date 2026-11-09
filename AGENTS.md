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

- Library sources are owner-private and shared through one library UI; files use owner-prefixed private storage paths to keep research isolated.
- Extract source files in browser-only event handlers; AI reads saved text through authenticated server functions and returns a draft requiring manual saving and review.
