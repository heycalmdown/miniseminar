FROM    node:5.6.0
WORKDIR /app
ADD     README.md package.json /app/
RUN     npm i --progress=false
ADD     src/ /app/ 
RUN     npm babel
ADD     bin/ public/ views/ * /app/
CMD     npm start
