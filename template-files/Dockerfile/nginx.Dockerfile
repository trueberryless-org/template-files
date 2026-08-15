FROM nginx:alpine@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/
COPY src/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]