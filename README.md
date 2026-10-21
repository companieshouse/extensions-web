# extensions-web

The Extensions Web Service (`extensions-web`) lets companies apply to Companies House for more time to file their annual accounts.

This is a customer-facing service. It validates user input, keeps journey state in the user's session and coordinates calls to company-profile and extensions application programming interfaces (APIs).

The application uses Express, TypeScript and Nunjucks with GOV.UK frontend components. Backend APIs own company data, extension requests and supporting documents; this application manages the web journey.

The [Extensions API](https://github.com/companieshouse/extensions-api) stores requests and attachment metadata and delegates file operations to the File Transfer Service. The [Extensions Processor API](https://github.com/companieshouse/extensions-processor-api) evaluates submissions, invokes feature-controlled CHIPS integration and submits email notifications. Submission confirmation does not necessarily mean approval.

Please refer [Service Guide](docs/SERVICE_GUIDE.md) to understand the user journey of the application

## Contents

- [How to Build](#how-to-build)
- [How to Run](#how-to-run)
- [How to Test](#how-to-test)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Documents referred](#documents-referred)

## How to Build

### Prerequisites

- Node.js 24 and npm, matching the runtime used by the [Dockerfile](Dockerfile).
- Git and Make, including access to the `api-enumerations` submodule.

#### Node installation

To verify node and npm version open a new terminal and run from repository root:

```sh
node -v
```
If node version is not 24, run

```sh
nvm install 24
nvm use 24
nvm alias default 24
```

#### Build
The build compiles TypeScript and copies templates into `dist/`. Alternatively, `make build` installs dependencies, runs lint, initialises the enumerations submodule if needed and builds the application.

```sh
npm install
make update_submodules
npm run build
```

#### Setting up Githooks 
To configure your local project clone to use the hooks located in the .githooks directory
```sh
make githooks
```

#### Linting

[ESLint](https://eslint.org/) is used to perform static analysis on code using a [StandardJS](https://standardjs.com/) ruleset as its base.

npm run lint

You can also auto-fix minor linting errors by running `npm run lint:fix`

## How to Run

### Using the application with Docker CHS in local

1. Clone [Docker CHS Development](https://github.com/companieshouse/docker-chs-development) and follow the steps in the README.
2. Run `chs-dev modules enable extensions, platform`
3. Run `chs-dev services enable extensions-web` 
(this will allow you to make changes in real time).
4. Run `chs-dev development enable extensions-web` 
5. In the `extensions-web directory`,  run `npm install && npm run build` (otherwise the docker development build fails due to permissions problems within the container).
6. Run docker using `chs-dev up` in the `docker-chs-development` directory.
7. Use `docker_chs logs -f extensions-web` or Docker Desktop to view logs. Alternatively, run `chs-dev logs extensions-web`.
8. Open your browser and go to page <http://chs.local/extensions> and login with below users
9. Login as a user `extensions@ch.gov.uk` with password `password`, which covers most functionality
10. Login as a user with admin privileges `extensions_admin@ch.gov.uk` with password `password` for downloading attachments. The web download check allows the users with both view and download permissions. The API has separate role checks, so verify access through the full authenticated route. A web permission check alone does not establish end-to-end access

[Environment variables](#environment-variables) used to configure this service in docker are located in the file `services/modules/extensions/extensions-web.docker-compose.yaml` in [Docker CHS Development](https://github.com/companieshouse/docker-chs-development)

## How to Test

## Unit test execution

The project defines the following npm scripts:

```sh
npm run unit
npm run integration
npm run contract-consumer
npm test
npm run sonar-test
npm run unit -- --runTestsByPath src/test/controllers/company.details.controller.spec.unit.ts
npm run lint
npm run build
```

- `npm run unit` runs the unit tests configured with `src/test/jest.config.unit.js`; use them for controller, service, validation, date-boundary and error-path behaviour with mocked dependencies.
- `npm run integration` runs integration tests configured with `src/test/jest.config.integration.js`; use them to verify route wiring, middleware, rendering and interactions between application components.
- `npm run contract-consumer` runs consumer contract tests configured with `src/test/jest.config.contract.js`; use them to check the web service's assumptions about its APIs.
- `npm test` runs the unit and integration suites; the contract-consumer suite is a separate command.
- `npm run sonar-test` run tests with coverage  
- `npm run unit -- --runTestsByPath` used to run a single unit-test file
- `npm run lint` checks code style 
- `npm run build` does TypeScript compilation.

### Test Data

1. In MongoDB Compass, use the below query with current date in company_profile database collection, to get the company number in due
    ```sh
    {
    "data.accounts.next_due": {
        $gt: ISODate("2026-10-20T09:09:31.360Z")
    }
    }
    ```

2. If you get the message "Your accounts are overdue" on the company details screen, the "data.accounts.next_due" and “data.accounts.next_accounts.due_on” values on the mongoDB company_profile collection record for that company has to be within the env var TOO_SOON_DAYS_BEFORE_DUE_DATE (30) days in the future of todays date and not in the past AND make sure “data.accounts.overdue” = false

3. If you then get the ‘extension limit reached’ screen (“We cannot grant an extension to the filing deadline”), alter the data.accounts.next_accounts - period_start_on and period_end_on dates to be within the last year

4. If you want to make those MongoDB changes permanent, you can update the database assets file for the extensions module in the docker-chs-development repository : docker-chs-development/services/modules/extensions/assets/database.mongo.js

5. To download you will need to find the download link in the ‘attachments’ section in the record of the mongo collection ‘extension_requests’.
Then you need to prefix that url with <domain>/extensions/download + <url from download link in mongo>
You then need to sign out of CHS
Enter the complete url and you will be prompted to enter a user, you must be an admin user with correct roles assigned.
Or alternatively, you should be able to click the link(s) in the emails mentioned below but will still need to re-sign in as an admin user “extensions_admin@ch.gov.uk” with password ”password”

6. Use mailhog to view emails in Docker: http://localhost:8025/#

7. If you need to set up a user for downloading, you need to set the user roles up in the mongo DB, instructions can be found here [User role setup](https://companieshouse.atlassian.net/wiki/spaces/TTL/pages/1118765578/Upload+Download+for+Extensions+to+File+Service#chs-admin) 

## Environment Variables

The following settings are read by [the session configuration](src/session/config.ts):

| Variable | Value | Purpose |
| --- | --- | --- |
| `MAXIMUM_EXTENSION_REQUESTS_PER_DAY` | `50` | Daily request threshold used by request monitoring. |
| `MAX_EXTENSION_PERIOD_IN_MONTHS` | `12` | Maximum permitted period between the accounting period end and filing deadline. |
| `MAX_FILE_SIZE_BYTES` | `4194304` | Maximum file size accepted by the web upload handler (4 MiB). |
| `PERMISSION_NAME_DOWNLOAD` | `/admin/extensions-download` | Staff permission name checked for attachment downloads. |
| `TOO_SOON_DAYS_BEFORE_DUE_DATE` | `60` | Earliest application window, in days before the filing deadline. |

## Troubleshooting

### API Hostname Lookup Fails

`getaddrinfo EAI_AGAIN api.chs.local` means the API hostname could not be resolved. Check the Docker development environment, network and VPN connectivity. Test DNS from the web container, not just the host:

```sh
docker exec extensions-web node -e 'require("dns").lookup("api.chs.local", console.log)'
```

If resolution succeeds after a transient failure, retry the browser action. If it keeps failing, check the configured API URLs and Docker network aliases.

### Startup Reports a Missing Environment Variable

Supply the named setting using your development environment configuration. The required settings are read when modules load, so restart the application after changing them.

### The Company Cannot Continue

Eligibility depends on the dates and flags returned by the company-profile API. An application can be blocked because accounts are overdue, the deadline is too far away, or the existing deadline is already at least the configured maximum number of months after the accounting period end.

A future filing deadline does not by itself establish eligibility. Check both the filing deadline and the accounting period end, and use suitable local test data rather than bypassing the eligibility rules.

### Upload or Submission Fails

For upload failures, check File Transfer Service connectivity, MongoDB persistence and the limits at every tier: web `MAX_FILE_SIZE_BYTES`, API `UPLOAD_MAX_FILE_SIZE` and `UPLOAD_MAX_REQUEST_SIZE`

## Documents referred

[Extensions in Docker](https://companieshouse.atlassian.net/wiki/spaces/TTL/pages/3661824266/Extensions+in+Docker?xpis=eyJicmlkZ2UiOiJxdWlja0ZpbmQiLCJpZCI6IjE3OTI1NjUzMzI1MDIiLCJzb3VyY2UiOiJjb25mbHVlbmNlIn0%3D)

[Extend your filing deadline service](https://companieshouse.atlassian.net/wiki/spaces/TT/pages/5676695603/Extend+your+filing+deadline+service)

[Extensions Service](https://companieshouse.atlassian.net/wiki/spaces/~mjones4/pages/3887530023/Extensions+Service?xpis=eyJicmlkZ2UiOiJxdWlja0ZpbmQiLCJpZCI6IjE3OTI1NjUzMzI1MDIiLCJzb3VyY2UiOiJjb25mbHVlbmNlIn0%3D)

[Upload/Download for Externsions](https://companieshouse.atlassian.net/wiki/spaces/TTL/pages/1118765578/Upload+Download+for+Extensions+to+File+Service?xpis=eyJicmlkZ2UiOiJxdWlja0ZpbmQiLCJpZCI6IjE3OTI1NjUzMzI1MDIiLCJzb3VyY2UiOiJjb25mbHVlbmNlIn0%3D)