FROM httpd:2.4@sha256:2920ed8587277d6aa8ea785e143e970835057123dc7bf1199d102c60c80a73bb AS runtime
COPY /<%= documentationFolder %>/dist /usr/local/apache2/htdocs/
EXPOSE 80
EXPOSE 443
