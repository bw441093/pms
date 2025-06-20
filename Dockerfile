# ---- Build client ----
FROM node:20 AS client-build
COPY ./client /app/client
WORKDIR /app/client
RUN npm install
RUN npm run build

# ---- Build server ----
FROM node:20-slim
COPY ./server /app/server
WORKDIR /app/server
RUN npm install
RUN npm run build
# Copy client build output into server build directory
COPY --from=client-build /app/client/build ./build/
EXPOSE 3000
CMD ["npm", "start"]
