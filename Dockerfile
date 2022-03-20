#FROM node:14.17.5-alpine3.14
#FROM node:16.13.2-bullseye-slim@sha256:0f35ef0fa878eb2684aedaa779cbfb73f1db7bcf75b76508782ba48a9e4050d7 as build-stage
FROM node:latest-@sha256:3e7df5a089700a4c2abffed211b043fdf2207b30c497a266a6956828b374f6f9 as build-stage

#WORKDIR /app
WORKDIR /usr/src/app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm","start"]
