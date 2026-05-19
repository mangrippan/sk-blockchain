FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./

# Install dependencies with increased timeout
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 120000 && \
    npm install --production --no-optional

# Copy application code
COPY . .

ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999
ENV CORE_CHAINCODE_ID_NAME=""

EXPOSE 9999

CMD ["npm", "start"]
