FROM node:20.19-alpine

COPY . /opt/pms

WORKDIR /opt/pms

RUN npm i

RUN npm run build

EXPOSE 3000

CMD npm run start
