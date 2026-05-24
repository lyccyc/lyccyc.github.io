---
title: XSS-01-Introduction
date: 2026-05-24
tags: ["web", "Tutorial"]
description: ""
---

# Introduction

基於在每個 CTF 比賽被創飛後，有感於自己的基礎需要再磨練，所以想試著透過 Blog 把自己的學習結果記錄下來

也算是重新複習一次基礎，(畢竟當天只花了2天速通計安 Web 的課程然後3天打完 pico web medium 的題目，現在完全沒辦法做到這樣XD)

身為不合格的 Web 狗，XSS 一直都是我的罩門，每次看到 XSS 都想繞著走QQ

所以筆記會從 XSS 開始，主要教材是 PortSwigger 的內容搭配一些網上大佬們的解說，會穿插 Lab 的 wp 等練習

目前對於整個筆記系統還沒有很清楚的規劃，不過會先把 Web 的東西複習完再去碰 Pwn(希望

btw 這系列的內容會以英文為主，也同時想練習自己狗啃的英文

那麼就開始吧

---

# Cross-site scripting(XSS)

## What is XSS?
XSS is a web vulnerability that allows attackers to compromise the interactions users have with a vulnerable application.
Attackers can usually masquerade as the victim user to carry out any actions that the user is able to perform, and to access any of the user's data.
If the victim has privileged access within the application, the attacker might be able to perform privileged actions or access sensitive application data.

## How does XSS work?
XSS happens when a website includes untrusted user input in a page without proper sanitization or output encoding. 
If the input contains malicious JavaScript or HTML, the browser may treat it as part of the page and execute it when another user views the page. 
Once executed, the attacker’s script runs in the context of that website, so it can interact with the page as that user, steal data accessible to JavaScript, perform actions on behalf of the user, or manipulate what the user sees.

## Types of XSS

### Reflected XSS
> The malicious script comes from the current HTTP request.

Reflected XSS is one of the simplest types of XSS. It usually happens when an application receives data in an HTTP request and includes that data in the immediate response in an unsafe way.

For example : 
`https://insecure-website.com/status?message=All+is+well`

shows : 
`<p>Status: All is well.</p>`

If the application does not process or sanitize the data properly,the attacker can easily construct an attack like below :

`https://insecure-website.com/status?message=<script>/*+Bad+stuff+here...+*/</script>`

shows
`<p>Status: <script>/* Bad stuff here... */</script></p>`

- This attack usually requires the victim to open a crafted request, such as by clicking a malicious link or being redirected to it.Once the attack succeeds, attacker can carry out any action, and retrieve any data, to which the user has access.

### Stored XSS
> The malicious script is stored by the application and later served to other users.

This happens when an application receives data from an untrusted source and includes that data in a later HTTP response.

It is commonly found in blogs, message boards, comment sections, and user profiles.

For example : 

A message board application lets users submit messages, which are displayed to other users:

`<p>Hello, this is my message!</p>`

The application doesn't perform any other processing of the data, so an attacker can easily send a message that attacks other users:

`<p><script>/* Bad stuff here... */</script></p>`

<div class="warning-box">
<strong>
Reflected XSS and stored XSS are usually caused by unsafe server-side handling of untrusted data. In DOM-based XSS, the vulnerability is usually caused by unsafe client-side JavaScript that reads attacker-controlled data and writes it into the page.
</strong>
</div>

### DOM-based XSS
> The vulnerability exists in client-side code rather than server-side code

The DOM, or Document Object Model, is the browser-created representation of an HTML document. JavaScript can read and modify the DOM dynamically after the page has loaded.

If client-side JavaScript takes attacker-controlled data, such as data from the URL, an input field, localStorage, or document.referrer, and writes it into the page using unsafe APIs such as innerHTML, the browser may interpret the data as executable code.

In the following example, an application uses some JavaScript to read the value from an input field and write that value to an element within the HTML:
```js
var search = document.getElementById('search').value;
var results = document.getElementById('results');
results.innerHTML = 'You searched for: ' + search;
```

If the attacker can control the value of the input field, they can easily construct a malicious value that causes their own script to execute:

`You searched for: <img src=1 onerror='/* Bad stuff here... */'>`

- DOM-based XSS may require user interaction, but it can also be triggered automatically when client-side JavaScript processes attacker-controlled data unsafely.

## What can XSS be used for?
- Impersonate or masquerade as the victim user.
- Carry out any action that the user is able to perform.
- Read any data that the user is able to access.
- Capture the user's login credentials.
- Perform virtual defacement of the website.
- Inject trojan functionality into the website.

## How to prevent XSS attacks?

1. Validate and filter input on arrival.
2. Encode data before output.
3. Use appropriate response headers.
4. Apply a Content Security Policy (CSP).

## Reference

1. [PortSwigger-Cross-site scripting](https://portswigger.net/web-security/cross-site-scripting)
2. [零基礎資安系列（二）-認識 XSS](https://tech-blog.cymetrics.io/posts/jo/zerobased-cross-site-scripting/)

