FROM    node:5.6.0
ADD     bin/ public/ src/ views/ * /app/
WORKDIR /app
RUN     npm i --progress=false
CMD     npm babelstart
