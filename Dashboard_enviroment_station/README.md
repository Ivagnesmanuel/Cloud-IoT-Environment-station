## Enviroment dashboard

This folder contains the web application for the enviroment station, used to visualize all the telemetries retrieved from the devices.

```
Cloud-IoT-enviroment-station/webapp
├── README.md
├── app.js
├── config
│   └── keys.js
├── helpers
│   └── hbs.js
├── models
│   ├── Device.js
│   ├── Direction.js
│   ├── Height.js
│   ├── Humidity.js
│   ├── Intensity.js
│   └── Temperature.js
├── package.json
├── public
│   └── css
│       └── style.css
├── routes
│   └── index.js
└── views
    ├── index
    │   ├── direction.handlebars
    │   ├── directionIndex.handlebars
    │   ├── height.handlebars
    │   ├── heightIndex.handlebars
    │   ├── home.handlebars
    │   ├── humidity.handlebars
    │   ├── humidityIndex.handlebars
    │   ├── intensity.handlebars
    │   ├── intensityIndex.handlebars
    │   ├── temperature.handlebars
    │   └── temperatureIndex.handlebars
    ├── layouts
    │   └── main.handlebars
    └── partials
        └── _navbar.handlebars

10 directories, 26 files
```
