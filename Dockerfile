FROM node:18.5.0

WORKDIR /home/iris

# Install iris packages
COPY package.json /home/iris/package.json
COPY package-lock.json /home/iris/package-lock.json
RUN npm install

# Manually trigger bower. Why doesnt this work via npm install?
COPY .bowerrc /home/iris/.bowerrc
COPY bower.json /home/iris/bower.json
RUN npm run bower

# Make everything available for start
COPY . /home/iris

# Set development environment as default
ENV NODE_ENV development

# Port 3000 for server
# Port 35729 for livereload
EXPOSE 3000 35729
CMD ["node", "server"]
