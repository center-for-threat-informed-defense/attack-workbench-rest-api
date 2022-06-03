FROM node:14

# Links the Docker image published to GitHub Container registry (ghcr.io) to the source code repository
LABEL org.opencontainers.image.source="https://github.com/center-for-threat-informed-defense/attack-workbench-rest-api"

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
