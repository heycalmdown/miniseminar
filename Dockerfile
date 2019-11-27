FROM    node:10-alpine as build
WORKDIR /app

COPY    README.md package.json package-lock.json /app/
RUN     npm ci

# Rarely edited
COPY    bin           /app/bin
COPY    tsconfig.json /app/

# Frequently edited
COPY    views         /app/views
COPY    src           /app/src

RUN     npm run build

RUN     npm ci --only=production

FROM    node:10-alpine as release
WORKDIR /app
COPY    --from=build  /app/ /app/
COPY    public        /app/public

EXPOSE  3000
CMD     npm start
