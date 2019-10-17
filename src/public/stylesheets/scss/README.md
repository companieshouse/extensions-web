# CDN information

Our CDN does not have an assets folder, but the govuk-frontend assumes that all static content will live under that path. By default all calls will reference /assets, given that this will not exist in our CDN then it must be overridden in our scss files.
```
$govuk-assets-path: '/';
```

Our CDN contains a folder specific to extensions so for other resources to be fetched from the right path, we need to change the default path for images and fonts:
```
$govuk-images-path: "/images/extensions/";
$govuk-fonts-path: "/fonts/extensions/";
```