# miniseminar

[![Greenkeeper badge](https://badges.greenkeeper.io/heycalmdown/miniseminar.svg)](https://greenkeeper.io/)

Confluence as a backend -> expressjs -> reveal.js as a presentation -> Profit!

[![Dependency Status](https://david-dm.org/heycalmdown/miniseminar/status.svg)](https://david-dm.org/heycalmdown/miniseminar)

## Requirements

* Docker
* Confluence server

## How to run

```
$ docker run -p 3000:3000 heycalmdown/miniseminar
```

Open your preferred browser and type `localhost:3000/page/:your-confluence-page-id`. The page id should be a number.

## Config

You can override configs with environment variables.

* HOST - http(s)://your.host.name:port
* CONTEXT - You can set this with '' (empty string) when you don't have context trailing after the hostname.
* USERNAME
* PASSWORD
 
```
$ docker run -e HOST=http://your.host.name:port -e CONTEXT=wiki -e USERNAME=haha -e PASSWORD=hoho heycalmdown/miniseminar
```

## Markup

* Slide - Add double `horizontal rule` from the Confluence editor. Or you can use four dashses(----) twice.
* Vertical Slice - Add single `horizontal rule`
* Links - Use any link style which Confluence support
* Image - Use any image style wich Confluence support including attachment
* Table - Use Confluence table as usual
* Fragments - Ends a sentence with `⏎`(unicode return symbol)
* Theming - Use a query parameter `?theme=black`
* Transition Style - Use a query paramenter `?transition=slide`
