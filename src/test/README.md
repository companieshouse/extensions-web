# Testing
Extensions-web is using the jest framework for testing. The framework allows us to mock objects and make assertions.
mockserver is used to mock servers for integration tests and chai and request is used to test the extensions-web endpoints.

Integration and unit tests are split so our pipeline can run them in parallel.
Integration test filenames will follow the pattern `*.spec.integration.[jt]s` and similarly for unit tests `*.spec.unit.[jt]s`.

## Jest config
There are 2 config files, currently, [unit](jest.config.unit.js) and [integration](jes.config.integration.js). These specify the paths and regex of the unit and integration test files, respectively. They are called in [package.json](../../package.json) where npm test targets specify a config file `"integration": "jest -c src/test/jest.config.integration.js"`

## Mockserver
Mockserver is used to mock endpoints, the paths must live under the [mockserver](mockserver) folder.
Eg, the company profile endpoint has the path `/company/{id}` so to mock this endpoint for girls trust then the folderpath /company/0006400 must exist under mockserver.

[GET.mock](mockserver/company/0006400) will detail the mockserver response.