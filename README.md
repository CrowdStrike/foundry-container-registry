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

1. Load a `FALCON_CLIENT_ID`, `FALCON_CLIENT_SECRET`, and `FALCON_CLOUD` into your environment
1. In `functions/SyncImages`:

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
