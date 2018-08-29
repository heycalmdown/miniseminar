# miniseminar

[![dockeri.co](http://dockeri.co/image/heycalmdown/miniseminar)](https://registry.hub.docker.com/heycalmdown/miniseminar/)

[![Build Status](https://travis-ci.org/heycalmdown/miniseminar.svg?branch=release-1.0)](https://travis-ci.org/heycalmdown/miniseminar)
[![Greenkeeper badge](https://badges.greenkeeper.io/heycalmdown/miniseminar.svg)](https://greenkeeper.io/)
[![Dependency Status](https://david-dm.org/heycalmdown/miniseminar/status.svg)](https://david-dm.org/heycalmdown/miniseminar)
[![CodeFactor](https://www.codefactor.io/repository/github/heycalmdown/miniseminar/badge)](https://www.codefactor.io/repository/github/heycalmdown/miniseminar)
[![](https://images.microbadger.com/badges/image/heycalmdown/miniseminar:1.0.svg)](https://microbadger.com/images/heycalmdown/miniseminar:1.0 "Get your own image badge on microbadger.com")
[![](https://images.microbadger.com/badges/version/heycalmdown/miniseminar:1.0.svg)](https://microbadger.com/images/heycalmdown/miniseminar:1.0 "Get your own version badge on microbadger.com")


Confluence as a backend -> expressjs -> reveal.js as a presentation -> Profit!

## Requirements

* Docker
* Confluence server

## How to run

```
$ docker run -ti -p 3000:3000 \
      -e HOST=https://confluency.atlassian.net \
      -e CONTEXT=wiki \
      heycalmdown/miniseminar
```

Open your preferred browser and type `localhost:3000/page/:your-confluence-page-id`. The page id should be a number.

## Config

You can override configs with environment variables.

Name         | Notes
------------ | -----
HOST         | http(s)://your.host.name:port
CONTEXT      | You can set this with '' (empty string) when you don't have context trailing after the hostname.
USERNAME     |
PASSWORD     |
AUTHTYPE     | `no` \| `basic` \| `cookie`
PINNED_PAGES | You can pin your notice pages. Comma-separated ids. 
 
```
$ docker run -d -p 3000:3000 \
      -e HOST=http://your.host.name:port \
      -e CONTEXT=wiki \
      -e USERNAME=haha \
      -e PASSWORD=hoho \
      heycalmdown/miniseminar
```

## Markup

Type             | Notes
---------------- | -----
Slide            | Add double `horizontal rule` from the Confluence editor. Or you can use four dashses(----) twice.
[Vertical Slice](https://revealjs.com/#/2)   | Add single `horizontal rule`
Links            | Use any link style which Confluence support
Image            | Use any image style wich Confluence support including attachment
[Background Image](https://revealjs.com/#/10/1) | Make the last image as a background if you reset an image size to original
Table            | Use Confluence table as usual
[Fragments](https://revealjs.com/#/fragments)        | Ends a sentence with `⏎`(unicode return symbol)
[Code Highlight](https://revealjs.com/#/13) | Use Confluence code block |
[Theming](https://revealjs.com/#/themes)          | Use a query parameter `?theme=black`
[Transition Style](https://revealjs.com/#/transitions) | Use a query parameter `?transition=slide`


## Plugins

* [Gliffy](https://marketplace.atlassian.com/plugins/com.gliffy.integration.confluence/cloud/overview) supports Cloud and Server
* [Mermaid](https://marketplace.atlassian.com/plugins/org.anvard.atlassian.mermaid-plugin/server/overview) supports Server only
