# extensions-web

### Setting up Githooks

Run `make githooks` to configure your local project clone to use the hooks located in the `.githooks` directory.

## How to Use

The project homepage can be found here: http://chs.local/extensions

### Login Credentials

**Standard User** (covers most functionality)

| Field | Value |
|-------|-------|
| **Username** | `extensions@ch.gov.uk` |
| **Password** | `password` |

**Admin User** (required for downloading attachments)

| Field | Value |
|-------|-------|
| **Username** | `extensions_admin@ch.gov.uk` |
| **Password** | `password` |

## Debugging in VSCode
If running in vscode modify the `.vscode/launch.json` to attach your debugger to the process running on the chs-dev vagrant box
```
{
  configurations: [
    {
      "name": "Debug extensions-web",
      "type": "node",
      "request": "attach",
      "protocol": "inspector",
      "sourceMaps": true,
      "restart": true,
      "port": 9922,
      "address": "chs-dev",
      "remoteRoot": "/home/vagrant/SingleService/extensions-web",
      "localRoot": "${workspaceFolder}"
    }
    . . .
  ]
}
```

modify your [nodemon.json](./nodemon.json) file to "inspect" the debug port 9922 (_this is just a random port I have chosen for this example that will be available on chs-dev_)
```
"exec": "node -r ts-node/register --inspect=0.0.0.0:9922 ./src/bin/www.ts"
```

Click on the Debug button on the left pane of vscode and select "Debug extensions-web", after clicking the play button you should be in debug mode and your break points will be hit.

## v 2.0 Changes

#### Extensions Web

Upgraded gov-uk frontend from v2.6.0 to v3.2.0

Extensions-Web package.json gov-uk library version has been changed and alterations have been 
made to the nunjucks and scss paths to include "govuk" as per the
advive given on https://github.com/alphagov/govuk-frontend/releases/tag/v3.0.0

#### CDN

The CDN extensions javascript and css have been updated to support gov-uk frontend 3.2.0

  - app/assets/javascripts/app/extensions/all.js
  - app/assets/stylesheets/extensions/application-ie8.css
- app/assets/stylesheets/extensions/application.css

and fonts have been added as well:
   
  - app/assets/fonts/extensions/bold-affa96571d-v2.woff
  - app/assets/fonts/extensions/bold-b542beb274-v2.woff2
  - app/assets/fonts/extensions/light-94a07e06a1-v2.woff2
  - app/assets/fonts/extensions/light-f591b13f7d-v2.woff	

