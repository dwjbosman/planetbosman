webpackJsonp([0x7ca6a79c9122],{467:function(e,n){e.exports={data:{markdownRemark:{html:'<script data-my-script="" type="text/javascript">requirejs.config({paths: { \'plotly\': [\'https://cdn.plot.ly/plotly-latest.min\']},});if(!window.Plotly) {{require([\'plotly\'],function(plotly) {window.Plotly=plotly;});}}</script>\n<p>This summer I have been reading a book on VHDL 2008: "Effective Coding with VHDL" from Ricardo Jasinski. Although not for beginners I can recommend this book to anyone with some knowledge of FPGA\'s and general programming skills. To get some practical experience I obtained two dev kits:  </p>\n<ul>\n<li>A Zedboard dev kit containing an Xilinx Zync (<a href="https://reference.digilentinc.com/_media/zedboard:zedboard_ug.pdf">https://reference.digilentinc.com/<em>media/zedboard:zedboard</em>ug.pdf</a>)</li>\n<li>A Nexys4-DDR with Xylinx Artix-7 from Digilent (<a href="https://reference.digilentinc.com/_media/nexys4-ddr:nexys4ddr_rm.pdf">https://reference.digilentinc.com/<em>media/nexys4-ddr:nexys4ddr</em>rm.pdf</a>). </li>\n</ul>\n<p>Digilent also sells PMOD modules which are extension modules containing specialized IO chips. I took the I2S2 DA/AD board (<a href="https://reference.digilentinc.com/reference/pmod/pmodi2s2/reference-manual">https://reference.digilentinc.com/reference/pmod/pmodi2s2/reference-manual</a>) with I2S interface. It can sample as well as playback audio wave data via a simple I2S protocol. It is based on the CS4344 (<a href="https://www.cirrus.com/products/cs4344-45-48/">https://www.cirrus.com/products/cs4344-45-48/</a>) and CS5343 chips from Cypress. In this article I focus on the CS4344 DA converter.</p>\n<p>Using the I2S board is relatively simple when compared with for example the audio chip embedded on the Zedboard. That chip supports a complex signal path with many registers. Setting one of the registers to a wrong value will quickly result in no audio output. Debugging would to take a lot of effort for a first project. The CS4344 however is very simple. It has an I2S interface and no registers to set. Even its datasheet is short :) I can simulate the VHDL on fore hand before flashing and check the output I2S waveform. If that is correct the audio chip will produce sound.</p>\n<p>The roadmap of my project is as follows:</p>\n<ol>\n<li>First produce a square wave with a specific frequency.</li>\n<li>Produce a single sine wave with a specific frequency.</li>\n<li>Implement I2S AD reception and loopback to the DA output.</li>\n<li>Implement an additive synthesis engine based on a bandwidth enhanced sine model. There is an interesting course on Coursera on this topic: <a href="https://www.coursera.org/learn/audio-signal-processing/home/welcome">https://www.coursera.org/learn/audio-signal-processing/home/welcome</a></li>\n<li>Control the synthesis parameters from a soft core.</li>\n<li>Run Linux (Yocto) on a soft core and control the synthesis engine with a Linux device driver.</li>\n</ol>\n<p>So I have a long way to go. In this article I will focus on step 1.</p>\n<h1 id="i2s"><a href="#i2s" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>I2S</h1>\n<p>How does I2S work? Have a look at the following schematic:</p>\n<p>\n  <a\n    class="gatsby-resp-image-link"\n    href="/static/i2s-06532f98f4d256d0c6ed0231cad6b67a-f755b.png"\n    style="display: block"\n    target="_blank"\n    rel="noopener"\n  >\n  \n  <span\n    class="gatsby-resp-image-wrapper"\n    style="position: relative; display: block; ; max-width: 401px; margin-left: auto; margin-right: auto;"\n  >\n    <span\n      class="gatsby-resp-image-background-image"\n      style="padding-bottom: 38.90274314214464%; position: relative; bottom: 0; left: 0; background-image: url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAICAIAAAB2/0i6AAAACXBIWXMAAAsSAAALEgHS3X78AAABHElEQVQY022Q2VaDQBBE8/8/5YlGX8ETTSJbgMzKMqwBwhYLguiD/XCZUzPV1fTmPlff9/+ybdtxHIdh+Mv7T224CBgXluWAtg1y2z4LGYBcSOig6/mgN1GAbdctZjSTMsiyHFXVdZ4XVfVgVRTF9QqWYBTFcayix0cli9m/kLIsGeNJkuACZ9zOnM5hGIKXC0HrVUff32RIaZrCLIRUSkkp8QJEDKU0ngvp8OPlNOBq5lxgGMMwXdc7nb40Td8+vyLq83AkhGj6O2Nsv/84HI4vuzdd15+2OwQs5vs4mJZDKcvysq5rLBn7BLMsNUwritWqNE0D+p6P1irNJjMGw4S+TxznnMwSqrndCKVCCNtx8asPses6rJZQturfCze/rd9wDgcAAAAASUVORK5CYII=\'); background-size: cover; display: block;"\n    >\n      <img\n        class="gatsby-resp-image-image"\n        style="width: 100%; height: 100%; margin: 0; vertical-align: middle; position: absolute; top: 0; left: 0; box-shadow: inset 0px 0px 0px 400px white;"\n        alt="alt text"\n        title="Logo Title Text 1"\n        src="/static/i2s-06532f98f4d256d0c6ed0231cad6b67a-f755b.png"\n        srcset="/static/i2s-06532f98f4d256d0c6ed0231cad6b67a-ed329.png 300w,\n/static/i2s-06532f98f4d256d0c6ed0231cad6b67a-f755b.png 401w"\n        sizes="(max-width: 401px) 100vw, 401px"\n      />\n    </span>\n  </span>\n  \n  </a>\n    </p>\n<p>Note that the CS4344 datasheet uses LRCK as WS and SDIN as SD. Furthermore it uses an extra clock signal MCLK. In my FPGA design I use the Xilinx Clock wizard to generate MCLK. The other signals are generated by the FPGA i2s_sender component introduced in this article.</p>\n<h2 id="parameters"><a href="#parameters" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>parameters</h2>\n<p>The CS4344 datasheet shows a few examples of different clock parameters.</p>\n<p>First I defined a package for some constants:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>    package types_pkg is    \n        constant MCLK_FREQ : integer := 18432000; in Hz\n        -- 48Khz sample rate\n        constant LRCK_FREQ : integer := 48000; -- MCLK/384\n        --24 bits per LRCK phase (low = left channel, high = right channel_\n        constant SCLK_FREQ : integer := LRCK_FREQ*48;\n        constant SAMPLE_WIDTH : integer := 24;\n\n        subtype sample_t is signed(SAMPLE_WIDTH-1 downto 0);\n    end;</code></pre>\n      </div>\n<h2 id="i2s-interface"><a href="#i2s-interface" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>i2s interface</h2>\n<p>The interface of the i2s_sender is as follows:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>    entity i2s_sender is\n        --wave_x_in are sampled at the rising edge of MCLK\n        Port ( \n               resetn : in std_logic;\n               MCLK_in : in std_logic;\n               LRCK_out : out std_logic;\n               SCLK_out : out std_logic;\n               SDIN_out : out std_logic;\n               wave_left_in : in sample_t; \n               wave_right_in : in sample_t\n        );\n    end i2s_sender;</code></pre>\n      </div>\n<p>The LRCK, SCLK signal and SDIN signals will be fed to the CS4344 chip. The wave_in samples must be generated by some other FPGA component.</p>\n<p>Next the logic of the i2s_sender. There are two processes. One process generates the required clocks LRCK and SCLK from MCLK. The other process generates SDIN based on SCLK.</p>\n<h2 id="generation-of-the-clocks"><a href="#generation-of-the-clocks" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Generation of the clocks</h2>\n<h3 id="clock-dividing"><a href="#clock-dividing" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Clock dividing</h3>\n<p>The clocks are generated by dividing (counting the number edges of) MCLK.</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>--Change level every _DIV ticks of MCLK\nconstant LRCK_DIV : integer := (MCLK_FREQ / (LRCK_FREQ*2)) -1; -- 384/2 -1 = 161\nconstant SCLK_DIV : integer := (MCLK_FREQ / (SCLK_FREQ*2)) -1; \n\n--types for various counters\nsubtype div_LRCK_t  is integer range 0 to LRCK_DIV; \nsubtype div_SCLK_t  is integer range 0 to SCLK_DIV; \n\n--count the number of MCLK ticks before toggling LRCK    \nsignal LRCK_cnt : div_LRCK_t;\n--count the number of MCLK ticks before toggling SCLK\nsignal SCLK_cnt : div_SCLK_t;\n\n--count the number of SCLK periods after LRCK went low\nsignal SDIN_cnt : integer range 0 to (SAMPLE_WIDTH*2-1);\n    \n--wave_x_in are sampled at the rising edge of MCLK\nsignal wave_left : sample_t := (others => \'0\');\nsignal wave_right: sample_t := (others => \'0\');  \n      \nsignal shift_reg: std_logic_vector(SAMPLE_WIDTH-1 downto 0);</code></pre>\n      </div>\n<h3 id="counters"><a href="#counters" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Counters</h3>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>     if MCLK_in\'event and MCLK_in = \'1\' then -- Rising clock edge\n        -- MCLK == 18.4320 Mhz\n        -- LRCK = MCLK / 384 = 48khz = Fs\n        -- SCLK = 48 * Fs = MCLK/8\n        if LRCK_cnt = LRCK_DIV then\n            LRCK_cnt <=0;\n            if LRCK_out = \'1\' then\n                --falling edge\n                --assert: SCLK will go low\n                LRCK_out <= \'0\';\n                SDIN_cnt <= 0;\n            else\n                -- rising edge\n                --assert: SCLK will go low\n                LRCK_out <= \'1\';\n                SDIN_cnt <= SAMPLE_WIDTH;\n            end if;\n        else\n            if (SCLK_cnt = SCLK_DIV) and (SCLK_out=\'1\') then\n                --SCLK will go low\n                SDIN_cnt <= SDIN_cnt + 1;\n            end if;                            \n            LRCK_cnt <= LRCK_cnt + 1;  \n        end if;\n        \n        if SCLK_cnt = SCLK_DIV then\n            SCLK_cnt <=0;\n            SCLK_out <= not SCLK_out;\n        else\n            SCLK_cnt <= SCLK_cnt + 1;  \n        end if;</code></pre>\n      </div>\n<h2 id="generation-of-the-sdin-signal"><a href="#generation-of-the-sdin-signal" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Generation of the SDIN signal</h2>\n<p>The SDIN signal contains the bits of the input wave signal. One bit is shifted out every SCLK clock. The left sample should be shifted out when LRCK is low. The right sample is shifted out when LRCK is high. A first approach was to create a process that acts both on the rising edge of LRCK as well as the falling edge. This doesn\'t work however as flip flops which are used to implement the design cannot trigger on both clock edges. As a solution I now count the number of SCLK clocks after the falling edge of LRCK. </p>\n<ul>\n<li>\n<p>SCLK_cnt = 1..25 outputs the left sample</p>\n</li>\n<li>\n<p>SCLK_cnt = 25..48 outputs the right sample</p>\n</li>\n<li>\n<p>The last bit of the right channel sample is shifted out at SCLK_cnt=0</p>\n</li>\n<li>\n<p>The shifted out bit is sampled by the CS4344 at the rising edge of SCLK</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>if SCLK_out\'event and SCLK_out = \'0\' then -- Falling clock edge                \n        if SDIN_cnt=0 then\n            -- load shift register\n            shift_reg <= std_logic_vector(wave_left); \n        elsif SDIN_cnt=24 then\n            shift_reg <= std_logic_vector(wave_right);\n        else \n            shift_reg <= shift_reg(shift_reg\'HIGH-1 downto 0) & \'0\';\n        end if;\n        SDIN_out <= shift_reg(shift_reg\'HIGH);\nend if;</code></pre>\n      </div>\n</li>\n</ul>\n<h2 id="top-level-component"><a href="#top-level-component" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Top level component</h2>\n<p>For testing the top level component connects a square waveform generator to the i2s<em>sender. The i2s</em>sender output is connected to the FPGA output pins. If the PMOD modules is plugged into the JA port. The following contraints can be used for the Nexys 4 DDR dev kit.</p>\n<p>  set<em>property -dict {PACKAGE</em>PIN C17 IOSTANDARD LVCMOS33} [get<em>ports MCLK</em>out]\nset<em>property -dict {PACKAGE</em>PIN D18 IOSTANDARD LVCMOS33} [get<em>ports LRCK</em>out]\nset<em>property -dict {PACKAGE</em>PIN E18 IOSTANDARD LVCMOS33} [get<em>ports SCLK</em>out]\nset<em>property -dict {PACKAGE</em>PIN G17 IOSTANDARD LVCMOS33} [get<em>ports SDIN</em>out]</p>\n<h2 id="debugging"><a href="#debugging" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Debugging</h2>\n<p>During simulation it is helpfull to print out all the calculated values to make sure that they are correct. It is also possible to view them in Vivado simulation objects pane. I added the following to i2s<em>sender to print out the values.\n<br>\ndebug : process (dummy) is\nbegin\n--print the dividers when in simulation mode\nreport "MCLK</em>FREQ hz " &#x26; integer\'image(MCLK<em>FREQ);\nreport "LRCK</em>FREQ hz " &#x26; integer\'image(LRCK<em>FREQ);\nreport "SCLK</em>FREQ hz " &#x26; integer\'image(SCLK<em>FREQ);\nreport "SAMPLE</em>WIDTH " &#x26; integer\'image(SAMPLE_WIDTH);</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>    report "LRCK_DIV" & integer\'image(LRCK_DIV);\n    report "SCLK_DIV" & integer\'image(SCLK_DIV);\nend process;</code></pre>\n      </div>\n<p>During development at some point the simulation signal output seemed correct. However after synthesis no audio was output. A first debug approach was to count the number of eg. SCLK edges and connect that counter to the LEDs of the development kit. By setting the width of the counter correctly and displaying the most significant bits of the counter I was able to check if for example LRCK was indeed toggling at 48 kHz. </p>\n<p>Another approach is to add an ILA debug core to your design and connect the output pins of the designed component to the debug core. This way you can see if the synthesized design on the FPGA behaves as expected.</p>\n<p>In order to test the component I created a simple square waveform generator that generates a left channel signal at 440 Hz and a right channel signal at 880 Hz. This generator was hooked up to the i2s_sender.</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>resetn <= \'0\', \'1\' after 100ns;\nclock <= not clock after 10 ns;\nMCLK <= not MCLK after 54.253472222222 ns; -- 18.4320 Mhz\n\nsqwv : entity work.square_wave\n    port map (\n     resetn => resetn,\n     MCLK_in => MCLK,\n     wave_left_out => wave_left,\n     wave_right_out => wave_right\n    );\n         \ni2s : entity work.i2s_sender\n        port map (\n        MCLK_in => MCLK,\n        resetn => resetn,\n        LRCK_out => LRCK,\n        SCLK_out => SCLK,\n        SDIN_out => SDIN,\n        wave_left_in => wave_left,\n        wave_right_in => wave_right\n        );    </code></pre>\n      </div>\n<p>Below outputs of the I2S waveform at the start of a new LRCK cycle (left channel) and starting at the rising edge of LRCK (right channel).</p>\n<p><a href="">lrck1.png</a></p>\n<h1 id="conclusion"><a href="#conclusion" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Conclusion</h1>\n<p>Some things I noticed while experimenting with VHDL 2008 and Xilinx Vivado:</p>\n<ul>\n<li>Lack of support of some VHDL 2008 features in Vivado.</li>\n<li>Vivado spews out a large number of warnings. It\'s not easy to see which warnings are important and which are not.</li>\n<li>Eventhough simulation is running fine the synthesized result can still be wrong.</li>\n<li>The Cypress CS4344 datasheet\'s I2S waveform specification is not very clear. It does not show that the last bit of the previous sample is clocked in at the first rising SCLK after LRCK phase change.</li>\n</ul>',timeToRead:7,excerpt:'This summer I have been reading a book on VHDL 2008: "Effective Coding with VHDL" from Ricardo Jasinski. Although not for beginners I can…',frontmatter:{title:"VHDL i2s transmitter",cover:"/logos/wave.jpg",date:"2018-09-14 22:00",category:"Hardware",tags:["VHDL FPGA DSP"]},fields:{nextTitle:"VHDL i2s transmitter",nextSlug:"/vhdl-i-2-s-transmitter",prevTitle:"VHDL i2s transmitter",prevSlug:"/vhdl-i-2-s-transmitter",slug:"/vhdl-i-2-s-transmitter"}}},pathContext:{slug:"/vhdl-i-2-s-transmitter"}}}});
//# sourceMappingURL=path---vhdl-i-2-s-transmitter-94b7f8a7594dc5f48790.js.map