FROM node:22.20.0-alpine

RUN apk add --no-cache git

WORKDIR /home/iris

# Install iris packages
COPY package.json /home/iris/package.json
COPY package-lock.json /home/iris/package-lock.json
COPY .bowerrc /home/iris/.bowerrc
COPY bower.json /home/iris/bower.json
COPY gruntfile.js /home/iris/gruntfile.js

RUN npm install
RUN npm run bower
RUN npm run build

# Make everything available for start
COPY . /home/iris

# Set development environment as default
ENV NODE_ENV development

# Port 3000 for server
# Port 35729 for livereload
EXPOSE 3000 35729
CMD ["node", "server"]
