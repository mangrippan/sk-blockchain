FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999
ENV CORE_CHAINCODE_ID_NAME=""

EXPOSE 9999

CMD ["npm", "start"]
