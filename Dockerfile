#FROM node:14.17.5-alpine3.14
#FROM node:16.13.2-bullseye-slim@sha256:0f35ef0fa878eb2684aedaa779cbfb73f1db7bcf75b76508782ba48a9e4050d7 as build-stage
# for Mac M1
#FROM node:latest@sha256:3e7df5a089700a4c2abffed211b043fdf2207b30c497a266a6956828b374f6f9 as build-stage

# for Linux server
FROM node:lts-buster@sha256:44e59f8582c39b17ab895261edbcfeadb082ea2a881701ffbce68f5536c5c342 as build-stage

#WORKDIR /app
WORKDIR /usr/src/app

COPY package.json .
RUN npm install
RUN npm install pm2 -g

COPY . .

EXPOSE 3000

CMD ["npm","start"]
