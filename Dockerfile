FROM node:14.15.0

WORKDIR /home/mean

# Install Mean.JS packages
COPY package.json /home/mean/package.json
COPY package-lock.json /home/mean/package-lock.json
RUN npm install

# Manually trigger bower. Why doesnt this work via npm install?
COPY .bowerrc /home/mean/.bowerrc
COPY bower.json /home/mean/bower.json
RUN npm run bower

# Make everything available for start
COPY . /home/mean

# Set development environment as default
ENV NODE_ENV development

# Port 3000 for server
# Port 35729 for livereload
EXPOSE 3000 35729
CMD ["node", "server"]
