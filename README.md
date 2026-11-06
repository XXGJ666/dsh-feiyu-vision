# dsh-feiyu-vision

给 [DeepSeek Harness](https://github.com/deepseek-ai) 加上"看图"能力的小插件。

- 注册 `see_image` 工具：模型可以直接描述图片内容、读截图里的文字
- 导出 `describeImage(path)`：供 QQ 通道补丁把群友发的图转成文字描述
- 用的是智谱 GLM-4V-Flash（有免费额度），不占显存、不需要本地模型

## 安装

```bash
dsh plugin --profile desktop add dsh-feiyu-vision
```

或者把本目录放进 `~/.dsh/profiles/<profile>/node_modules/`，再在 profile 的 `cordis.patch.yml` 里
insert 一条（参考本包的 `cordis.patch.yml`）。

## 配置

在插件配置里填：

| 字段 | 说明 | 默认 |
| --- | --- | --- |
| `apiKey` | 智谱 API Key（也可用环境变量 `ZHIPU_API_KEY`） | 空 |
| `model` | 视觉模型 | `glm-4v-flash` |
| `maxSide` | 图片长边上限（超出会缩放） | `2048` |
| `ffmpeg` | 转 gif/webp 用的 ffmpeg 路径 | Windows 示例路径 |

API Key 在 <https://open.bigmodel.cn> 注册后「API Keys」里新建即可，GLM-4V-Flash 目前免费。

## 用法

模型在需要时自动调用：

> 这张图里是什么？ / 帮我看看这个截图写的什么

也可以直接调：`see_image(path="D:\\pics\\a.png")` 或 `see_image(imageUrl="https://...")`。

## 许可

MIT

---

© 2026 [ShirasuAzusa_XXGJ](https://github.com/XXGJ666) · [dsh-feiyu-vision](https://github.com/XXGJ666/dsh-feiyu-vision) · MIT License
