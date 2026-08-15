FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS runtime
WORKDIR /app
COPY /<%= documentationFolder %>/dist ./dist
EXPOSE 80
ENV HOST=0.0.0.0
ENV PORT=80
CMD ["node", "dist/server/entry.mjs"]
