# foundry-container-registry

A graphical hub to the CrowdStrike container registry, built on Foundry.

## Developing

1. In `ui/pages`:

   1. Run `npm install` (only have to do this once)
   1. Run `npm run watch` to live rebuild on change (takes a few seconds)

1. In root, run `foundry apps run`

The pages will now be available in the Falcon console (after refresh) under the **Custom apps** menu.

## Function testing

Foundry functions don't have a "dev mode" so we test locally and then deploy:

1. Export the following variables into your environment:
   -  `FALCON_CLIENT_ID`
   - `FALCON_CLIENT_SECRET`
   - `FALCON_CLOUD`
   
   If you would like to enable debug logs, export `DEBUG=true` as well.

1. In `functions/syncimages`:

   1. `go run main.go`
   1.

   ```shell
   curl -X Post --location 'http://localhost:8081' \
      --header 'Content-Type: application/json' \
      --data '{
         "body": {},
         "method": "POST",
         "url": "/sync-images"
      }'
   ```

## Deploy and release

A _deployment_ represents a development version of the software. This development version 
can be promoted to production through a _release_ process, making it available for 
installation. While Foundry supports semantic versioning for deployments, we do not utilize 
this feature. The release versions in this GitHub repository correspond to Foundry releases.

**To deploy a build (either from `main` or a work branch):**

1. In `ui/pages`: `npm run build`
1. To deploy, in root: `foundry apps deploy`

   1. Select "Patch" (as a matter of convention, we _do not_ use semantic versioning with deployments)
   1. Add a brief change log, or if just preparing for a release, "preparing for vX.Y.Z"
   1. Preview the app and test

**To deploy a release (only from `main`):**

1. Merge any open PR's that are desired for this release, and follow the deployment steps above

1. Create a GitHub release from `main`

   1. Determine the appropriate release version (major/minor/patch), keeping in mind that Foundry will generate a release version in the next step by incrementing the _previous Foundry release_ by 1 for either the major, minor, or patch part of the version
   1. Generate the changelog

1. To release, in root: `foundry apps release`

   1. Choose the appropriate major/minor/patch to match the versioning choice above
   1. For release notes, provide the link to the GitHub release
