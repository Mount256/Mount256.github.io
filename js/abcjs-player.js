// Butterfly主题abcjs播放器 - 官方最佳实践版
window.initAbcjsPlayer = function() {
    const scoreElements = document.querySelectorAll('.abcjs-score:not(.abcjs-initialized)');
    
    scoreElements.forEach((element, index) => {
        element.classList.add('abcjs-initialized');
        
        const abcText = element.textContent.trim();
        const containerId = `abcjs-score-${Date.now()}-${index}`;
        const audioId = `abcjs-audio-${Date.now()}-${index}`;
        
        // 创建包装容器
        const wrapper = document.createElement('div');
        wrapper.className = 'abcjs-wrapper';
        wrapper.style.margin = '20px 0';
        wrapper.style.padding = '20px';
        wrapper.style.background = 'var(--card-bg)';
        wrapper.style.borderRadius = '8px';
        wrapper.style.boxShadow = 'var(--box-shadow)';
        
        // 创建播放控制栏
        const controls = document.createElement('div');
        controls.className = 'abcjs-controls';
        controls.style.marginBottom = '15px';
        controls.style.display = 'flex';
        controls.style.gap = '10px';
        controls.style.alignItems = 'center';
        controls.style.flexWrap = 'wrap';
        
        // 播放按钮
        const playBtn = document.createElement('button');
        playBtn.textContent = '播放';
        playBtn.className = 'btn';
        playBtn.style.background = 'var(--btn-bg)';
        playBtn.style.color = 'var(--btn-color)';
        playBtn.style.border = 'none';
        playBtn.style.padding = '6px 12px';
        playBtn.style.borderRadius = '4px';
        playBtn.style.cursor = 'pointer';
        
        // 暂停按钮
        const pauseBtn = document.createElement('button');
        pauseBtn.textContent = '暂停';
        pauseBtn.className = 'btn';
        pauseBtn.style.background = 'var(--btn-bg)';
        pauseBtn.style.color = 'var(--btn-color)';
        pauseBtn.style.border = 'none';
        pauseBtn.style.padding = '6px 12px';
        pauseBtn.style.borderRadius = '4px';
        pauseBtn.style.cursor = 'pointer';
        pauseBtn.disabled = true;
        
        // 停止按钮
        const stopBtn = document.createElement('button');
        stopBtn.textContent = '停止';
        stopBtn.className = 'btn';
        stopBtn.style.background = 'var(--btn-bg)';
        stopBtn.style.color = 'var(--btn-color)';
        stopBtn.style.border = 'none';
        stopBtn.style.padding = '6px 12px';
        stopBtn.style.borderRadius = '4px';
        stopBtn.style.cursor = 'pointer';
        stopBtn.disabled = true;
        
        // 速度控制
        const speedControl = document.createElement('div');
        speedControl.style.display = 'flex';
        speedControl.style.alignItems = 'center';
        speedControl.style.gap = '8px';
        speedControl.style.marginLeft = 'auto';
        
        const speedLabel = document.createElement('span');
        speedLabel.textContent = '速度:';
        speedLabel.style.fontSize = '14px';
        speedLabel.style.color = 'var(--text-color)';
        
        const speedSlider = document.createElement('input');
        speedSlider.type = 'range';
        speedSlider.min = 60;
        speedSlider.max = 200;
        speedSlider.value = 120;
        speedSlider.style.width = '100px';
        
        const speedValue = document.createElement('span');
        speedValue.textContent = '120 BPM';
        speedValue.style.fontSize = '14px';
        speedValue.style.color = 'var(--text-color)';
        speedValue.style.minWidth = '60px';
        
        speedControl.appendChild(speedLabel);
        speedControl.appendChild(speedSlider);
        speedControl.appendChild(speedValue);
        
        // 添加按钮到控制栏
        controls.appendChild(playBtn);
        controls.appendChild(pauseBtn);
        controls.appendChild(stopBtn);
        controls.appendChild(speedControl);
        
        // 创建隐藏的音频容器
        const audioContainer = document.createElement('div');
        audioContainer.id = audioId;
        audioContainer.style.display = 'none';
        
        // 创建乐谱容器
        const scoreContainer = document.createElement('div');
        scoreContainer.id = containerId;
        
        // 组装所有元素
        wrapper.appendChild(controls);
        wrapper.appendChild(audioContainer);
        wrapper.appendChild(scoreContainer);
        element.parentNode.replaceChild(wrapper, element);
        
        // 全局变量
        let synthControl = null;
        let createSynth = null;
        let visualObj = null;
        let isPlaying = false;
        let isInitialized = false;
        
        // 渲染乐谱
        function renderScore() {
            const options = {
                responsive: "resize",
                staffwidth: Math.min(700, wrapper.offsetWidth - 40),
                add_classes: true,
                scale: 1.1,
                clickListener: function(abcElem) {
                    if (synthControl && isPlaying) {
                        synthControl.seek(abcElem.startChar);
                    }
                }
            };
            
            visualObj = ABCJS.renderAbc(containerId, abcText, options)[0];
        }
        
        // 完全停止并销毁所有音频资源
        function hardStop() {
            if (synthControl) {
                try {
                    synthControl.pause();
                    synthControl.stop();
                    
                    // 销毁音频上下文
                    if (synthControl.synth && synthControl.synth.audioContext) {
                        synthControl.synth.audioContext.close();
                    }
                } catch (e) {}
                synthControl = null;
            }
            
            if (createSynth) {
                createSynth = null;
            }
            
            // 清除高亮
            document.querySelectorAll(`#${containerId} .abcjs-note-highlight`).forEach(el => {
                el.classList.remove('abcjs-note-highlight');
            });
            
            // 重置状态
            isPlaying = false;
            isInitialized = false;
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            playBtn.textContent = '播放';
        }
        
        // 按照官方流程初始化音频
        async function initAudio() {
            if (isInitialized) return true;
            
            try {
                // 检查浏览器音频支持
                if (!ABCJS.synth.supportsAudio()) {
                    throw new Error("您的浏览器不支持Web Audio API");
                }
                
                // 1. 创建合成器控制器（官方步骤1）
                synthControl = new ABCJS.synth.SynthController();
                
                synthControl.load(`#${audioId}`, null, {
                    displayLoop: false,
                    displayRestart: false,
                    displayPlay: false,
                    displayProgress: false,
                    displayWarp: false,
                    qpm: parseInt(speedSlider.value)
                });
                
                // 2. 创建合成器实例（官方步骤2 - 关键！）
                createSynth = new ABCJS.synth.CreateSynth();
                
                // 3. 初始化合成器（官方步骤3 - 关键！）
                await createSynth.init({
                    visualObj: visualObj,
                    qpm: parseInt(speedSlider.value)
                });
                
                // 4. 设置要播放的乐谱（官方步骤4）
                await synthControl.setTune(visualObj, false, {
                    onEvent: function(ev) {
                        if (ev.measureStart && ev.left === null) return;
                        
                        document.querySelectorAll(`#${containerId} .abcjs-note-highlight`).forEach(el => {
                            el.classList.remove('abcjs-note-highlight');
                        });
                        
                        if (ev.elements) {
                            ev.elements.forEach(el => {
                                el.classList.add('abcjs-note-highlight');
                            });
                        }
                    },
                    onFinished: function() {
                        hardStop();
                    }
                });
                
                isInitialized = true;
                return true;
            } catch (error) {
                console.error('音频初始化失败:', error);
                alert('音频初始化失败: ' + error.message);
                hardStop();
                return false;
            }
        }
        
        // 播放按钮事件
        playBtn.addEventListener('click', async function() {
            if (isPlaying) {
                // 暂停状态下点击继续
                synthControl.play();
                isPlaying = true;
                playBtn.disabled = true;
                pauseBtn.disabled = false;
                return;
            }
            
            // 第一次点击或停止后重新初始化
            const success = await initAudio();
            if (!success) return;
            
            synthControl.play();
            isPlaying = true;
            playBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
        });
        
        // 暂停按钮事件
        pauseBtn.addEventListener('click', function() {
            if (synthControl) {
                synthControl.pause();
                isPlaying = false;
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                playBtn.textContent = '继续';
            }
        });
        
        // 停止按钮事件
        stopBtn.addEventListener('click', function() {
            hardStop();
        });
        
        // 速度滑块事件
        speedSlider.addEventListener('input', function() {
            const speed = parseInt(this.value);
            speedValue.textContent = speed + ' BPM';
            if (synthControl && isInitialized) {
                synthControl.setQpm(speed);
            }
        });
        
        // 渲染乐谱
        renderScore();
        
        // 监听深色模式切换
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderScore);
        }
    });
    
    // 添加全局CSS样式
    if (!document.getElementById('abcjs-global-style')) {
        const style = document.createElement('style');
        style.id = 'abcjs-global-style';
        style.textContent = `
            .abcjs-note-highlight {
                fill: #ff4444 !important;
                stroke: #ff4444 !important;
            }
            .abcjs-staff-line {
                stroke: var(--text-color-secondary) !important;
            }
            .abcjs-note {
                fill: var(--text-color) !important;
            }
            .abcjs-clef, .abcjs-time-signature, .abcjs-key-signature {
                fill: var(--text-color) !important;
                stroke: var(--text-color) !important;
            }
            .abcjs-controls .btn:hover {
                filter: brightness(0.9);
            }
            .abcjs-controls .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }
};

// 脚本加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initAbcjsPlayer);
} else {
    window.initAbcjsPlayer();
}
