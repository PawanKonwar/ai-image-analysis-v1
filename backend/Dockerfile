FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy everything
COPY . .

# EXPOSE the port
EXPOSE 3000

COPY global-bundle.pem ./

# Run index.js from the src folder
CMD ["node", "src/index.js"]
