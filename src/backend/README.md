[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# backend
This is a [Moleculer](https://moleculer.services/)-based micro-services project. Generated with the [Moleculer CLI](https://moleculer.services/docs/0.14/moleculer-cli.html).

## Usage
Start the project with `npm run dev` command. 
After starting, open the https://localhost:8081/ URL in your browser. Please check system.json.
You can check services and endpoints via https://localhost:8081/services/

## Services
- **api.gateway**: API gateway service
- **socket.gateway.js**: Socket gateway service
- **authentication.service.js**: Verify user / token and allowing to login
- **authorization.service.js**: Verify user role
- **conversation.service.js**: Manage conversation information
- **user.service.js**: Manage user information and contact LDAP server
- **live.service.js**: Manage user online status
- **message.service.js**: Manage messages
- **message-queue.service.js**: Manage user's queue
- **elasticsearch.service.js**: Support searching messages
- **attachment.service.js**: Manage attachment
- **applications.service.js**: Manage application which is used by extensions


## Useful links

* Moleculer website: https://moleculer.services/
* Moleculer Documentation: https://moleculer.services/docs/0.14/

## NPM scripts

- `npm run dev`: Start main services development mode
- `npm run dev:ext`: Start extension services in development mode
- `npm run start`: Start main services in production mode
- `npm run start:ext`: Start extension services in production mode

## Debug
`node --inspect=0.0.0.0:9229 node_modules/moleculer/bin/moleculer-runner --hot services\*.*`: Start main services and allowing debug via port 9229
### Extensions
`node --inspect=0.0.0.0:9230 node_modules/moleculer/bin/moleculer-runner  extension-services/*.js`: Start extension services and allowing debug via port 9229
