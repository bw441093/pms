FROM node:20.19-alpine

RUN npm i

RUN npm run build

EXPOSE 3000

CMD npm run start
