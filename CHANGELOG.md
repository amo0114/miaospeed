miaospeed v4.6.3

1. 将mihomo升级到v1.19.17
2. 适配 sudoku 代理协议
3. 为Miaoko客户端提供不支持的macro兼容层
4. 新的macro：hijack 用来检测流量是否被“劫持”，这里的劫持指的是测速链接请求的IP地址与实际普通网页请求的IP地址不一致产生的“分流行为”。（感谢 https://github.com/SpeedCentre/hijack-test 提供的测试代码）
5. 具体劫持说明可查看此链接：https://telegra.ph/劫持检测的背后我们是如何做到的-11-27
6. 为 fetch 函数添加新的参数：sni ，用来指定SNI，默认为空

| MatrixType        | 描述     | Macro  |
|-------------------|--------|--------|
| TEST_HIJACK_DETECTION | 测速劫持检测 | hijack |

macro兼容层介绍

现在所有的macro都可以通过名为“script”的macro进行包装后运行，具体原理是：

通过在js脚本声明一个MS_MATRICE_ENTRY常量，然后设置matrix_extract函数，让函数返回和js脚本中handler一样的结构格式，就可以做到通过在脚本中调用其他macro

下面是一个要求提取"TEST_HIJACK_DETECTION"矩阵（对应的macro会自动被调用）的例子：
```js
// 测速劫持检测脚本，需要miaospeed版本至少 4.6.3 以上
const C_NA = '142,140,142';
const C_UNL = '186,230,126';
const C_FAIL = '239,107,115';
const C_UNK = '92,207,230';
const MS_MATRIX_ENTRY = {
    name: "TEST_HIJACK_DETECTION", // MatrixType 数据矩阵名称，对应的macro会自动被调用
    params: "劫持检测", // 可能的参数
}
// 提取 matrix 数据，macroResult是对应的macro运行结果，其数据结构参阅源码，或者你可以用js遍历出来它的属性
function matrix_extract(macroResult) {
    // 检查 macroResult 是否为对象
    if (!macroResult || typeof macroResult !== "object") {
        return {
            text: "无效数据",
            background: C_NA
        };
    }

    // 提取 speedIP 和 realIP（防止 null / undefined）
    var speedIP = macroResult.SpeedIP;
    // print("speedIP: " + speedIP);
    var realIP = macroResult.RealIP;
    // print("realIP: " + realIP);
    // 若任意为空 → 检测失败
    if (!speedIP || !realIP || speedIP === undefined || realIP === undefined || speedIP === null || realIP === null) {
        return {
            text: "检测失败",
            background: C_NA
        };
    }
    // 若不一致 → 被劫持
    if (speedIP !== realIP) {
        return {
            text: "❌被劫持",
            background: C_FAIL
        };
    }
    return {
        text: "✅未劫持",
        background: C_UNL
    };
}
```

