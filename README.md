# iris
[![GitHub Release](https://img.shields.io/github/v/release/invercity/iris)](https://github.com/invercity/iris/releases)
[![Tests](https://github.com/invercity/iris/actions/workflows/test.yml/badge.svg)](https://github.com/invercity/iris/actions/workflows/test.yml)
[![Dependencies](https://badges.depfu.com/badges/a266632c416c41de678053f6613a83f7/count.svg)](https://depfu.com/github/invercity/iris?project_id=12849)
[![Audit](https://img.shields.io/snyk/vulnerabilities/github/invercity/iris)](https://depfu.com/github/invercity/iris?project_id=12849)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/8a4e1f8bbff64518acffcf93ec092a7e)](https://www.codacy.com/manual/andriy.ermolenko/iris?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=invercity/iris&amp;utm_campaign=Badge_Grade)
[![Commits](https://img.shields.io/github/commit-activity/m/invercity/iris)](https://github.com/invercity/iris/commits/master)
[![License](https://img.shields.io/github/license/invercity/iris)](https://github.com/invercity/iris/blob/master/LICENSE.md)

## Prerequisites
Make sure you have installed all the following prerequisites on your development machine:
* Node.js [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.
* MongoDB [Download & Install MongoDB](https://www.mongodb.com/try/download/community), and make sure it's running on the default port (27017).

## Quick Install
To install Node.js dependencies you're going to use npm again. In the application folder run this in the command-line:

```bash
$ npm install
```

## Running Your Application
After the end of install process, you'll be able to run your application using Grunt, just run grunt default task:

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
