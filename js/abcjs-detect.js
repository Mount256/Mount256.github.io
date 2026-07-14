document.addEventListener('DOMContentLoaded', async function () {
  const scores = document.querySelectorAll('.abcjs-score:not(.abcjs-initialized)')
  if (!scores.length) return

  // 加载你确认可用的 CSS + JS
  function loadCSS(href) {
    return new Promise(resolve => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.onload = resolve
      document.head.appendChild(link)
    })
  }

  function loadJS(src) {
    return new Promise(resolve => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      document.body.appendChild(script)
    })
  }

  // 你确认可用的资源
  await loadCSS('https://cdn.jsdelivr.net/npm/abcjs@6.6.3/abcjs-audio.min.css')
  await loadJS('https://cdn.jsdelivr.net/npm/abcjs@6.6.3/dist/abcjs-basic-min.js')

  // 遍历所有乐谱（官方 DEMO 标准逻辑）
  for (const el of scores) {
    el.classList.add('abcjs-initialized')
    const abc = el.textContent.trim()
    el.innerHTML = ''

    // 创建官方标准结构：乐谱 + 播放器
    const paper = document.createElement('div')
    const audio = document.createElement('div')
    el.appendChild(paper)
    el.appendChild(audio)

    // 1. 渲染乐谱
    const visualObj = ABCJS.renderAbc(paper, abc, {
      responsive: 'resize',
      add_classes: true,
      scale: 1.1
    })[0]

    if (!ABCJS.synth.supportsAudio()) continue

    // 2. 官方标准光标控制
    const cursorControl = {
      beatSubdivisions: 2,
      onEvent: function (ev) {
        if (ev.measureStart && ev.left === null) return
        document.querySelectorAll('.abcjs-note-highlight').forEach(e => e.classList.remove('abcjs-note-highlight'))
        if (ev.elements) ev.elements.forEach(arr => arr.forEach(n => n.classList.add('abcjs-note-highlight')))
      }
    }

    // 3. 官方标准播放器
    const synthControl = new ABCJS.synth.SynthController()
    synthControl.load(audio, cursorControl, {
      displayLoop: true,
      displayRestart: true,
      displayPlay: true,
      displayProgress: true,
      displayWarp: true
    })

    // 4. 官方标准音频初始化（必须这样写才会请求音频）
    const synth = new ABCJS.synth.CreateSynth()
    await synth.init({ visualObj: visualObj })
    await synthControl.setTune(visualObj, false)
  }

  // 全局样式
  const style = document.createElement('style')
  style.textContent = `
    .abcjs-note-highlight { fill: red !important; stroke:red !important; }
    .abcjs-inline-midi { width:100% !important; border-radius:6px; margin:10px 0; }
  `
  document.head.appendChild(style)
})
