FROM    node:6-alpine
WORKDIR /app

COPY    README.md package.json /app/
RUN     npm i --progress=false

COPY    src /app/src/
RUN     npm run babel

COPY    bin     /app/bin
COPY    public  /app/public
COPY    views   /app/views
COPY    *       /app/

EXPOSE  3000

CMD     npm start
