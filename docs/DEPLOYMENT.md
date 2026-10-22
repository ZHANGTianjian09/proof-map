# GitHub Pages deployment

Target repository: [ZHANGTianjian09/proof-map](https://github.com/ZHANGTianjian09/proof-map). Site: [Proof Map](https://zhangtianjian09.github.io/proof-map/).

## Build and release gates

The application is a static Vite build with base `/proof-map/`. Node 24 and the pnpm version pinned in `package.json` are used in Actions; dependencies install with `--frozen-lockfile`. Both CI and the deployment build run unit tests, type checking, the production build, install Chromium and run browser tests against that production output. Only `dist/` is uploaded as the Pages artifact.

The deployment workflow has only `workflow_dispatch`. A push to `main` runs validation but cannot publish. The deploy job depends on the successful build and uses the `github-pages` environment with Pages/OIDC permissions. Do not replace this with an automatic push-triggered deployment.

## Authorized publication

1. Run the checks in [TEST_PLAN.md](TEST_PLAN.md) and inspect the files to be published. Keep credentials, `.local/`, raw research sources and unpublished/private graphs out of Git and `dist/`.
2. With the user's explicit authorization, commit the application and `pnpm-lock.yaml`, then push to the intended GitHub branch. No force push is needed for an initial repository.
3. In repository **Settings → Pages**, choose **GitHub Actions** as the source. The authenticated owner may equivalently configure the repository Pages API with `build_type: workflow`.
4. Manually run **Deploy Proof Map to GitHub Pages** on the reviewed branch. With GitHub CLI: `gh workflow run deploy.yml --repo ZHANGTianjian09/proof-map --ref main`.
5. Watch the build and deploy jobs. If either fails, inspect its actual logs and fix the cause before rerunning. Check the workflow's resulting site URL.
6. Confirm HTTP success for the live entry point and its referenced local JavaScript/CSS/fonts/worker assets, plus `/proof-map/schemas/proof-map.v1.schema.json` and `/proof-map/examples/statistical-estimation.graph.json`. Confirm schema/example responses are JSON, not an HTML fallback. Keep imported-content browser checks local and synthetic.

The workflow must exist on the repository's default branch before it can be manually dispatched. GitHub account/organization restrictions, Pages configuration and environment protection rules may require repository-owner action; a successful local build alone does not establish deployment success.

## Operation

Serve the build through HTTP(S), rather than opening `index.html` directly. The application has no client-side page routes requiring a server fallback. Imported JSON stays in browser memory; the static host receives asset requests. No application backend, API key, remote math rendering or content upload is needed.

To roll back, obtain authorization and manually deploy a reviewed prior revision through the same tested workflow. Do not rewrite Git history. Automatic future publication is not authorized merely because an earlier deployment was approved.

References: [Vite project-site base paths](https://vite.dev/guide/static-deploy.html#github-pages) and [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
