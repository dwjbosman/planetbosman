webpackJsonp([0x7ca6a79c9122],{472:function(e,t){e.exports={data:{markdownRemark:{html:'<p>This summer I have been reading a book on VHDL 2008: "Effective Coding with VHDL" from Ricardo Jasinski. Although not for beginners I can recommend this book to anyone with some knowledge of FPGA\'s and general programming skills. To get some practical experience I obtained two dev kits:  </p>\n<ul>\n<li>A <a href="https://reference.digilentinc.com/_media/zedboard:zedboard_ug.pdf">Zedboard</a> dev kit containing an Xilinx Zync </li>\n<li>A <a href="https://reference.digilentinc.com/_media/nexys4-ddr:nexys4ddr_rm.pdf">Nexys4-DDR</a> with Xylinx Artix-7 from Digilent </li>\n</ul>\n<p>Digilent also sells PMOD modules which are extension modules containing specialized IO chips. I bought the <a href="https://reference.digilentinc.com/reference/pmod/pmodi2s2/reference-manual">I2S2 DA/AD board</a> with I2S interface. It can sample as well as playback audio wave data via a simple I2S protocol. It is based on the <a href="https://www.cirrus.com/products/cs4344-45-48/">CS4344</a> and CS5343 chips from Cypress. In this article I focus on the CS4344 DA converter.</p>\n<p>Using the I2S board is relatively simple when compared with for example the audio chip embedded on the Zedboard. That chip supports a complex signal path with many registers. Setting one of the registers to a wrong value will quickly result in no audio output. Debugging would to take a lot of effort for a first project. The CS4344 however is very simple. It has an I2S interface and no registers to set. Even its datasheet is short :) I can simulate the VHDL on fore hand before flashing and check the output I2S waveform. If that is correct the audio chip will produce sound.</p>\n<p>The roadmap of my project is as follows:</p>\n<ol>\n<li>First produce a square wave with a specific frequency.</li>\n<li>Produce a single sine wave with a specific frequency.</li>\n<li>Implement I2S AD reception and loopback to the DA output.</li>\n<li>Implement an additive synthesis engine based on a bandwidth enhanced sine model. There is an interesting course on <a href="https://www.coursera.org/learn/audio-signal-processing/home/welcome">Coursera</a></li>\n<li>Control the synthesis parameters from a soft core.</li>\n<li>Run Linux (Yocto) on a soft core and control the synthesis engine with a Linux device driver.</li>\n</ol>\n<p>So I have a long way to go. In this article I will focus on step 1.</p>\n<h1>I2S</h1>\n<p>How does I2S work? Have a look at the following schematic:</p>\n<p><img src="doc_resources/i2s.png" alt="I2S protocol" title="I2S protocol"></p>\n<p>Note that the CS4344 datasheet uses LRCK as WS and SDIN as SD. Furthermore it uses an extra clock signal MCLK. In my FPGA design I use the Xilinx Clock wizard to generate MCLK. The other signals are generated by the FPGA i2s_sender component introduced in this article.</p>\n<h2>parameters</h2>\n<p>The CS4344 datasheet shows a few examples of different clock parameters.</p>\n<p>First I defined a package for some constants:</p>\n<pre><code>    package types_pkg is    \n        constant MCLK_FREQ : integer := 18432000; in Hz\n        -- 48Khz sample rate\n        constant LRCK_FREQ : integer := 48000; -- MCLK/384\n        --24 bits per LRCK phase (low = left channel, high = right channel_\n        constant SCLK_FREQ : integer := LRCK_FREQ*48;\n        constant SAMPLE_WIDTH : integer := 24;\n\n        subtype sample_t is signed(SAMPLE_WIDTH-1 downto 0);\n    end;\n</code></pre>\n<h2>i2s interface</h2>\n<p>The interface of the i2s_sender is as follows:</p>\n<pre><code>    entity i2s_sender is\n        --wave_x_in are sampled at the rising edge of MCLK\n        Port ( \n               resetn : in std_logic;\n               MCLK_in : in std_logic;\n               LRCK_out : out std_logic;\n               SCLK_out : out std_logic;\n               SDIN_out : out std_logic;\n               wave_left_in : in sample_t; \n               wave_right_in : in sample_t\n        );\n    end i2s_sender;\n</code></pre>\n<p>The LRCK, SCLK signal and SDIN signals will be fed to the CS4344 chip. The wave_in samples must be generated by some other FPGA component.</p>\n<p>Next the logic of the i2s_sender. There are two processes. One process generates the required clocks LRCK and SCLK from MCLK. The other process generates SDIN based on SCLK.</p>\n<h2>Generation of the clocks</h2>\n<p>The clocks are generated by dividing (counting the number edges of) MCLK.</p>\n<h3>Clock dividing</h3>\n<p>For each generated clock (LRCK, SCLK) the value at which the counter should toggle a derived clock is calculated.  The frequency is multiplied by 2 because there are two transition in one clock period. </p>\n<pre><code>--Change level every _DIV ticks of MCLK\nconstant LRCK_DIV : integer := (MCLK_FREQ / (LRCK_FREQ*2)) -1; -- 384/2 -1 = 161\nconstant SCLK_DIV : integer := (MCLK_FREQ / (SCLK_FREQ*2)) -1; \n\n--types for various counters\nsubtype div_LRCK_t  is integer range 0 to LRCK_DIV; \nsubtype div_SCLK_t  is integer range 0 to SCLK_DIV; \n\n--count the number of MCLK ticks before toggling LRCK    \nsignal LRCK_cnt : div_LRCK_t;\n--count the number of MCLK ticks before toggling SCLK\nsignal SCLK_cnt : div_SCLK_t;\n\n--count the number of SCLK periods after LRCK went low\nsignal SDIN_cnt : integer range 0 to (SAMPLE_WIDTH*2-1);\n    \n--wave_x_in are sampled at the rising edge of MCLK\nsignal wave_left : sample_t := (others => \'0\');\nsignal wave_right: sample_t := (others => \'0\');  \n      \nsignal shift_reg: std_logic_vector(SAMPLE_WIDTH-1 downto 0);\n</code></pre>\n<h3>Counters</h3>\n<p>The counters are relatively simple. The count up to the divider value and then toggle a clock. Furthermore the moment LRCK toggles is also used to set the position of SDIN to either 0 or SAMPLE_WIDTH (24).</p>\n<p><strong>6-10-2018: There is a bug in the code below that allows it be simulated correctly. Synthesis however results in a bit shift, resulting in garbled audio output. The updated code is in the i2s_sender repo</strong></p>\n<pre><code>     if MCLK_in\'event and MCLK_in = \'1\' then -- Rising clock edge\n        -- MCLK == 18.4320 Mhz\n        -- LRCK = MCLK / 384 = 48khz = Fs\n        -- SCLK = 48 * Fs = MCLK/8\n        if LRCK_cnt = LRCK_DIV then\n            LRCK_cnt &#x3C;=0;\n            if LRCK_out = \'1\' then\n                --falling edge\n                --assert: SCLK will go low\n                LRCK_out &#x3C;= \'0\';\n                SDIN_cnt &#x3C;= 0;\n            else\n                -- rising edge\n                --assert: SCLK will go low\n                LRCK_out &#x3C;= \'1\';\n                SDIN_cnt &#x3C;= SAMPLE_WIDTH;\n            end if;\n        else\n            if (SCLK_cnt = SCLK_DIV) and (SCLK_out=\'1\') then\n                --SCLK will go low\n                SDIN_cnt &#x3C;= SDIN_cnt + 1;\n            end if;                            \n            LRCK_cnt &#x3C;= LRCK_cnt + 1;  \n        end if;\n        \n        if SCLK_cnt = SCLK_DIV then\n            SCLK_cnt &#x3C;=0;\n            SCLK_out &#x3C;= not SCLK_out;\n        else\n            SCLK_cnt &#x3C;= SCLK_cnt + 1;  \n        end if;\n</code></pre>\n<h2>Generation of the SDIN signal</h2>\n<p>The SDIN signal contains the bits of the input wave signal. One bit is shifted out every SCLK clock. The left sample should be shifted out when LRCK is low. The right sample is shifted out when LRCK is high. A first approach was to create a process that acts both on the rising edge of LRCK as well as the falling edge. This doesn\'t work however as flip flops which are used to implement the design cannot trigger on both clock edges. As a solution I now count the number of SCLK clocks after the falling edge of LRCK. </p>\n<ul>\n<li>\n<p>SCLK_cnt = 1..25 outputs the left sample</p>\n</li>\n<li>\n<p>SCLK_cnt = 25..48 outputs the right sample</p>\n</li>\n<li>\n<p>The last bit of the right channel sample is shifted out at SCLK_cnt=0</p>\n</li>\n<li>\n<p>The shifted out bit is sampled by the CS4344 at the rising edge of SCLK</p>\n<pre><code>if SCLK_out\'event and SCLK_out = \'0\' then -- Falling clock edge                \n        if SDIN_cnt=0 then\n            -- load shift register\n            shift_reg &#x3C;= std_logic_vector(wave_left); \n        elsif SDIN_cnt=24 then\n            shift_reg &#x3C;= std_logic_vector(wave_right);\n        else \n            shift_reg &#x3C;= shift_reg(shift_reg\'HIGH-1 downto 0) &#x26; \'0\';\n        end if;\n        SDIN_out &#x3C;= shift_reg(shift_reg\'HIGH);\nend if;\n</code></pre>\n</li>\n</ul>\n<h2>Top level component</h2>\n<p>For testing the top level component connects a square waveform generator to the i2s_sender. The i2s_sender output is connected to the FPGA output pins. If the PMOD modules is plugged into the JA port. The following contraints can be used for the Nexys 4 DDR dev kit.</p>\n<pre><code>set_property -dict {PACKAGE_PIN C17 IOSTANDARD LVCMOS33} [get_ports MCLK_out]\nset_property -dict {PACKAGE_PIN D18 IOSTANDARD LVCMOS33} [get_ports LRCK_out]\nset_property -dict {PACKAGE_PIN E18 IOSTANDARD LVCMOS33} [get_ports SCLK_out]\nset_property -dict {PACKAGE_PIN G17 IOSTANDARD LVCMOS33} [get_ports SDIN_out]\n</code></pre>\n<h2>Debugging</h2>\n<p>During simulation it is helpfull to print out all the calculated values to make sure that they are correct. It is also possible to view them in Vivado simulation objects pane. I added the following to i2s_sender to print out the values.\n<br>\ndebug : process (dummy) is\nbegin\n--print the dividers when in simulation mode\nreport "MCLK<em>FREQ hz " &#x26; integer\'image(MCLK</em>FREQ);\nreport "LRCK<em>FREQ hz " &#x26; integer\'image(LRCK</em>FREQ);\nreport "SCLK<em>FREQ hz " &#x26; integer\'image(SCLK</em>FREQ);\nreport "SAMPLE<em>WIDTH " &#x26; integer\'image(SAMPLE</em>WIDTH);</p>\n<pre><code>    report "LRCK_DIV" &#x26; integer\'image(LRCK_DIV);\n    report "SCLK_DIV" &#x26; integer\'image(SCLK_DIV);\nend process;\n</code></pre>\n<p>During development at some point the simulation signal output seemed correct. However after synthesis no audio was output. A first debug approach was to count the number of eg. SCLK edges and connect that counter to the LEDs of the development kit. By setting the width of the counter correctly and displaying the most significant bits of the counter I was able to check if for example LRCK was indeed toggling at 48 kHz. </p>\n<p>Another approach is to add an ILA debug core to your design and connect the output pins of the designed component to the debug core. This way you can see if the synthesized design on the FPGA behaves as expected.</p>\n<p>In order to test the component I created a simple square waveform generator that generates a left channel signal at 440 Hz and a right channel signal at 880 Hz. This generator was hooked up to the i2s_sender.</p>\n<pre><code>resetn &#x3C;= \'0\', \'1\' after 100ns;\nclock &#x3C;= not clock after 10 ns;\nMCLK &#x3C;= not MCLK after 54.253472222222 ns; -- 18.4320 Mhz\n\nsqwv : entity work.square_wave\n    port map (\n     resetn => resetn,\n     MCLK_in => MCLK,\n     wave_left_out => wave_left,\n     wave_right_out => wave_right\n    );\n         \ni2s : entity work.i2s_sender\n        port map (\n        MCLK_in => MCLK,\n        resetn => resetn,\n        LRCK_out => LRCK,\n        SCLK_out => SCLK,\n        SDIN_out => SDIN,\n        wave_left_in => wave_left,\n        wave_right_in => wave_right\n        );    \n</code></pre>\n<p>Below outputs of the I2S waveform at the start of a new LRCK cycle (left channel) </p>\n<p><img src="doc_resources/lrck1.png" alt="LRCK left channel" title="LRCK left channel"></p>\n<p>Below outputs of the I2S waveform at the start of the rising edge of LRCK (right channel).</p>\n<p><img src="doc_resources/lrck2.png" alt="LRCK right channel" title="LRCK right channel"></p>\n<h1>Conclusion</h1>\n<p>Some things I noticed while experimenting with VHDL 2008 and Xilinx Vivado:</p>\n<ul>\n<li>Lack of support of some VHDL 2008 features in Vivado.</li>\n<li>Vivado spews out a large number of warnings. It\'s not easy to see which warnings are important and which are not.</li>\n<li>Eventhough simulation is running fine the synthesized result can still be wrong.</li>\n<li>The Cypress CS4344 datasheet\'s I2S waveform specification is not very clear. It does not show that the last bit of the previous sample is clocked in at the first rising SCLK after LRCK phase change.</li>\n</ul>\n<p>The files are available on <a href="https://github.com/dwjbosman/I2S_sender">github</a>. Version Control with Vivado is not trivial. I used <a href="https://github.com/barbedo/vivado-git">this approach</a> to handle version control.</p>',timeToRead:8,excerpt:'This summer I have been reading a book on VHDL 2008: "Effective Coding with VHDL" from Ricardo Jasinski. Although not for beginners I can…',frontmatter:{title:"VHDL i2s transmitter",cover:"/logos/wave.jpg",date:"2018-09-14 22:00",category:"FPGA",tags:["VHDL FPGA DSP"]},fields:{nextTitle:"VHDL sine wave oscillator",nextSlug:"/vhdl-sine-wave-oscillator",prevTitle:"Generating text using an LSTM neural network",prevSlug:"/generating-text-using-an-lstm-neural-network",slug:"/vhdl-i-2-s-transmitter"}}},pathContext:{slug:"/vhdl-i-2-s-transmitter"}}}});
//# sourceMappingURL=path---vhdl-i-2-s-transmitter-31fff3e3974c71371238.js.map