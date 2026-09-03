# Serves the compiled frontend produced by scripts/build-demo-bundle.sh.
# `dist/` is a build output, not source: this image never compiles anything.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/

EXPOSE 80
