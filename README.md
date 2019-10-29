# IRIS
[![Build Status](https://travis-ci.org/invercity/iris.svg?branch=master)](https://travis-ci.org/invercity/iris)
[![David](https://david-dm.org/invercity/iris.svg)](https://david-dm.org/invercity/iris)
[![Open Source Love](https://badges.frapsoft.com/os/mit/mit.svg?v=102)](https://github.com/ellerbrock/open-source-badge/)
## Prerequisites
Make sure you have installed all of the following prerequisites on your development machine:
* Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.
* MongoDB - [Download & Install MongoDB](http://www.mongodb.org/downloads), and make sure it's running on the default port (27017).

## Quick Install
To install Node.js dependencies you're going to use npm again. In the application folder run this in the command-line:

```bash
$ npm install
```

## Running Your Application
After the install process is over, you'll be able to run your application using Grunt, just run grunt default task:

```
$ npm start
```

Your application should run on port 3000 with the *development* environment configuration, so in your browser just go to [http://localhost:3000](http://localhost:3000)

### Running in Production mode
To run your application with *production* environment configuration, execute grunt as follows:

```bash
$ NODE_ENV=production npm start
```

* explore `config/env/production.js` for production environment configuration options

### Running with User Seed
To have default account(s) seeded at runtime:

```bash
MONGO_SEED=true npm start
```
## License
**MIT**
