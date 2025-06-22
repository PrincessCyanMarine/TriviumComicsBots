FROM ubuntu:20.04
FROM node:16.6.2

ENV PORT=4000
 
WORKDIR /
COPY package.json package.json
COPY . .

RUN npm install
 
CMD [ "npm", "run", "dev" ]