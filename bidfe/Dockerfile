# -----------------------------------------------------------------------------
# Stage 1: Build the React Application
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first to utilize Docker cache
COPY package.json package-lock.json ./

# Install dependencies strictly based on lock file
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the app (Creates the 'dist' folder)
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Serve with Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Clean default Nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy your custom Nginx config (needed for React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx internal port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]