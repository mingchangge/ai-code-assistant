import { useState } from 'react'
import { Button, Typography, Card } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import '@/styles/font.css'
import styled from 'styled-components'

const ExpandCodeBox = styled.div`
  width: 100%;
  margin: 0 auto 20px;
  h3 {
    font-size: 24px;
    a {
      font-size: 24px;
    }
  }
  .grid-box {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;
  }
`
const { Text, Link, Paragraph } = Typography

export default function ExpandCodeDialog() {
  const [color, setColor] = useState('#ca9b87')
  const EyeDropperHandle = async () => {
    if (window.EyeDropper) {
      const eyeDropper = new EyeDropper()
      try {
        const result = await eyeDropper.open()
        console.log(result.sRGBHex) // 访问 sRGBHex 属性时会有自动补全
        setColor(result.sRGBHex)
      } catch (e) {
        console.error(e)
      }
    } else {
      console.log('EyeDropper API is not supported in this browser.')
    }
  }
  const videoDecoder = `const decoder = new VideoDecoder({
        output: frame => canvas.draw(frame),
        error: e => console.error(e)
    });
    decoder.configure({ codec: 'hvc1.1.6.L120.90' });
  `
    .replace(/^[ \t]+/gm, '') // 去除每行开头的空格或制表符
    .replace(/ {2,}/g, ' ')

  const structuredCloneCode = `const obj = { a: 1, b: { c: 2 } };
    obj.b.d = obj.b; // 循环引用 
    const clonedObj = structuredClone(obj);
    console.log(clonedObj); // 正常输出，无循环引用错误
  `
    .replace(/^[ \t]+/gm, '') // 去除每行开头的空格或制表符
    .replace(/ {2,}/g, ' ')

  const URLSearchParamsCode =
    `const p = new URLSearchParams({q: '前端', year: 2025});
    console.log(p.toString()); // q=%E5%89%8D%E7%AB%AF&year=2025
  `
      .replace(/^[ \t]+/gm, '') // 去除每行开头的空格或制表符
      .replace(/ {2,}/g, ' ')

  const fileSystemAccessCode = `const h = await window.showSaveFilePicker();
    const w = await h.createWritable();
    await w.write(blob);
  `
    .replace(/^[ \t]+/gm, '') // 去除每行开头的空格或制表符
    .replace(/ {2,}/g, ' ')

  const writableStreamCode = `const writer = (await fetch(url, {method: 'POST', body: stream})).body.getWriter();`

  const ReadableStreamCode = `const reader =  response.body.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writeChunk(value);
    }
  `.replace(/^[ \t]+/gm, '')

  const abortControllerCode = `const ctrl = new AbortController();
    fetch(url, {signal: ctrl.signal});
    ctrl.abort(); // 任意时机取消
  `
    .replace(/^[ \t]+/gm, '') // 去除每行开头的空格或制表符
    .replace(/ {2,}/g, ' ')

  const schedulerPostTaskCode = `scheduler.postTask(refreshData, {priority: 'background'});`

  const requestIdleCallbackCode = `requestIdleCallback(() => sendLogs(), {timeout: 2000});`

  const wakeLockCode = `navigator.wakeLock.request('screen');`

  const broadcastChannelCode = `new BroadcastChannel('login').postMessage({token});`
  const PerformanceObserverCode =
    `const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) 
            analytics.send(entry.name, entry.startTime);
    });
    observer.observe({ type: 'paint'});
    `.replace(/^[ \t]+/gm, '')

  const webShareCode = `navigator.share({title: '分享标题',text: '分享内容',url: 'https://example.com'});`
  const pageVisibilityCode =
    `document.addEventListener('visibilitychange', () => {
     document.hidden ? video.pause() : video.play();
    });
  `.replace(/^[ \t]+/gm, '')

  const resizeObserverCode = `new ResizeObserver(entries => myChart.resize()).observe(document.querySelector('#chart'));`
  const intersectionObserverCode =
    `const io = new IntersectionObserver(([{isIntersecting}]) => {
        isIntersecting && sendExposure();
    }, {threshold: 0.5})
    io.observe(document.querySelector('#ad'));
    `.replace(/^[ \t]+/gm, '')
  return (
    <>
      <ExpandCodeBox>
        <h3>
          参考文章：
          <Link
            href="https://mp.weixin.qq.com/s/iUentf4p3_fMvDFbOiBUNA"
            target="_blank"
            style={{ fontSize: '24px' }}
          >
            90% 的前端都没摸过的 20 个 JS 神级 API！
          </Link>
        </h3>
        <div className="grid-box">
          <Card title="拓展1">
            <Card.Grid>
              <Paragraph>
                <Text>1. EyeDropper：浏览器级「吸管」</Text>
              </Paragraph>
              <Paragraph>
                <Button
                  variant="text"
                  icon={<SearchOutlined />}
                  onClick={() => void EyeDropperHandle()}
                />
                <Text style={{ color, marginLeft: 8 }}>当前颜色：{color}</Text>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：在线设计工具、主题色提取；
                  注意：需要用户手势触发，Chromium 95+。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>2. Intl.NumberFormat：「千分位 & 货币」一步到位--</Text>
              </Paragraph>
              <Paragraph>
                <Text style={{ color, marginLeft: 8 }}>
                  {new Intl.NumberFormat('zh-CN', {
                    style: 'currency',
                    currency: 'CNY'
                  }).format(1234567)}
                </Text>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：电商价格、股票行情； 隐藏彩蛋：unit:
                  'meter-per-second' 直接显示 5 m/s。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>3. Clipboard：「异步」剪贴板</Text>
              </Paragraph>
              <Paragraph>
                <Text style={{ color, marginLeft: 8 }}>
                  await navigator.clipboard.writeText('Hello, 2025!');
                </Text>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：代码编辑器、在线 Excel； 隐藏彩蛋：clipboard.read()
                  能读图片，做「一键去水印」神器。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>4. File System Access：浏览器里「读写」本地文件</Text>
              </Paragraph>
              <Paragraph>
                <pre>{fileSystemAccessCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：Web IDE、在线 Photoshop、Notion 本地备份；
                  注意：需要用户主动交互，HTTPS 下可用。
                </Text>
              </Paragraph>
            </Card.Grid>
            <Card.Grid>
              <Paragraph>
                <Text>5. WebCodecs：「原生硬解」4K 视频</Text>
              </Paragraph>
              <Paragraph>
                <pre>{videoDecoder}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：在线剪辑、云游戏、安防监控；隐藏彩蛋：支持 WebWorker
                  解码，主线程 0 占用。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>6. structuredClone：「深拷贝」循环引用</Text>
              </Paragraph>
              <Paragraph>
                <pre>{structuredCloneCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：Redux 巨型 Store、画板历史记录； 注意：支持
                  Map/Set/Blob/File，但不拷贝函数。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>7. requestIdleCallback：浏览器「闲时」偷偷干活</Text>
              </Paragraph>
              <Paragraph>
                <pre>{requestIdleCallbackCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：非关键日志、预加载下一路由； 注意：React 18 的
                  startTransition 底层就是它。
                </Text>
              </Paragraph>
            </Card.Grid>
            <Card.Grid>
              <Paragraph>
                <Text>8. WritableStream：大文件「流式」上传</Text>
              </Paragraph>
              <Paragraph>
                <pre>{writableStreamCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：日志实时上传、SQLite 备份； 注意：需要服务端支持
                  Transfer-Encoding: chunked。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>9. ReadableStream：大文件「流式」下载</Text>
              </Paragraph>
              <Paragraph>
                <pre>{ReadableStreamCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：断点续传、进度条； 隐藏彩蛋：配合 BYOB
                  能把内存占用再降 30%。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>10. Wake Lock：让屏幕「常亮」</Text>
              </Paragraph>
              <Paragraph>
                <pre>{wakeLockCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：直播、在线会议、车载中控 HMI；
                  隐藏彩蛋：页面可见性变化会自动释放，记得重新申请。
                </Text>
              </Paragraph>
            </Card.Grid>
          </Card>
          <Card title="拓展2">
            <Card.Grid>
              <Paragraph>
                <Text>11. URLSearchParams：告别「手写」正则</Text>
              </Paragraph>
              <Paragraph>
                <pre>{URLSearchParamsCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：处理 URL 查询参数、构建动态链接，任意 GET
                  请求、分页跳转； 隐藏彩蛋：URLSearchParams
                  本身是可迭代对象，可以直接 for-of。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>12. Broadcast Channel：同域标签页「微信群」</Text>
              </Paragraph>
              <Paragraph>
                <pre>{broadcastChannelCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：登录态同步、主题色切换、购物车合并；
                  注意：同域限制，跨域请用 localStorage + storage 事件。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>13. Web Share：「系统级分享」一呼百应</Text>
              </Paragraph>
              <Paragraph>
                <pre>{webShareCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：H5 页一键分享到微信、Telegram、邮件；
                  注意：必须用户手势触发，HTTPS 下可用。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>14. scheduler.postTask：「异步」任务调度</Text>
              </Paragraph>
              <Paragraph>
                <pre>{schedulerPostTaskCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：低优先级数据同步、预渲染； 隐藏彩蛋：支持 signal 与
                  AbortController 联动取消。
                </Text>
              </Paragraph>
            </Card.Grid>
            <Card.Grid>
              <Paragraph>
                <Text>15. Background Fetch：PWA「断网续传」</Text>
              </Paragraph>
              <Paragraph>
                <pre>
                  sw.registration.backgroundFetch.fetch('pkg', ['/1.zip',
                  '/2.zip'])
                </pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：App Shell、游戏资源包；
                  隐藏彩蛋：系统通知栏自带进度，用户可暂停/继续。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>16. AbortController：fetch「取消」竞态</Text>
              </Paragraph>
              <Paragraph>
                <pre>{abortControllerCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  产场景：搜索框联想、路由切换清理； 隐藏彩蛋：同时能取消
                  ReadableStream、scheduler.postTask。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>17. PerformanceObserver：性能指标「无侵入」采集</Text>
              </Paragraph>
              <Paragraph>
                <pre>{PerformanceObserverCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：灰度发布性能回归、SLA 看板； 隐藏彩蛋：element
                  类型能拿到 LCP 具体 DOM。
                </Text>
              </Paragraph>
            </Card.Grid>
            <Card.Grid>
              <Paragraph>
                <Text>18. Page Visibility：标签页切走，自动暂停一切</Text>
              </Paragraph>
              <Paragraph>
                <pre>{pageVisibilityCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：直播、游戏、轮询接口、WebSocket 心跳；
                  隐藏彩蛋：document.visibilityState 还能区分 "prerender"。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>19. ResizeObserver：像素级「监听」元素尺寸</Text>
              </Paragraph>
              <Paragraph>
                <pre>{resizeObserverCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：ECharts、AntV 自适应、虚拟滚动条重算高度；
                  兼容：Chromium 64+、FF 69+、Safari 13.1+，polyfill 3 KB。
                </Text>
                <Text type="danger">
                  本项目封装echarts组件使用ResizeObserver监听图表容器尺寸变化，实现自适应。
                </Text>
              </Paragraph>
              <Paragraph>
                <Text>
                  20. IntersectionObserver：懒加载 & 曝光埋点「零 JS」
                </Text>
              </Paragraph>
              <Paragraph>
                <pre>{intersectionObserverCode}</pre>
              </Paragraph>
              <Paragraph>
                <Text type="warning">
                  生产场景：图片懒加载、视频自动播放、埋点曝光；
                  注意：rootMargin 支持 "50px 0px" 提前触发，做预加载神器。
                </Text>
                <Text type="danger">可查看本项目IntersectionObserver 示例</Text>
              </Paragraph>
            </Card.Grid>
          </Card>
        </div>
      </ExpandCodeBox>
    </>
  )
}
