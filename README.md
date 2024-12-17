# foundry-container-registry

A graphical hub to the CrowdStrike container registry, built on Foundry.

## Developing

1. In `ui/pages/dashboard`:

   1. Run `npm install` (only have to do this once)
   1. Run `npm run watch` to live rebuild on change

1. In `ui/pages/sandbox`:

   1. Run `npm install` (only have to do this once)
   1. Run `npm run build` to manually build on change

1. In root, run `foundry apps run`

The pages will now be available in the Falcon console (after refresh) under the **Custom apps** menu.
