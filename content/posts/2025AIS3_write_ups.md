---
date: '2025-08-05T11:29:30+08:00'
draft: false
title: '2025AIS3_pre-exam'
tags: [ "AIS3"]
---
# 2025 AIS3 Writeup
> penguin，只是一個 web 仔，不想被收關稅所以來打CTF(關聯???

這次共解了8題，身為 Web 狗，Web 竟然解最少題，但沒關係我就爛

最後是 800 points，158名

身為資安小白，能打成這樣都要感謝我自己(?

未來再接再厲

<!--more-->
# Misc
## Welcome

### Description

![welcome](/images/post-images/image.png)

### Solution

複製貼上在搞事 超好笑
直接手打，通過

### Flag
<div class="flag-box">
<strong>
flag : AIS3{Welcome_And_Enjoy_The_CTF_!}
</strong>
</div>

不過目前還是沒搞清楚原理，之後再研究


## Reman CTF

### Description
我在吃 CTF，喔不對，拉麵，但我忘記我在哪間店吃了．．．，請幫我找出來
(P.S. FlagFormat: AIS3{google map 上的店家名稱:我點的品項在菜單上的名稱})

### Solution

一開始以為是隱寫術，但打不開

剛好發票對獎，出於熱心(?
幫出題者掃描旁邊發票QRCode，是一串:
`MF1687991111404137095000001f4000001f40000000034785923VG9sG89nFznfPnKYFRlsoA==:**********:2:2:1:蝦拉`

盲猜Base64，但不對

請GPT分段分析這串發票的意義，得知賣方統編: `34785923`

提示說Google店家，去[財政部網站](https://www.etax.nat.gov.tw/etwmain/etw113w1/ban/query)找店家

出現店家 : 平和溫泉拉麵店

用地址去Google店家名稱 : **樂山溫泉拉麵**

再去找發票，日期 : **2025-04-13** ， 發票號碼 : **MF16879911** 

透過[找發票](https://www.einvoice.nat.gov.tw/portal/btc/audit/btc601w/search)的網站輸入日期和發票號碼

有兩個品項，但因為掃描出現蝦拉

### Flag
<div class="flag-box">
<strong>
flag : AIS3{樂山溫泉拉麵:蝦拉麵}
</strong>
</div>

## AIS3 Tiny Server - Web / Misc

### Description

From [7890/tiny-web-server](https://github.com/7890/tiny-web-server)

I am reading Computer Systems:[ A Programmer's Perspective](http://csapp.cs.cmu.edu/).

It teachers me how to write a tiny web server in C.

Non-features

No security check
The flag is at /readable_flag_somerandomstring (root directory of the server). You need to find out the flag name by yourself.

The challenge binary is the same across all AIS3 Tiny Server challenges.

Note: This is a misc (or web) challenge. Do not reverse the binary. It is for local testing only. Run ./tiny -h to see the help message. You may need to install gcc-multilib to run the binary.

Note 2: Do not use scanning tools. You don't need to scan directory.

[Challenge Instancer](http://chals1.ais3.org:20000/login)

Warning: Instancer is not a part of the challenge, please do not attack it.

Please solve this challenge locally first then run your solver on the remote instance.

### Solution

點[Challenge Instancer](http://chals1.ais3.org:20000/login)，要輸入CTFd Token

![CTFd](/images/post-images/image-1.png)


去官網設定生成一個後進入

![alt text](/images/post-images/image-2.png)

複製後連線進去，先得到驗證碼，輸入
(這是後來2025-05-29才截圖的，當下很趕又看到有人說一段時間會關掉server，所以先連線)

連線後，會看到網頁，提示有說在 `/readable_flag_somerandomstring`

hmm，**Pathtraversal**?

好，try try

`curl -i http://chals1.ais3.org:20107/%2f%2f/%2f%2f/%2f%2f/%2f%2f/`

![kali-1](/images/post-images/image-3.png)

試了幾個目錄後，終於找到 `readable_flag_somerandomstring`相關的字樣(反白區塊)

![kali-2](/images/post-images/image-4.png)

`curl -i http://chals1.ais3.org:20107/%2f%2f/%2f%2f/%2f%2f/%2f%2f/readable_flag_QqwUe0eIKGHt2cJGAJIotUwPBF91CdSp`

![kali-3](/images/post-images/image-5.png)

### Flag
<div class="flag-box">
<strong>
flag : AIS3{tInY_We8_53RV3R_WITH_FIl3_8R0Ws1ng_AS_@_fe@TuRE}
</strong>
</div>


# Web

## Login Screen 1

### Description

Welcome to my Login Screen! This is your go-to space for important announcements, upcoming events, helpful resources, and community updates. Whether you're looking for deadlines, meeting times, or opportunities to get involved, you'll find all the essential information posted here. Be sure to check back regularly to stay informed and connected!

http://login-screen.ctftime.uk:36368/

Note: The flag starts with AIS3{1.


### Solution
![login](/images/post-images/image-6.png)

一開始的登入畫面，下面有寫guest/guset可以登入

![2FA](/images/post-images/image-7.png)
下面一樣說 2FA = 000000

![000000](/images/post-images/image-8.png)
only admin can view thr flag

一開始猜了好多密碼，甚至用SQL攻擊，都沒效
最後快放棄抱著隨便輸入的心態

帳號 : admin
密碼 : admin

欸，登入進去了????

又是熟悉的2FA

想了很久，甚至寫了爆破程式qwq

最後用Burp 去查Response

???我剛剛在幹嘛
 
![Burp](/images/post-images/image-9.png)

### Flag
<div class="flag-box">
<strong>
flag : AIS3{1.Es55y_SQL_1nJ3ct10n_w1th_2fa_IuABDADGeP0}
</strong>
</div>

## Tomorin db

### Description

I make a simple server which store some Tomorin.

Tomorin is cute ~

I also store flag in this file server, too.

### Solution
source code in main.go：

```go=
package main

import "net/http"

func main() {
	http.Handle("/", http.FileServer(http.Dir("/app/Tomorin")))
	http.HandleFunc("/flag", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "https://youtu.be/lQuWN0biOBU?si=SijTXQCn9V3j4Rl6", http.StatusFound)
  	})
  	http.ListenAndServe(":30000", nil)
}
```

坐牢好幾小時，懷疑鵝生

看到source code 有 `/flag`

一直在想怎麼繞過flag目錄，一直跳影片真的很煩ww

有嘗試用跳脫字元，一樣無果

結果突然通靈想到
`/%2e/flag` --> 哈哈出來了

### Flag
<div class="flag-box">
<strong>
flag : AIS3{G01ang_H2v3_a_c0O1_way!!!_Us3ing_C0NN3ct_M3Th07_L0l@T0m0r1n_1s_cute_D0_yo7_L0ve_t0MoRIN?}
</strong>
</div>

# Reverse

## AIS3 Tiny Server - Reverse

### Description

Find the secret flag checker in the server binary itself and recover the flag.

The challenge binary is the same across all AIS3 Tiny Server challenges.

Please download the binary from the "AIS3 Tiny Server - Web / Misc" challenge.

This challenge doesn't depend on the "AIS3 Tiny Server - Pwn" and can be solved independently.

It is recommended to solve this challenge locally.

### Solution

把 tiny 檔案丟進IDA

view -> string : 搜尋 flag
看到 `Flag Correct`之類的字串

![Love-IDA](/images/post-images/image-10.png)

查看 `sub_2110` 函式，按F5 ， 發現進到 `sub_2110` ，再追(F5)

發現核心:
```C
char v7[] = "rikki_l0v3";   // 作為 XOR key，長度 10
char* enc = (char*)v8;      // 總長度 45 的加密資料

for (int i = 0; i < 45; ++i)
    enc[i] = enc[i] ^ v7[i % 10];

for (int i = 0; i < 45; ++i)
    if (input[i] != enc[i]) return 0;

return input[45] == 0;
```
代表:
- v8 裡原本是經過 XOR 加密的 flag
- 函式在驗證前會 再 XOR 一次還原明文，然後逐 byte 與使用者輸入比對

<details open> <summary>腳本企鵝出動</summary>

```python=
import struct

# 原始加密資料（int → bytes）
v8 = [
    1480073267, 1197221906, 254628393, 920154, 1343445007,
    874076697, 1127428440, 1510228243, 743978009, 54940467, 1246382110
]

# XOR key
key = b"rikki_l0v3"

# 解密資料組成 45 byte
enc_bytes = b''.join(struct.pack('<I', x) for x in v8)[:45]

# XOR 解密
flag = bytes([b ^ key[i % len(key)] for i, b in enumerate(enc_bytes)])

print("Flag:", flag.decode())
```
</details>

執行後得到flag

### Flag
<div class="flag-box">
<strong>
flag : AIS3{w0w_a_f1ag_check3r_1n_serv3r_1s_c00l!!!}
</strong>
</div>

## A_simple_snake_game

### Description

Here is A very interesting Snake game. If no one beat this game the world will be destory in 30 seconds. Now, Chenallger , It's your duty to beat the game, save the world.

### Solution

找了好久QQ，後來從 `SnakeGame::Screen::drawGameOver(void)` 進去也沒有

半放棄的點了 `drawtext` 函式，發現判斷邏輯和 hex_array1[i]

<details open> <summary>drawtext fun.</summary>

```C
 if ( (int)this <= 11451419 || a3 <= 19810 )
  {
    SnakeGame::Screen::createText[abi:cxx11](a1, this, a3);
    v27 = 0xFFFFFF;
    v8 = std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::c_str(v28);
    a1[3] = TTF_RenderText_Solid(a1[5], v8, 0xFFFFFF);
    a1[4] = SDL_CreateTextureFromSurface(a1[1], a1[3]);
    v23 = 400;
    v24 = 565;
    v25 = 320;
    v26 = 30;
    SDL_RenderCopy(a1[1], a1[4]);
    std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::~basic_string(v28);
  }
  else
  {
    v14[0] = -831958911;
    v14[1] = -1047254091;
    v14[2] = -1014295699;
    v14[3] = -620220219;
    v14[4] = 2001515017;
    v14[5] = -317711271;
    v14[6] = 1223368792;
    v14[7] = 1697251023;
    v14[8] = 496855031;
    v14[9] = -569364828;
    v15 = 26365;
    v16 = 40;
    std::allocator<char>::allocator(&v29);
    std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::basic_string(v14, 43, &v29);
    std::allocator<char>::~allocator(&v29);
    for ( i = 0; ; ++i )
    {
      v4 = std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::length(v22);
      if ( i >= v4 )
        break;
      lpuexcpt = *(_BYTE *)std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::operator[](i);
      v9 = SnakeGame::hex_array1[i];
      *(_BYTE *)std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::operator[](i) = v9 ^ lpuexcpt;
    }
    v21 = 0xFFFFFF;
    v5 = std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::c_str(v22);
    v31 = TTF_RenderText_Solid(a1[5], v5, v21);
    if ( v31 )
    {
      v30 = SDL_CreateTextureFromSurface(a1[1], v31);
      if ( v30 )
      {
        v17 = 200;
        v18 = 565;
        v19 = 590;
        v20 = 30;
        SDL_RenderCopy(a1[1], v30);
        SDL_FreeSurface(v31);
        SDL_DestroyTexture(v30);
      }
      else
      {
        lpuexcptb = (struct _Unwind_Exception *)std::operator<<<std::char_traits<char>>(
                                                  (std::ostream::sentry *)&std::cerr,
                                                  "SDL_CreateTextureFromSurface: ");
        v7 = (char *)SDL_GetError();
        std::operator<<<std::char_traits<char>>((std::ostream::sentry *)lpuexcptb, v7);
        std::ostream::operator<<(std::endl<char,std::char_traits<char>>);
        SDL_FreeSurface(v31);
      }
    }
    else
    {
      lpuexcpta = (struct _Unwind_Exception *)std::operator<<<std::char_traits<char>>(
                                                (std::ostream::sentry *)&std::cerr,
                                                "TTF_RenderText_Solid: ");
      v6 = (char *)SDL_GetError();
      std::operator<<<std::char_traits<char>>((std::ostream::sentry *)lpuexcpta, v6);
      std::ostream::operator<<(std::endl<char,std::char_traits<char>>);
    }
    std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::~basic_string(v22);
  }
```
</details>

繼續追hex_array1[i]
```cpp
public __ZN9SnakeGame10hex_array1E
.data:004E3020 ; _BYTE SnakeGame::hex_array1[64]
.data:004E3020 __ZN9SnakeGame10hex_array1E db 0C0h, 19h, 3Ah, 0FDh, 0CEh, 68h, 0DCh, 0F2h, 0Ch, 47h
.data:004E3020                                         ; DATA XREF: SnakeGame::Screen::drawText(int,int)+15C↑o
.data:004E3020                 db 0D4h, 86h, 0ABh, 57h, 39h, 0B5h, 3Ah, 8Dh, 13h, 47h
.data:004E3020                 db 3Fh, 7Fh, 71h, 98h, 6Dh, 13h, 0B4h, 1, 90h, 9Ch, 46h
.data:004E3020                 db 3Ah, 0C6h, 33h, 0C2h, 7Fh, 0DDh, 71h, 78h, 9Fh, 93h
.data:004E3020                 db 22h, 55h, 15h dup(0)
```

<details open> <summary>腳本時間</summary>

```python=
encrypted = [
    0x81, 0x50, 0x69, 0xce, 0xb5, 0x2b, 0x94, 0xc1,
    0x6d, 0x13, 0x8b, 0xc3, 0xc5, 0x30, 0x08, 0xdb,
    0x09, 0xb2, 0x4c, 0x77, 0x59, 0x1c, 0x10, 0xed,
    0x58, 0x20, 0xeb, 0x48, 0xcf, 0xfe, 0x29, 0x65,
    0xf7, 0x67, 0x9d, 0x1d, 0xa4, 0x2e, 0x10, 0xde,
    0xfd, 0x66
]
## 00402a1b          __builtin_memcpy(&var_af, "\x81\x50\x69\xce\xb5\x2b\x94\xc1\x6d\x13\x8b\xc3\xc5\x30\x08\xdb\x09\xb2\x4c\x77\x59\x1c\x10\xed\x58\x20\xeb\x48\xcf\xfe\x29\x65\xf7\x67\x9d\x1d\xa4\x2e\x10\xde\xfd\x66", 0x2a);



key = [
    0xc0, 0x19, 0x3a, 0xfd, 0xce, 0x68, 0xdc, 0xf2,
    0x0c, 0x47, 0xd4, 0x86, 0xab, 0x57, 0x39, 0xb5,
    0x3a, 0x8d, 0x13, 0x47, 0x3f, 0x7f, 0x71, 0x98,
    0x6d, 0x13, 0xb4, 0x01, 0x90, 0x9c, 0x46, 0x3a,
    0xc6, 0x33, 0xc2, 0x7f, 0xdd, 0x71, 0x78, 0x9f,
    0x93, 0x22
]
#     char eax_6 = *(uint8_t*)((char*)var_20_1 + 0x4e3020);

# 004e3020  _.data:
# 004e3020  c0 19 3a fd ce 68 dc f2 0c 47 d4 86 ab 57 39 b5  ..:..h...G...W9.
# 004e3030  3a 8d 13 47 3f 7f 71 98 6d 13 b4 01 90 9c 46 3a  :..G?.q.m.....F:
# 004e3040  c6 33 c2 7f dd 71 78 9f 93 22 55 00 00 00 00 00  .3...qx.."U.....
# 004e3050  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................


# DE-CRY
decrypted = bytes([e ^ k for e, k in zip(encrypted, key)])
print(decrypted.decode("utf-8"))

## 004029ba  int32_t __thiscall SnakeGame::Screen::drawText(void* arg1, int32_t arg2, int32_t arg3)
```
</details>

### Flag
<div class="flag-box">
<strong>
flag : AIS3{CH3aT_Eng1n3?_0fcau53_I_bo_1T_by_hAnD}
</strong>
</div>


## web flag checker

### Description

Just a web flag checker

http://chals1.ais3.org:29998

### Solution
F12進去看到一個index.wasm(web assembly檔案)

http://chals1.ais3.org:29998/index.wasm -> download

用[WABT](https://github.com/WebAssembly/wabt)進行轉檔成index.c

看到裡面有一個func叫做`w2c_index_flagchecker_0`

1. 先檢查長度是否=40
```c
if (i32_load(p0 + 4) < 0x28)
    return;
```
2. 切成5段(每段八個字元)
去依序進行rol(左移)後比較是否和下面的值相等

```c
var_L4:
  var_i0 = var_l3;
  var_i0 = i32_load(&instance->w2c_memory, (u64)(var_i0) + 24u);
  var_l31 = var_i0;

  var_i0 = 5u; // 執行5次 
  var_l32 = var_i0;

  var_i0 = var_l31;
  var_i1 = var_l32;
  var_i0 = (u32)((s32)var_i0 < (s32)var_i1);
  var_l33 = var_i0;

  var_i0 = 1u;
  var_l34 = var_i0;

  var_i0 = var_l33;
  var_i1 = var_l34;
  var_i0 &= var_i1;
  var_l35 = var_i0;

  var_i0 = var_l35;
  var_i0 = !(var_i0);
  if (var_i0) { goto var_B3; } //結束條件

```

```c
  i64_store(&instance->w2c_memory, (u64)(var_i0) + 32, var_j1);
  var_j0 = 7577352992956835434ull;
  var_l12 = var_j0;
  var_i0 = var_l3;
  var_j1 = var_l12;
  i64_store(&instance->w2c_memory, (u64)(var_i0) + 32, var_j1);
  var_j0 = 7148661717033493303ull;
  var_l13 = var_j0;
  var_i0 = var_l3;
  var_j1 = var_l13;
  i64_store(&instance->w2c_memory, (u64)(var_i0) + 40, var_j1);
  var_j0 = 11365297244963462525ull;
  var_l14 = var_j0;
  var_i0 = var_l3;
  var_j1 = var_l14;
  i64_store(&instance->w2c_memory, (u64)(var_i0) + 48, var_j1);
  var_j0 = 10967302686822111791ull;
  var_l15 = var_j0;
  var_i0 = var_l3;
  var_j1 = var_l15;
  i64_store(&instance->w2c_memory, (u64)(var_i0) + 56, var_j1);
  var_j0 = 8046961146294847270ull;
  var_l16 = var_j0;
  var_i0 = var_l3;
  var_j1 = var_l16;
```

位移的處理在 `w2c_index_f8` 中實現

基本上就是在64bits的範圍內左移->右移->合併

比如第一個迴圈先左移45然後右移19
45+19=64 其實就是把左移溢出的部分再補上

```c
u64 w2c_index_f8(w2c_index* instance, u64 var_p0, u32 var_p1) {
  var_j0 <<= (var_j1 & 63); //左移
  var_j0 >>= (var_j1 & 63); //右移
  var_j0 = var_l9;     // 左移位元數
  var_j1 = var_l16;    // 右移位元數
  var_j0 |= var_j1;    // 合併兩者結果
}
```
接著回到wasm視窗在func8中設定中斷點查看

得知每一次的位移分別是 45, 28, 42, 39, 61

![image](/images/post-images/web_flag-1.png)
![image](/images/post-images/web_flag-2.png)
![image](/images/post-images/web_flag-3.png)
![image](/images/post-images/web_flag-4.png)
![image](/images/post-images/web_flag-5.png)

最後寫一個script把過程右移回去就會是flag

<details open> <summary>腳本時間</summary>

```python
def rotate_right(val: int, shift: int) -> int:
    val &= (1 << 64) - 1  # 限制為 64 位元
    return ((val >> shift) | (val << (64 - shift))) & ((1 << 64) - 1)

def i64_to_string(val: int) -> str:
    bytes_ = []
    for i in range(8):
        byte = (val >> (8 * i)) & 0xFF
        bytes_.append(byte)
    return ''.join(chr(b) for b in bytes_)


rotate_index = [45, 28, 42, 39, 61]
values = [ 7577352992956835434, 7148661717033493303 , -7081446828746089091 , -7479441386887439825 , 8046961146294847270 ]
i = 0
flag = ""
for value in values:
    # 還原原始數值
    original_x = rotate_right(value, rotate_index[i])
    print(f"還原後的 x = {original_x}")

    # 轉成字串
    s = i64_to_string(original_x)
    print(f"對應的字串為: {s}")
    flag+=s
    i+=1
    print(flag)
```
</details>

### Flag
<div class="flag-box">
<strong>
flag : AIS3{W4SM_R3v3rsing_w17h_g0_4pp_39229dd}
</strong>
</div>