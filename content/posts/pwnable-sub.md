---
date: '2026-02-02T15:17:40+08:00'
draft: false
title: 'Pwnable.xyz-Sub'
tags: ["CTF", "pwn", "pwnable.xyz"]
---
# sub

> Do you know basic math?

> svc.pwnable.xyz : 30001 \
Author: uafio \
Solves: 1743

<!--more-->

## Recon
With the IDA (F5)，the main function will like below:
```cpp
__int64 __fastcall main(__int64 a1, char **a2, char **a3)
{
  int n4918; // [rsp+0h] [rbp-18h] BYREF
  int n4918_1; // [rsp+4h] [rbp-14h] BYREF
  unsigned __int64 v6; // [rsp+8h] [rbp-10h]

  v6 = __readfsqword(0x28u);
  sub_A3E(a1, a2, a3);
  n4918 = 0;
  n4918_1 = 0;
  _printf_chk(1, "1337 input: ");
  _isoc99_scanf("%u %u", &n4918, &n4918_1);
  if ( n4918 <= 4918 && n4918_1 <= 4918 )
  {
    if ( n4918 - n4918_1 == 4919 )
      system("cat /flag");
  }
  else
  {
    puts("Sowwy");
  }
  return 0;
}
```

User should input two num A and B，such that A-B = 4919

But A and B cannot larger than 4918

## Solution

With the inputs do not check lowerbound，we can input 4918 and -1，which equals to 4918 - (-1) = 4919

So the inputs will be (4918,-1)

