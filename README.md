# buddy-academy-model

Cloud Studio Surge 每日签到模块。

## 文件

- `CloudStudio-DailyCheckin.sgmodule`：Surge 模块，每天 09:00 执行签到。
- `CloudStudio-DailyCheckin.js`：签到、查询资源包余额并发送通知。

## 使用

1. 在 Surge 中导入模块：

   `https://raw.githubusercontent.com/Suk1u/buddy-academy-model/main/CloudStudio-DailyCheckin.sgmodule`

2. 在模块参数中填写 Cloud Studio 登录后的完整 Cookie。
3. 启用模块，或手动执行一次确认通知正常。

Cookie 获取方式：登录 `https://cloudstudio.net/user-center` 后，在浏览器控制台执行：

```javascript
copy(document.cookie)
```

Cookie 只在 Surge 运行时作为模块参数使用，不要提交到 GitHub。

## 说明

签到接口使用当前活动标识 `SIGN_IN_2025Q3`。Cloud Studio 更换活动后，可能需要同步更新 `CloudStudio-DailyCheckin.js` 中的活动标识。
