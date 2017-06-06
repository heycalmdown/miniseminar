FROM    node:8-alpine
WORKDIR /app

COPY    README.md package.json package-lock.json /app/
RUN     npm i --production

COPY    lib     /app/lib

COPY    bin     /app/bin
COPY    public  /app/public
COPY    views   /app/views
COPY    *       /app/

EXPOSE  3000

CMD     npm start
