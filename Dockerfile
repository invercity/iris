FROM node:12.13.0

WORKDIR /home/mean

# Install Mean.JS packages
ADD package.json /home/mean/package.json
ADD package-lock.json /home/mean/package-lock.json
RUN npm install

# Manually trigger bower. Why doesnt this work via npm install?
ADD .bowerrc /home/mean/.bowerrc
ADD bower.json /home/mean/bower.json
RUN npm run bower

# Make everything available for start
ADD . /home/mean

# Set development environment as default
ENV NODE_ENV development

# Port 3000 for server
# Port 35729 for livereload
EXPOSE 3000 35729
CMD ["node", "server"]
