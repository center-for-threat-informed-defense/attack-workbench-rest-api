FROM node:14

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Install the app dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

CMD [ "npm", "start" ]
