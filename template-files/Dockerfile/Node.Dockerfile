FROM node:24.19.0-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS runtime
WORKDIR /app
COPY /<%= documentationFolder %>/dist ./dist
EXPOSE 80
ENV HOST=0.0.0.0
ENV PORT=80
CMD ["node", "dist/server/entry.mjs"]
